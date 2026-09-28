-- Development only. Never run this file against production.
-- Password for every fictional account: GarbaDev123!
do $$
declare
  names text[] := array['Aarav','Ananya','Kabir','Meera','Rohan','Isha','Vihaan','Tara','Arjun','Naina','Dev','Kiara','Neil','Riya','Ishaan','Myra','Aditya','Sara','Reyansh','Diya'];
  bios text[] := array['Always first on the dance floor.','Here for great music and better company.','Can teach you exactly one Garba step.','Caffeine, code, and colorful nights.'];
  uid uuid; n text; idx integer := 0;
begin
  foreach n in array names loop
    idx := idx+1; uid := gen_random_uuid();
    insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,phone_change)
    values(uid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',lower(n)||'@raasa.local',crypt('GarbaDev123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,jsonb_build_object('name',n),now(),now(),'','','');
    update public.profiles set date_of_birth=date '2000-01-01'+(idx||' months')::interval,gender=case when idx%2=0 then 'Woman' else 'Man' end,interested_in=case when idx%2=0 then array['Man'] else array['Woman'] end,year=((idx%4)+1)||case when idx%4=0 then 'st Year' when idx%4=1 then 'nd Year' when idx%4=2 then 'rd Year' else 'th Year' end,department=(array['CSE','Design','Commerce','Mechanical'])[1+(idx%4)],bio=bios[1+(idx%4)],onboarding_completed=true where id=uid;
    insert into public.profile_interests(profile_id,interest_id) select uid,id from public.interests where name in ('Garba',case when idx%2=0 then 'Music' else 'Dance' end);
  end loop;
end $$;
