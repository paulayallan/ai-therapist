# AI Therapist

AI Therapist is a production-oriented SaaS MVP for science-based mental health support. The product is designed as a structured digital CBT coach rather than a generic chatbot, with journaling, mood tracking, SOS support, and pattern insights.

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
- Nervous system regulation tools

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

4. Run the app:

```bash
npm run dev
```

## Supabase Setup

1. Create a Supabase project.
2. Run [`supabase/migrations/0001_initial.sql`](/Users/paulabozagil/Documents/GitHub/ai-growth-coach/supabase/migrations/0001_initial.sql).
3. Optionally run [`supabase/seed.sql`](/Users/paulabozagil/Documents/GitHub/ai-growth-coach/supabase/seed.sql).
4. Enable email/password auth in Supabase Auth.

## Vercel Deployment

1. Import the repo into Vercel.
2. Add all environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL.
4. Deploy.

## Notes

- When Supabase is not configured, the app falls back to demo-safe reads so the UI is still navigable.
- When OpenAI is not configured, the coach and journal analysis return deterministic fallback responses.
- The `transcribe` route is included for production voice upload workflows, while the current MVP journal UI also supports browser speech recognition where available.

## Recommended Next Iterations

- Store coach conversations and messages in Postgres
- Add charts for mood and anxiety trends
- Upload audio recordings to Supabase Storage
- Add clinician-reviewed prompt and copy refinements
- Add region-specific crisis resource settings
