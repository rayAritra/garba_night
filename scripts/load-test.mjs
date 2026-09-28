// Safe local smoke/load test. Requires test users and never accepts a production URL.
import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!key)throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
if(!/localhost|127\.0\.0\.1/.test(url))throw new Error("Refusing to run against a non-local Supabase project");
const client=createClient(url,key);const email=process.argv[2];const password=process.argv[3];
if(!email||!password)throw new Error("Usage: node scripts/load-test.mjs EMAIL PASSWORD");
const {error:authError}=await client.auth.signInWithPassword({email,password});if(authError)throw authError;
const started=performance.now();let fetched=0;for(let i=0;i<20;i++){const {data,error}=await client.rpc("get_discover_profiles",{p_limit:15});if(error)throw error;fetched+=data.length}
console.log({requests:20,profiles:fetched,milliseconds:Math.round(performance.now()-started)});
