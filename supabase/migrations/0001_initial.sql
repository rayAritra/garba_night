-- Garba Partner: run with `supabase db push` against a new project.
create extension if not exists pgcrypto;

create type public.swipe_direction as enum ('LIKE', 'PASS');
create type public.match_status as enum ('ACTIVE', 'UNMATCHED');
create type public.report_reason as enum ('Fake profile', 'Inappropriate content', 'Harassment', 'Spam', 'Other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  date_of_birth date check (date_of_birth <= current_date - interval '18 years'),
  gender text,
  interested_in text[] not null default '{}',
  year text,
  department text check (char_length(department) <= 80),
  bio text check (char_length(bio) <= 200),
  instagram_username text check (instagram_username is null or instagram_username ~ '^[A-Za-z0-9._]+$'),
  share_instagram boolean not null default false,
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^\+?[1-9][0-9]{7,14}$'),
  share_whatsapp boolean not null default false,
  onboarding_completed boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  position smallint not null check (position between 0 and 2),
  created_at timestamptz not null default now(),
  unique (profile_id, position), unique (profile_id, storage_path)
);

create table public.interests (
  id smallint generated always as identity primary key,
  name text not null unique
);

create table public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interest_id smallint not null references public.interests(id) on delete cascade,
  primary key (profile_id, interest_id)
);

create table public.swipes (
  id bigint generated always as identity primary key,
  swiper_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  direction public.swipe_direction not null,
  created_at timestamptz not null default now(),
  check (swiper_id <> target_id), unique (swiper_id, target_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_one_id uuid not null references public.profiles(id) on delete cascade,
  user_two_id uuid not null references public.profiles(id) on delete cascade,
  status public.match_status not null default 'ACTIVE',
  matched_at timestamptz not null default now(),
  unmatched_at timestamptz,
  check (user_one_id < user_two_id), unique (user_one_id, user_two_id)
);

create table public.messages (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id), primary key (blocker_id, blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason public.report_reason not null,
  details text check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create index swipes_target_like_idx on public.swipes(target_id, swiper_id) where direction = 'LIKE';
create index matches_one_active_idx on public.matches(user_one_id, matched_at desc) where status = 'ACTIVE';
create index matches_two_active_idx on public.matches(user_two_id, matched_at desc) where status = 'ACTIVE';
create index messages_match_created_idx on public.messages(match_id, created_at desc);
create index blocks_blocked_idx on public.blocks(blocked_id, blocker_id);

insert into public.interests(name) values
 ('Garba'), ('Dance'), ('Music'), ('Movies'), ('Coding'), ('Gaming'), ('Food'), ('Travel'), ('Photography'),
 ('Sports'), ('Gym'), ('Anime'), ('Fashion'), ('Art'), ('Cricket'), ('Football'), ('F1'), ('Startups')
on conflict do nothing;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Minimal profile row is created from trusted Auth metadata; onboarding completes it.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, name) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'name',''), 'Garba Guest'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.profile_photos enable row level security;
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "interests readable" on public.interests for select to authenticated using (true);
create policy "own photos manage" on public.profile_photos for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own interests manage" on public.profile_interests for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "own swipes read" on public.swipes for select using (swiper_id = auth.uid());
create policy "own matches read" on public.matches for select using (auth.uid() in (user_one_id, user_two_id));
create policy "own blocks manage" on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "own reports insert" on public.reports for insert with check (reporter_id = auth.uid());

create or replace function public.is_active_match(p_match uuid, p_user uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matches m where m.id = p_match and m.status = 'ACTIVE'
      and p_user in (m.user_one_id, m.user_two_id)
      and not exists (select 1 from blocks b where b.blocker_id in (m.user_one_id,m.user_two_id) and b.blocked_id in (m.user_one_id,m.user_two_id))
  )
$$;

create policy "participants read messages" on public.messages for select using (public.is_active_match(match_id));
create policy "participants send messages" on public.messages for insert with check (sender_id = auth.uid() and public.is_active_match(match_id));
create policy "recipient marks read" on public.messages for update using (sender_id <> auth.uid() and public.is_active_match(match_id)) with check (sender_id <> auth.uid() and public.is_active_match(match_id));
revoke update on public.messages from authenticated;
grant update(read_at) on public.messages to authenticated;

create or replace function public.enforce_message_rate() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from messages where sender_id=new.sender_id and created_at > now()-interval '10 seconds') >= 8 then
    raise exception 'You are sending messages too quickly';
  end if;
  return new;
end $$;
create trigger messages_rate_limit before insert on public.messages for each row execute function public.enforce_message_rate();

-- Returns only swipe-safe fields; DOB is reduced to age and socials never leave this function.
create or replace function public.get_discover_profiles(p_limit integer default 15)
returns table(id uuid, name text, age integer, gender text, year text, department text, bio text, photos text[], interests text[])
language sql stable security definer set search_path = public as $$
  select p.id, p.name, extract(year from age(p.date_of_birth))::integer, p.gender, p.year, p.department, p.bio,
    coalesce((select array_agg(pp.storage_path order by pp.position) from profile_photos pp where pp.profile_id=p.id), '{}'),
    coalesce((select array_agg(i.name order by i.name) from profile_interests pi join interests i on i.id=pi.interest_id where pi.profile_id=p.id), '{}')
  from profiles p join profiles me on me.id = auth.uid()
  where p.id <> auth.uid() and p.is_active and p.onboarding_completed
    and not exists (select 1 from swipes s where s.swiper_id=auth.uid() and s.target_id=p.id)
    and not exists (select 1 from blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocker_id=p.id and b.blocked_id=auth.uid()))
    and ('Everyone'=any(me.interested_in) or p.gender=any(me.interested_in))
    and ('Everyone'=any(p.interested_in) or me.gender=any(p.interested_in))
  order by md5(p.id::text || auth.uid()::text || current_date::text)
  limit least(greatest(p_limit,1),20)
