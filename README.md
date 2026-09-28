# Raasa — Garba Partner

A mobile-first, privacy-conscious matching app for a college Garba night. Students can create a profile in four short steps, discover compatible people, match on mutual likes, chat in realtime, and optionally reveal Instagram or WhatsApp only to active matches.

## What is implemented

- Email/password sign-up, login, logout, reset flow, and server-refreshed sessions
- Four-step 18+ onboarding with 2–3 reordered photos, browser-side resize/WebP compression, bio, interests, preferences, and private-by-default socials
- Preference-aware batched discovery with touch drag, buttons, prefetching, and optimistic UI
- Concurrency-safe `submit_swipe` database function and canonical unique match pairs
- Match celebration, match inbox, unread counts, realtime text chat, read state, icebreakers, and rate limiting
- Matched-only social sharing, plus unmatch, report, block, and permanent account deletion
- RLS on every user table; private DOB/contact data never enters discovery results
- Responsive consumer UI, reduced-motion support, development seed data, database acceptance test, and local load smoke test

There are deliberately no invite codes, college-domain checks, or approval gates. The app is 18+ and optimized for reaching discovery in one to two minutes.

## 1. Install

Requirements: Node 20+, npm, a Supabase project, and optionally the Supabase CLI.

```bash
git clone YOUR_REPOSITORY_URL
cd garba_partner
npm install
cp .env.example .env.local
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

## 2. Create and configure Supabase

1. Create a free Supabase project.
2. In **Authentication → Providers → Email**, enable email/password.
3. For the fastest event onboarding, disable **Confirm email**. If you keep it enabled, Raasa already handles the verification callback.
4. In **Authentication → URL Configuration**, set the site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` as a redirect URL.
5. Copy the project URL and publishable/anon key into `.env.local`. Raasa intentionally does not use a service-role key.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Apply the database

The migration creates tables, indexes, RLS, storage policies, Realtime publication entries, all secure RPCs, and the interest catalog.

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

For a local clean database:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

`supabase/seed.sql` adds 20 fictional development accounts on local reset. Never run that seed against production. Every seeded account uses password `GarbaDev123!` and an `@raasa.local` address.

### Optional migration: blocked list names

`supabase/migrations/0002_blocked_list.sql` adds `get_blocked_profiles()` so Settings can show *who* you blocked. Apply it with `npx supabase db push`. Without it, Settings still lists blocks (as "Blocked profile") and unblocking works.

## 4. Run and verify

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Open `http://localhost:3000`. Create two accounts in separate private browser windows, finish both profiles, and verify mutual matching and realtime chat.

The safe local discovery load check refuses non-local Supabase URLs:

```bash
node scripts/load-test.mjs aarav@raasa.local "GarbaDev123!"
```

## 5. Deploy to Vercel

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import it in Vercel; framework detection should select Next.js.
3. Add all three environment variables from `.env.example`. Set `NEXT_PUBLIC_APP_URL` to the final HTTPS origin.
4. Deploy.
5. In Supabase Auth URL Configuration, change the site URL to the production origin and add `https://YOUR_DOMAIN/auth/callback` to redirect URLs.
6. Smoke-test sign-up, onboarding, photo upload, swipe/match, two-session realtime chat, sharing visibility, unmatch, report, block, logout, password reset, and account deletion on both phone and desktop.

No code changes are required for roughly 1,000 accounts: discovery is capped at 20 rows, message history is capped per request, images are compressed before upload, and the indexed match/swipe paths remain small at this scale.

## Security model

- The browser only receives an anon/publishable key. Never add a service key to `NEXT_PUBLIC_*` variables.
- Discovery is a security-definer function returning an explicit safe column list. It returns age, not DOB, and never returns socials.
- Swipes and matches cannot be inserted directly. `submit_swipe` derives the caller from `auth.uid()`, inserts one unique swipe, checks the reciprocal like, and upserts a canonical pair.
- Message RLS calls `is_active_match`; blocked/unmatched/non-participants cannot read or send. Recipients can update only `read_at`, not message content.
- Contact lookup succeeds only for participants in an active, unblocked match and reveals each field only when its owner enabled sharing.
- Storage writes/deletes are limited to the authenticated user's UUID folder. Upload MIME type and size are also enforced by the bucket.
- Reports are insert-only for students. No conversations or reports are exposed through analytics.

Production checklist:

- [x] RLS enabled on every user-data table
- [x] Private fields excluded from discovery
- [x] No service credential in browser or repository
- [x] Caller identity derived from verified server session / `auth.uid()`
- [x] Atomic, duplicate-safe matching
- [x] Active-match and block checks for chat/contact access
- [x] Upload size/type/path validation and browser compression
- [x] 18+ database constraint and onboarding validation
- [x] Message length/rate limits; React escapes rendered text
- [x] Server-protected private routes and permanent account deletion

## Project map

```text
app/                 Next.js pages and server actions
components/          ui primitives, landing, auth, onboarding, discovery, matches, chat, profile, layout
hooks/               realtime inbox + media queries
lib/supabase/        browser/server clients and session middleware
supabase/migrations/ schema, RLS, RPCs, storage and realtime setup
supabase/tests/      three-user security and core-flow acceptance test
supabase/seed.sql    fictional local-only accounts
scripts/             safe local load smoke test
tests/               fast validation unit tests
```
