-- Everyone who likes you shows up under "Likes you", live.
-- * The liker already chose you, so your own "show me" preference no longer hides them.
-- * Still excluded: blocked pairs (either way), paused/unfinished profiles, and people you've already
--   answered (liking back makes a match; a pass can't be undone).
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
    and not exists (select 1 from swipes mine where mine.swiper_id = auth.uid() and mine.target_id = p.id)
    and not exists (select 1 from blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
  order by s.created_at desc
  limit 100
$$;

revoke all on function public.get_likes_received() from public, anon;
grant execute on function public.get_likes_received() to authenticated;

-- The target of a LIKE may see that swipe row (who + when). Passes stay visible only to the swiper.
drop policy if exists "likes received read" on public.swipes;
create policy "likes received read" on public.swipes for select using (target_id = auth.uid() and direction = 'LIKE');

-- Stream swipes over Realtime; RLS above limits each client to its own swipes and likes aimed at it.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'swipes') then
    alter publication supabase_realtime add table public.swipes;
  end if;
end $$;
