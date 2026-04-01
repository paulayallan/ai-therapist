# Mentara

Mentara is a production-oriented SaaS MVP for science-based mental support and long-term psychological insight. The product now has two clear layers: a free support layer for immediate anxiety and stress help, and a premium-style psychology operating system for pattern recognition, decision coaching, and life strategy.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + Storage-ready schema
- OpenAI API
- Zod validation
- Vercel deployment target

## Core MVP

- Authentication with Supabase
- Onboarding mental health profile
- Structured CBT coach with JSON-validated outputs
- Panic attack SOS flow
- Text and browser voice-assisted journaling
- Mood tracking
- Anxiety pattern insights
- Strategy layer for decisions, relationship analysis, life planning, and burnout optimization
- Nervous system regulation tools
- Subscription-aware gating foundations and billing-ready upgrade routes

## Safety Model

- Explicit non-therapy disclaimer in the UI
- Crisis language detection for self-harm / suicide phrases
- Crisis resources surfaced in coach and SOS experiences
- AI prompts prohibit diagnosis, certainty, or therapist role-play

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
cp .env.example .env.local
```

3. Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` if you extend server-side admin flows
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY` for Apple in-app purchases in the iOS app
- `NEXT_PUBLIC_REVENUECAT_OFFERING_ID`
- `NEXT_PUBLIC_REVENUECAT_PRO_ENTITLEMENT_ID`
- `NEXT_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT_ID`
- `NEXT_PUBLIC_REVENUECAT_PRO_PACKAGE_ID`
- `NEXT_PUBLIC_REVENUECAT_PREMIUM_PACKAGE_ID`
- `BILLING_PRO_URL` for a hosted checkout link or billing page
- `BILLING_PREMIUM_URL` for a hosted checkout link or billing page

4. Run the app:

```bash
npm run dev
```

## Supabase Setup

1. Create a Supabase project.
2. Run [`supabase/migrations/0001_initial.sql`](/Users/paulabozagil/Documents/GitHub/ai-growth-coach/supabase/migrations/0001_initial.sql) for the base schema.
3. Run [`supabase/migrations/0002_onboarding_memory.sql`](/Users/paulabozagil/Documents/GitHub/ai-growth-coach/supabase/migrations/0002_onboarding_memory.sql) for the onboarding, memory, and emotional-state additions.
4. Optionally run [`supabase/seed.sql`](/Users/paulabozagil/Documents/GitHub/ai-growth-coach/supabase/seed.sql).
5. Enable email/password auth in Supabase Auth.

## Vercel Deployment

1. Import the repo into Vercel.
2. Add all environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL.
4. Deploy.

## iOS / App Store Connect Prep

This repo is configured to ship to iOS through Capacitor using the hosted production app instead of a static export. That is important because the product depends on Next.js API routes.

1. Deploy the web app first and copy the production HTTPS URL.
2. Set `CAPACITOR_SERVER_URL` in your local `.env.local` to that deployed URL.
3. Generate or refresh the native project:

```bash
npm run ios:add
npm run ios:sync:release
```

Both `ios:sync` and `ios:sync:release` fail fast if `CAPACITOR_SERVER_URL` (or
`NEXT_PUBLIC_APP_URL`) is missing, so you do not accidentally ship the fallback shell.
The Xcode `Release` build also has a guard that fails Archive if
`ios/App/App/capacitor.config.json` does not contain an HTTPS `server.url`.

4. Open the Xcode project:

```bash
npm run ios:open
```

5. In Xcode, set the real bundle identifier, signing team, app icons, launch screen, app version/build number, and any required permission usage strings before archiving for App Store Connect.
6. In RevenueCat, create `pro` and `premium` entitlements plus matching packages, then copy those identifiers into `.env.local`.
7. In App Store Connect, create the Apple subscription products and connect them to RevenueCat before submitting the paywall for review.

## Notes

- When Supabase is not configured, the app falls back to demo-safe reads so the UI is still navigable.
- When OpenAI is not configured, the coach and journal analysis return deterministic fallback responses.
- The `transcribe` route is included for production voice upload workflows, while the current MVP journal UI also supports browser speech recognition where available.
- Strategy history and subscription reads expect the new `subscriptions` and `strategy_sessions` tables from the migration.

## Recommended Next Iterations

- Store coach conversations and messages in Postgres
- Add charts for mood and anxiety trends
- Upload audio recordings to Supabase Storage
- Add clinician-reviewed prompt and copy refinements
- Add region-specific crisis resource settings
- Add real billing and feature gating for free vs paid tiers
