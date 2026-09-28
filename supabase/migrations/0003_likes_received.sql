-- "Likes you": people who liked the caller and whom the caller hasn't answered yet.
-- Same swipe-safe column list as get_discover_profiles: age instead of DOB, never socials/contact.
-- Blocked pairs, paused/unfinished profiles and anyone the caller already swiped are excluded,
-- and both people's "show me" preferences are respected exactly like Discover.
create or replace function public.get_likes_received()
returns table(id uuid, name text, age integer, gender text, year text, department text, bio text, photos text[], interests text[], liked_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, extract(year from age(p.date_of_birth))::integer, p.gender, p.year, p.department, p.bio,
    coalesce((select array_agg(pp.storage_path order by pp.position) from profile_photos pp where pp.profile_id=p.id), '{}'),
    coalesce((select array_agg(i.name order by i.name) from profile_interests pi join interests i on i.id=pi.interest_id where pi.profile_id=p.id), '{}'),
    s.created_at
  from swipes s
  join profiles p on p.id = s.swiper_id
  join profiles me on me.id = auth.uid()
  where s.target_id = auth.uid() and s.direction = 'LIKE'
    and p.is_active and p.onboarding_completed
    and not exists (select 1 from swipes mine where mine.swiper_id = auth.uid() and mine.target_id = p.id)
    and not exists (select 1 from blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
    and ('Everyone'=any(me.interested_in) or p.gender=any(me.interested_in))
    and ('Everyone'=any(p.interested_in) or me.gender=any(p.interested_in))
  order by s.created_at desc
  limit 50
$$;

revoke all on function public.get_likes_received() from public, anon;
grant execute on function public.get_likes_received() to authenticated;
