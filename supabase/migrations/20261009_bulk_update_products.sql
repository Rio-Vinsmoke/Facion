-- FACION — Bulk Catalogue Update Procedure
-- Allows authenticated catalogue administrators to safely update product names,
-- prices, colors, and descriptions in a single transactional batch.

create or replace function public.bulk_update_catalogue_metadata(
  p_updates jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_updated_count integer := 0;
  v_item jsonb;
  v_id text;
  v_name text;
  v_price numeric;
  v_color text;
  v_desc text;
begin
  -- 1. Verify that the calling user has catalogue admin privileges
  if v_user_id is null then
    raise exception 'Authentication required: please sign in as an admin.';
  end if;

  select exists (
    select 1 from public.catalogue_admins where user_id = v_user_id
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Permission denied: catalogue admin authorization required.';
  end if;

  -- 2. Process each update entry safely
  for v_item in select * from jsonb_array_elements(p_updates)
  loop
    v_id := v_item->>'id';
    v_name := v_item->>'new_name';
    v_price := (v_item->>'new_price')::numeric;
    v_color := v_item->>'color';
    v_desc := v_item->>'description';

    if v_id is not null and v_name is not null and v_price is not null then
      update public.products
      set
        name = v_name,
        price = v_price,
        color = coalesce(v_color, color),
        description = coalesce(v_desc, description),
        updated_at = now()
      where id = v_id;

      if found then
        v_updated_count := v_updated_count + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count
  );
end;
$$;

-- Grant execution to authenticated users (admin check is handled inside the function)
grant execute on function public.bulk_update_catalogue_metadata(jsonb) to authenticated;
