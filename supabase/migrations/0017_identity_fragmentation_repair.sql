-- 0017_identity_fragmentation_repair.sql
-- One-time repair for fragmented identities (same email mapped to multiple auth.users IDs).
--
-- What this migration does:
-- 1) Finds duplicate auth.users records by normalized email
-- 2) Picks a canonical user_id per email (oldest created account)
-- 3) Repoints all public FK columns referencing auth.users(id) to canonical user_id
-- 4) Merges profile data into canonical profile id and repoints profile FKs
-- 5) Deletes duplicate auth.users rows
--
-- Safety:
-- - Only affects emails with duplicates (count > 1)
-- - Leaves canonical user untouched
-- - Uses dynamic FK discovery to avoid missing related tables

DO $$
DECLARE
  dup RECORD;
  fk_auth RECORD;
  fk_profile RECORD;
BEGIN
  FOR dup IN
    WITH ranked AS (
      SELECT
        u.id,
        lower(trim(u.email)) AS email_key,
        u.created_at,
        row_number() OVER (
          PARTITION BY lower(trim(u.email))
          ORDER BY u.created_at ASC, u.id ASC
        ) AS rn,
        first_value(u.id) OVER (
          PARTITION BY lower(trim(u.email))
          ORDER BY u.created_at ASC, u.id ASC
        ) AS canonical_user_id
      FROM auth.users u
      WHERE u.email IS NOT NULL
        AND trim(u.email) <> ''
    )
    SELECT email_key, canonical_user_id, id AS duplicate_user_id
    FROM ranked
    WHERE rn > 1
  LOOP
    RAISE NOTICE 'Merging duplicate identity for email=% duplicate=% canonical=%', dup.email_key, dup.duplicate_user_id, dup.canonical_user_id;

    -- Repoint every single-column FK in public schema that references auth.users(id)
    FOR fk_auth IN
      SELECT
        format('%I.%I', ns.nspname, cls.relname) AS fq_table,
        att.attname AS column_name
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      JOIN unnest(con.conkey) WITH ORDINALITY AS ck(attnum, ord) ON true
      JOIN pg_attribute att ON att.attrelid = cls.oid AND att.attnum = ck.attnum
      WHERE con.contype = 'f'
        AND con.confrelid = 'auth.users'::regclass
        AND ns.nspname = 'public'
        AND array_length(con.conkey, 1) = 1
    LOOP
      EXECUTE format(
        'UPDATE %s SET %I = $1 WHERE %I = $2',
        fk_auth.fq_table,
        fk_auth.column_name,
        fk_auth.column_name
      )
      USING dup.canonical_user_id, dup.duplicate_user_id;
    END LOOP;

    -- Ensure canonical profile row exists (copy from duplicate when absent)
    INSERT INTO public.profiles (
      id,
      email,
      phone,
      role,
      created_at,
      full_name,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country
    )
    SELECT
      dup.canonical_user_id,
      p.email,
      p.phone,
      p.role,
      p.created_at,
      p.full_name,
      p.address_line1,
      p.address_line2,
      p.city,
      p.state,
      p.postal_code,
      p.country
    FROM public.profiles p
    WHERE p.id = dup.duplicate_user_id
    ON CONFLICT (id) DO NOTHING;

    -- Merge profile fields when both canonical and duplicate profiles exist
    UPDATE public.profiles canon
    SET
      email = COALESCE(canon.email, dupe.email),
      phone = COALESCE(canon.phone, dupe.phone),
      role = CASE
        WHEN canon.role = 'admin' OR dupe.role = 'admin' THEN 'admin'
        ELSE canon.role
      END,
      full_name = COALESCE(canon.full_name, dupe.full_name),
      address_line1 = COALESCE(canon.address_line1, dupe.address_line1),
      address_line2 = COALESCE(canon.address_line2, dupe.address_line2),
      city = COALESCE(canon.city, dupe.city),
      state = COALESCE(canon.state, dupe.state),
      postal_code = COALESCE(canon.postal_code, dupe.postal_code),
      country = COALESCE(canon.country, dupe.country)
    FROM public.profiles dupe
    WHERE canon.id = dup.canonical_user_id
      AND dupe.id = dup.duplicate_user_id;

    -- Repoint every single-column FK in public schema that references profiles(id)
    FOR fk_profile IN
      SELECT
        format('%I.%I', ns.nspname, cls.relname) AS fq_table,
        att.attname AS column_name
      FROM pg_constraint con
      JOIN pg_class cls ON cls.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      JOIN unnest(con.conkey) WITH ORDINALITY AS ck(attnum, ord) ON true
      JOIN pg_attribute att ON att.attrelid = cls.oid AND att.attnum = ck.attnum
      WHERE con.contype = 'f'
        AND con.confrelid = 'public.profiles'::regclass
        AND ns.nspname = 'public'
        AND array_length(con.conkey, 1) = 1
    LOOP
      EXECUTE format(
        'UPDATE %s SET %I = $1 WHERE %I = $2',
        fk_profile.fq_table,
        fk_profile.column_name,
        fk_profile.column_name
      )
      USING dup.canonical_user_id, dup.duplicate_user_id;
    END LOOP;

    -- Remove duplicate profile row (canonical profile remains)
    DELETE FROM public.profiles
    WHERE id = dup.duplicate_user_id;

    -- Remove duplicate auth user row now that references are repointed
    DELETE FROM auth.users
    WHERE id = dup.duplicate_user_id;
  END LOOP;
END
$$;
