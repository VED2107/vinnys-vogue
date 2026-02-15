-- Admin stock adjustment RPC (transactional)

CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  change integer NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read inventory_logs" ON public.inventory_logs;
CREATE POLICY "Admin read inventory_logs"
ON public.inventory_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Service role full access" ON public.inventory_logs;
CREATE POLICY "Service role full access"
ON public.inventory_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

create or replace function public.admin_adjust_product_stock(
  p_product_id uuid,
  p_change integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  update public.products
    set stock = greatest(stock + p_change, 0),
        updated_at = now()
    where id = p_product_id;

  if not found then
    raise exception 'Product not found';
  end if;

  insert into public.inventory_logs (product_id, change, reason)
  values (p_product_id, p_change, p_reason);
end;
$$;

grant execute on function public.admin_adjust_product_stock(uuid, integer, text) to authenticated;
