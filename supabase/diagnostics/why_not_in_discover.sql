-- Read-only. Run in the Supabase SQL Editor. Not a migration — it changes nothing.
-- Shows every other account and exactly why it is or isn't in one person's Discover,
-- using the same rules as get_discover_profiles (migrations 0006/0007).
--
-- 1. Put the email of the account that's "missing" people on the next line.
with me as (
  select p.* from public.profiles p join auth.users u on u.id = p.id
  where u.email = 'PUT-THE-EMAIL-HERE@example.com'
)
select
  coalesce(p.name, '(no profile row)') as name,
  u.email,
  p.gender,
  (select count(*) from public.profile_photos pp where pp.profile_id = u.id) as photos,
  case
    when p.id is null then 'HIDDEN: signed up but has no profile row'
    when not p.onboarding_completed then 'HIDDEN: never finished onboarding'
    when not p.is_active then 'HIDDEN: paused discovery in Settings'
    when exists (select 1 from public.blocks b where (b.blocker_id = me.id and b.blocked_id = p.id) or (b.blocker_id = p.id and b.blocked_id = me.id)) then 'HIDDEN: blocked'
    when me.gender is null then 'HIDDEN: YOUR profile has no gender set'
    when not public.discover_pair(me.gender, p.gender) then 'HIDDEN: gender rule (' || coalesce(me.gender, '?') || ' sees ' || case me.gender when 'Man' then 'Woman' when 'Woman' then 'Man' else 'non-binary / prefer not to say' end || ')'
    when s.direction = 'LIKE' then 'HIDDEN: you already liked them'
    when s.direction = 'PASS' and exists (select 1 from public.swipes t where t.swiper_id = p.id and t.target_id = me.id and t.direction = 'LIKE' and t.created_at <= s.created_at) then 'HIDDEN: you passed after they liked you'
    when s.direction = 'PASS' then 'SHOWN (after unseen people — you passed earlier)'
    else 'SHOWN'
  end as discover_status
from me
cross join auth.users u
left join public.profiles p on p.id = u.id
left join public.swipes s on s.swiper_id = me.id and s.target_id = u.id
where u.id <> me.id
order by discover_status, name;

-- 2. If the query returns no rows at all, that email has no profile — check the spelling.
