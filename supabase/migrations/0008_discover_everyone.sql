-- Discover shows every opposite-gender profile that finished onboarding, so it never looks empty:
--   unseen people first, then people you passed, then people you liked (flagged `liked_by_me`).
-- Still left out: yourself, anyone you've matched with (they live in Chats), blocked pairs,
-- paused profiles, and anyone you passed after they had liked you (that pass is final).

-- Safety net from 0004 (idempotent): every login gets a profile row, so nobody is silently missing.
insert into public.profiles(id, name)
select u.id,
  case when char_length(btrim(coalesce(u.raw_user_meta_data->>'name', ''))) between 2 and 60
    then btrim(u.raw_user_meta_data->>'name') else 'Garba Guest' end
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- The return shape changes (new liked_by_me column), so the function must be dropped first.
drop function if exists public.get_discover_profiles(integer);

-- p_exclude: ids the app already showed this visit, so paging always reaches the end of the list.
create function public.get_discover_profiles(p_limit integer default 15, p_exclude uuid[] default '{}')
returns table(id uuid, name text, age integer, gender text, year text, department text, bio text, photos text[], interests text[], liked_by_me boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, extract(year from age(p.date_of_birth))::integer, p.gender, p.year, p.department, p.bio,
    coalesce((select array_agg(pp.storage_path order by pp.position) from profile_photos pp where pp.profile_id=p.id), '{}'),
    coalesce((select array_agg(i.name order by i.name) from profile_interests pi join interests i on i.id=pi.interest_id where pi.profile_id=p.id), '{}'),
    coalesce(s.direction = 'LIKE', false)
  from profiles p
  join profiles me on me.id = auth.uid()
  left join swipes s on s.swiper_id = auth.uid() and s.target_id = p.id
  where p.id <> auth.uid() and p.is_active and p.onboarding_completed
    and not (p.id = any(coalesce(p_exclude, '{}')))
    and public.discover_pair(me.gender, p.gender)
    and not exists (select 1 from matches m where m.user_one_id = least(me.id, p.id) and m.user_two_id = greatest(me.id, p.id))
    and not exists (select 1 from blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
    and not (s.direction = 'PASS' and exists (
      select 1 from swipes t where t.swiper_id = p.id and t.target_id = auth.uid() and t.direction = 'LIKE' and t.created_at <= s.created_at))
  order by case when s.direction is null then 0 when s.direction = 'PASS' then 1 else 2 end,
    md5(p.id::text || auth.uid()::text || current_date::text)
  limit least(greatest(p_limit,1),20)
$$;

revoke all on function public.get_discover_profiles(integer, uuid[]) from public, anon;
grant execute on function public.get_discover_profiles(integer, uuid[]) to authenticated;
