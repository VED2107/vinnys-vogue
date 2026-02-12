-- Admin stock adjustment RPC (transactional)

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
