-- Every auth user must have a public.profiles row (profile_interests, profile_photos, swipes... all
-- reference it). The sign-up trigger creates it, but a row deleted by hand (Table Editor) leaves the
-- login behind with nothing to attach to. This backfills those and lets saveProfile recreate one.

insert into public.profiles(id, name)
select u.id,
  case when char_length(btrim(coalesce(u.raw_user_meta_data->>'name', ''))) between 2 and 60
    then btrim(u.raw_user_meta_data->>'name') else 'Garba Guest' end
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- A student may create only their own row; all column checks still apply.
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());