$$;

-- The client cannot insert swipes or matches directly. The unique pair and row lock make mutual likes race-safe.
create or replace function public.submit_swipe(p_target uuid, p_direction public.swipe_direction)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_one uuid; v_two uuid; v_match uuid;
begin
  if v_me is null or v_me = p_target then raise exception 'Invalid swipe'; end if;
  if not exists(select 1 from profiles where id=p_target and is_active and onboarding_completed) then raise exception 'Profile unavailable'; end if;
  if exists(select 1 from blocks where (blocker_id=v_me and blocked_id=p_target) or (blocker_id=p_target and blocked_id=v_me)) then raise exception 'Profile unavailable'; end if;
  -- Serializes both directions of the same pair. The second concurrent liker waits,
  -- then observes the first committed swipe and creates exactly one match.
  perform pg_advisory_xact_lock(hashtextextended(least(v_me,p_target)::text || greatest(v_me,p_target)::text, 0));
  insert into swipes(swiper_id,target_id,direction) values(v_me,p_target,p_direction);
  if p_direction='LIKE' and exists(select 1 from swipes where swiper_id=p_target and target_id=v_me and direction='LIKE') then
    v_one := least(v_me,p_target); v_two := greatest(v_me,p_target);
    insert into matches(user_one_id,user_two_id) values(v_one,v_two)
      on conflict(user_one_id,user_two_id) do update set status='ACTIVE', unmatched_at=null
      returning id into v_match;
  end if;
  return v_match;
end $$;

create or replace function public.get_matches()
returns table(match_id uuid, other_profile_id uuid, other_name text, other_photo text, matched_at timestamptz, latest_message text, latest_message_at timestamptz, unread_count bigint)
language sql stable security definer set search_path = public as $$
  select m.id, p.id, p.name, (select storage_path from profile_photos where profile_id=p.id order by position limit 1), m.matched_at,
    lm.content, lm.created_at, (select count(*) from messages u where u.match_id=m.id and u.sender_id<>auth.uid() and u.read_at is null)
  from matches m join profiles p on p.id=case when m.user_one_id=auth.uid() then m.user_two_id else m.user_one_id end
  left join lateral (select content,created_at from messages where match_id=m.id order by created_at desc limit 1) lm on true
  where m.status='ACTIVE' and auth.uid() in (m.user_one_id,m.user_two_id)
  order by coalesce(lm.created_at,m.matched_at) desc
$$;

create or replace function public.get_match_profile(p_match uuid)
returns table(profile_id uuid, name text, photo text, instagram_username text, whatsapp_number text)
language sql stable security definer set search_path = public as $$
  select p.id,p.name,(select storage_path from profile_photos where profile_id=p.id order by position limit 1),
    case when p.share_instagram then p.instagram_username end,
    case when p.share_whatsapp then p.whatsapp_number end
  from matches m join profiles p on p.id=case when m.user_one_id=auth.uid() then m.user_two_id else m.user_one_id end
  where m.id=p_match and m.status='ACTIVE' and auth.uid() in (m.user_one_id,m.user_two_id)
    and not exists(select 1 from blocks b where b.blocker_id in(m.user_one_id,m.user_two_id) and b.blocked_id in(m.user_one_id,m.user_two_id))
$$;

create or replace function public.unmatch(p_match uuid) returns void
language plpgsql security definer set search_path = public as $$
begin update matches set status='UNMATCHED',unmatched_at=now() where id=p_match and status='ACTIVE' and auth.uid() in(user_one_id,user_two_id); if not found then raise exception 'Match unavailable'; end if; end $$;

create or replace function public.block_profile(p_profile uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or auth.uid()=p_profile then raise exception 'Invalid block'; end if;
  insert into blocks(blocker_id,blocked_id) values(auth.uid(),p_profile) on conflict do nothing;
  update matches set status='UNMATCHED',unmatched_at=now() where status='ACTIVE' and ((user_one_id=auth.uid() and user_two_id=p_profile) or (user_two_id=auth.uid() and user_one_id=p_profile));
end $$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  delete from auth.users where id=auth.uid();
end $$;

revoke all on function public.get_discover_profiles(integer) from public;
revoke all on function public.submit_swipe(uuid,public.swipe_direction) from public;
revoke all on function public.get_matches() from public;
revoke all on function public.get_match_profile(uuid) from public;
revoke all on function public.unmatch(uuid) from public;
revoke all on function public.block_profile(uuid) from public;
revoke all on function public.delete_my_account() from public;
grant execute on function public.get_discover_profiles(integer), public.submit_swipe(uuid,public.swipe_direction), public.get_matches(), public.get_match_profile(uuid), public.unmatch(uuid), public.block_profile(uuid), public.delete_my_account() to authenticated;

-- Public photos are non-sensitive profile content; writes are restricted to auth.uid()/... paths.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-photos','profile-photos',true,4194304,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=true;
create policy "photo uploads in own folder" on storage.objects for insert to authenticated
with check (bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "photo updates in own folder" on storage.objects for update to authenticated
using (bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "photo deletes in own folder" on storage.objects for delete to authenticated
using (bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text);

alter publication supabase_realtime add table public.messages, public.matches;
