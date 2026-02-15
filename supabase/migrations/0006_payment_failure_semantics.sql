DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'payment_status'
  ) THEN
    CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'failed', 'refunded');
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'payment_status'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'payment_status'
      AND e.enumlabel = 'failed'
  ) THEN
    ALTER TYPE payment_status ADD VALUE 'failed';
  END IF;
END$$;

DO $$
DECLARE
  v_col_type text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'unpaid';
  ELSE
    SELECT udt_name
    INTO v_col_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'payment_status';

    IF v_col_type <> 'payment_status' THEN
      ALTER TABLE public.orders
        ALTER COLUMN payment_status TYPE payment_status
        USING payment_status::payment_status;
    END IF;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
ON public.orders(payment_status);
