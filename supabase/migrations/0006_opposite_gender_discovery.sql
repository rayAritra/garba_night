-- Discovery for Garba night:
-- * Men see every woman and women see every man. Interests and the "show me" preference no longer filter.
--   Anyone who chose "Non-binary" / "Prefer not to say" sees, and is seen by, others who chose the same.
-- * A pass is no longer permanent: passed people come back (after anyone not yet seen) on the next visit,
--   and can still be liked later. Likes stay final.

create or replace function public.discover_pair(p_viewer text, p_other text) returns boolean
language sql immutable as $$
  select case
    when p_viewer = 'Man' then p_other = 'Woman'
    when p_viewer = 'Woman' then p_other = 'Man'
    else coalesce(p_other, '') not in ('Man', 'Woman')
  end
$$;

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
    and not exists (select 1 from blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
    and public.discover_pair(me.gender, p.gender)
  -- Unseen people first, then previously passed ones; stable shuffle per viewer per day.
  order by (s.direction is not null), md5(p.id::text || auth.uid()::text || current_date::text)
  limit least(greatest(p_limit,1),20)
$$;

-- A PASS can later become a LIKE; a LIKE never changes. Only a real change can create a match, so a
-- repeated LIKE (e.g. after an unmatch) can never revive an ended match.
create or replace function public.submit_swipe(p_target uuid, p_direction public.swipe_direction)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_swipe bigint; v_match uuid;
begin
  if v_me is null or v_me = p_target then raise exception 'Invalid swipe'; end if;
  if not exists(select 1 from profiles where id=p_target and is_active and onboarding_completed) then raise exception 'Profile unavailable'; end if;
  if exists(select 1 from blocks where (blocker_id=v_me and blocked_id=p_target) or (blocker_id=p_target and blocked_id=v_me)) then raise exception 'Profile unavailable'; end if;
  -- Serializes both directions of the same pair so a mutual like creates exactly one match.
  perform pg_advisory_xact_lock(hashtextextended(least(v_me,p_target)::text || greatest(v_me,p_target)::text, 0));
  insert into swipes(swiper_id,target_id,direction) values(v_me,p_target,p_direction)
    on conflict (swiper_id,target_id) do update set direction = excluded.direction, created_at = now()
    where swipes.direction = 'PASS'
    returning id into v_swipe;
  if v_swipe is null then return null; end if;
  if p_direction='LIKE' and exists(select 1 from swipes where swiper_id=p_target and target_id=v_me and direction='LIKE') then
    insert into matches(user_one_id,user_two_id) values(least(v_me,p_target),greatest(v_me,p_target))
      on conflict(user_one_id,user_two_id) do update set status='ACTIVE', unmatched_at=null
      returning id into v_match;
  end if;
  return v_match;
end $$;

-- "Likes you": someone you passed is still waiting on you, so only your own LIKE removes them.
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
    and not exists (select 1 from swipes mine where mine.swiper_id = auth.uid() and mine.target_id = p.id and mine.direction = 'LIKE')
    and not exists (select 1 from blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
  order by s.created_at desc
  limit 100
$$;

revoke all on function public.get_discover_profiles(integer) from public, anon;
revoke all on function public.submit_swipe(uuid, public.swipe_direction) from public, anon;
revoke all on function public.get_likes_received() from public, anon;
grant execute on function public.get_discover_profiles(integer), public.submit_swipe(uuid, public.swipe_direction), public.get_likes_received() to authenticated;

-- Keep the stored preference consistent with the new rule (it's derived from gender from now on).
update public.profiles set interested_in = case gender when 'Man' then array['Woman'] when 'Woman' then array['Man'] else array['Everyone'] end;
