begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,phone_change) values
('00000000-0000-4000-8000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','a@test.local',crypt('password',gen_salt('bf')),now(),'{}','{"name":"A"}',now(),now(),'','',''),
('00000000-0000-4000-8000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','b@test.local',crypt('password',gen_salt('bf')),now(),'{}','{"name":"B"}',now(),now(),'','',''),
('00000000-0000-4000-8000-00000000000c','00000000-0000-0000-0000-000000000000','authenticated','authenticated','c@test.local',crypt('password',gen_salt('bf')),now(),'{}','{"name":"C"}',now(),now(),'','','');
update public.profiles set date_of_birth='2000-01-01',gender=case when id::text like '%a' then 'Man' else 'Woman' end,interested_in=array['Everyone'],year='3rd Year',bio='Test profile for acceptance.',onboarding_completed=true,instagram_username='private_test',share_instagram=true;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000a',true);
select is(public.submit_swipe('00000000-0000-4000-8000-00000000000b','LIKE'),null::uuid,'A likes B: no match yet');
select is((select count(*) from public.matches),0::bigint,'No match after one like');
select is((select count(*) from public.get_likes_received()),0::bigint,'A does not see their own like as received');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000b',true);
select is((select name from public.get_likes_received()),'A','B sees A under Likes you');
select ok((select to_jsonb(r) from public.get_likes_received() r) ?& array['age','photos'] and not ((select to_jsonb(r) from public.get_likes_received() r) ?| array['date_of_birth','instagram_username','whatsapp_number']),'Likes you exposes no private fields');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000b',true);
select isnt(public.submit_swipe('00000000-0000-4000-8000-00000000000a','LIKE'),null::uuid,'B likes A: match created');
select is((select count(*) from public.matches),1::bigint,'Exactly one match exists');
select is((select count(*) from public.get_likes_received()),0::bigint,'Answered like leaves Likes you');
select is(public.submit_swipe('00000000-0000-4000-8000-00000000000a','LIKE'),null::uuid,'Repeat like is a no-op and cannot revive a match');
insert into public.messages(match_id,sender_id,content) select id,'00000000-0000-4000-8000-00000000000b','Ready for Garba?' from public.matches;
select is((select count(*) from public.messages),1::bigint,'Matched user can message');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000c',true);
select is((select count(*) from public.messages),0::bigint,'Unrelated C cannot read messages');
select is((select count(*) from public.get_match_profile((select id from public.matches))),0::bigint,'C cannot fetch private contact');
select is((select count(*) from public.get_likes_received()),0::bigint,'C sees no likes meant for others');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000a',true);
select public.block_profile('00000000-0000-4000-8000-00000000000b');
select is((select status::text from public.matches),'UNMATCHED','Block disables the match');
select * from finish();
rollback;
