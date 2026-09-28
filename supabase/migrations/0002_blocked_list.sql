-- Lets a student see who they've blocked (name only) so they can unblock from Settings.
-- Returns rows only for blocks the caller created; no other profile fields leave the function.
create or replace function public.get_blocked_profiles()
returns table(id uuid, name text, blocked_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, b.created_at
  from blocks b join profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc
$$;

revoke all on function public.get_blocked_profiles() from public;
grant execute on function public.get_blocked_profiles() to authenticated;
