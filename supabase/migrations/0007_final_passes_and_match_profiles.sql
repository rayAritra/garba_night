-- 1. Passing someone who already liked you is final: they leave "Likes you" and never return to Discover.
--    (Passing someone who hadn't liked you yet still isn't permanent — they come back on a later visit.)
-- 2. Matched people can see each other's full profile.

create or replace function public.get_discover_profiles(p_limit integer default 15)
returns table(id uuid, name text, age integer, gender text, year text, department text, bio text, photos text[], interests text[])
language sql stable security definer set search_path = public as $$
  select p.id, p.name, extract(year from age(p.date_of_birth))::integer, p.gender, p.year, p.department, p.bio,
    coalesce((select array_agg(pp.storage_path order by pp.position) from profile_photos pp where pp.profile_id=p.id), '{}'),
    coalesce((select array_agg(i.name order by i.name) from profile_interests pi join interests i on i.id=pi.interest_id where pi.profile_id=p.id), '{}')
  from profiles p
  join profiles me on me.id = auth.uid()
  left join swipes s on s.swiper_id = auth.uid() and s.target_id = p.id
  where p.id <> auth.uid() and p.is_active and p.onboarding_completed
    and (s.direction is null or s.direction = 'PASS')
    -- a pass made after they had already liked you is final
    and not (s.direction = 'PASS' and exists (
      select 1 from swipes t where t.swiper_id = p.id and t.target_id = auth.uid() and t.direction = 'LIKE' and t.created_at <= s.created_at))
    and not exists (select 1 from blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
    and public.discover_pair(me.gender, p.gender)
  order by (s.direction is not null), md5(p.id::text || auth.uid()::text || current_date::text)
  limit least(greatest(p_limit,1),20)
$$;

-- "Likes you": gone once you like them back (match) or pass after seeing their like.
-- Someone you passed *before* they liked you still shows up — you hadn't seen that like yet.
create or replace function public.get_likes_received()
returns table(id uuid, name text, age integer, gender text, year text, department text, bio text, photos text[], interests text[], liked_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, extract(year from age(p.date_of_birth))::integer, p.gender, p.year, p.department, p.bio,
    coalesce((select array_agg(pp.storage_path order by pp.position) from profile_photos pp where pp.profile_id=p.id), '{}'),
    coalesce((select array_agg(i.name order by i.name) from profile_interests pi join interests i on i.id=pi.interest_id where pi.profile_id=p.id), '{}'),
    s.created_at
  from swipes s
  join profiles p on p.id = s.swiper_id
  where s.target_id = auth.uid() and s.direction = 'LIKE'
    and p.is_active and p.onboarding_completed
    and not exists (
      select 1 from swipes mine where mine.swiper_id = auth.uid() and mine.target_id = p.id
        and (mine.direction = 'LIKE' or mine.created_at >= s.created_at))
    and not exists (select 1 from blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
  order by s.created_at desc
  limit 100
$$;

-- Full profile of the other person in an active, unblocked match: everything on their card plus the
-- whole bio, and each social only if its owner switched sharing on. Never DOB, email or other contact.
create or replace function public.get_match_details(p_match uuid)
returns table(profile_id uuid, name text, age integer, gender text, year text, department text, bio text, photos text[], interests text[], instagram_username text, whatsapp_number text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, extract(year from age(p.date_of_birth))::integer, p.gender, p.year, p.department, p.bio,
    coalesce((select array_agg(pp.storage_path order by pp.position) from profile_photos pp where pp.profile_id=p.id), '{}'),
    coalesce((select array_agg(i.name order by i.name) from profile_interests pi join interests i on i.id=pi.interest_id where pi.profile_id=p.id), '{}'),
    case when p.share_instagram then p.instagram_username end,
    case when p.share_whatsapp then p.whatsapp_number end
  from matches m
  join profiles p on p.id = case when m.user_one_id = auth.uid() then m.user_two_id else m.user_one_id end
  where m.id = p_match and m.status = 'ACTIVE' and auth.uid() in (m.user_one_id, m.user_two_id)
    and not exists (select 1 from blocks b where b.blocker_id in (m.user_one_id, m.user_two_id) and b.blocked_id in (m.user_one_id, m.user_two_id))
$$;

revoke all on function public.get_discover_profiles(integer) from public, anon;
revoke all on function public.get_likes_received() from public, anon;
revoke all on function public.get_match_details(uuid) from public, anon;
grant execute on function public.get_discover_profiles(integer), public.get_likes_received(), public.get_match_details(uuid) to authenticated;
