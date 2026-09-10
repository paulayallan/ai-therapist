# Mentara

A rebuild of the Mentara app, **built on the existing production schema**. It
connects to the live Supabase project and reads the tables that are already
there — so every user, subscription, starter trial and journal entry carries
over untouched. There is no migration and no data mapping.

---

## The rule that matters most

**Do not run any new migration against production.** This app adds no tables.
It reads and writes `profiles`, `mental_profiles`, `user_support_preferences`,
`daily_check_ins`, `mood_logs`, `journal_entries`, `panic_episodes`,
`conversations`, `messages`, `insights`, `account_memory`, `saved_tools`,
`usage_counters`, `subscriptions` and `user_activity_events` exactly as
migrations 0001–0034 defined them.

In particular, nothing here touches `handle_new_user()` — the trigger that
grants every new account its 5-day Premium starter trial.

---

## Setup

```bash
npm install
cp .env.example .env.local     # point at the LIVE Supabase project
npm run dev
```

Test against a Supabase **preview branch** before production. The Pro plan has
branching; use it.

---

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run verify      # imports resolve, no server-only module reaches a client component
npm test            # 29 assertions over dates, safety, tiers, signals and stats
npm run check       # all three
```

`npm test` and `npm run verify` need no database, no network and no API key.

---

## What is built

| Route | What it does |
| --- | --- |
| `/` | Landing page |
| `/auth` | Sign up and sign in |
| `/onboarding` | Six steps into `mental_profiles` + `user_support_preferences` |
| `/dashboard` | Check-in, personalised tools, trial card, recent journal |
| `/sos` | The rescue flow — **public, outside the auth wall** |
| `/chat` | Support chat, structured, with memory |
| `/journal` | Entry + AI reflection into `emotional_analysis_json` |
| `/tools`, `/tools/[id]` | 20 tools, tier-gated, with guided breathing |
| `/insights` | Patterns computed from the person's own rows |
| `/settings` | AI consent, plan, crisis lines, export, delete |
| `/upgrade` | Plans, outcomes first, working web checkout |
| `/privacy`, `/terms` | Plain-language legal pages |

Still to port from the live app: Twin, homework, science check, community wall,
daily plans, reminders, push, analytics, multi-language.

---

## How safety works

Three rules, arranged so they cannot be bypassed:

1. **Every piece of user text is screened before a model sees it.**
   `src/lib/safety.ts` classifies text as `none`, `panic`, `medical` or
   `crisis`. Crisis and medical both set `blocksAi`.
2. **Crisis resources are rendered by the app, never generated.** A model can
   time out or drift; a component cannot.
3. **Text that trips the screen is stored but never interpreted.** In chat the
   app answers itself and shows real numbers. In the journal the entry saves
   and is left uninterpreted.

Resources are **region-aware** — AU, NZ, US, CA, UK, IE, international —
detected from the browser's timezone, emergency number first. The old app
showed the same fixed list to everyone, so an Australian read past 988 and
Samaritans to reach Lifeline, and `000` never appeared at all.

`/sos` is deliberately outside the auth wall, and SOS logging is never
rate-limited.

---

## How personalisation works

`src/lib/signals.ts` turns the last 14 days of a person's own rows into ten
signals — panic pattern, anxiety, sleep, bodily stress, overthinking, work,
social, low mood, self-criticism, relationships. `recommendTools()` ranks the
library against them and **always returns a reason drawn from their data**:

> *Based on your logged triggers* — "Work is your most common trigger recently.
> This puts a deliberate edge on the day so it stops bleeding into the evening."

Two rules protect the experience:

- **Ranking is deterministic.** Equal scores keep library order, so the list
  does not reshuffle between visits.
- **A free user is never shown a wall of padlocks.** Paid tools only fill slots
  the free library could not, and never appear first. There is a test for this.

---

## How patterns work

Every figure is computed in `src/lib/stats.ts` in plain arithmetic before any
model is involved. The model receives a short factual brief and phrases it.

- **Correlations are withheld below five paired days.** Fewer points is noise.
- **Missing days break the chart line** rather than being interpolated.
- **Mood (1–5) and anxiety (1–10) share one axis**, with anxiety halved for
  display. A second y-axis would let the chart imply a relationship the numbers
  do not contain.
- Stats are computed in the browser, because the day boundary belongs to the
  user's timezone.

---

## Tiers

Carried over unchanged. Enforced through the existing `reserve_usage_counter`
RPC, so two concurrent requests cannot both spend the last unit.

| | Free | Pro | Premium |
| --- | --- | --- | --- |
| Support chat | 5/day | 200/mo | 800/mo |
| Journal reflection | 3/day | 100/mo | 300/mo |
| Insights | 2/day | 60/mo | 200/mo |
| Check-ins | 3/day | unlimited | unlimited |
| Twin | — | — | 80/mo |
| Voice | — | 30 min/mo | 180 min/mo |

New accounts get 5 days of Premium. Legacy `platinum` entitlements resolve to
Premium. Updating today's existing check-in does not consume a check-in.

**The monetisation fix is preserved.** `/api/billing/checkout` redirects to
`BILLING_PRO_URL` / `BILLING_PREMIUM_URL`; when they are unset it returns a
clear message instead of bouncing back to `/upgrade`, which is what previously
made paying impossible on the web.

---

## Before switching users over

- Port the remaining features listed above — users must not lose Twin,
  homework or community.
- Test billing on a real iOS sandbox account.
- Have the privacy page and terms reviewed by a lawyer.
- Confirm the crisis numbers for every region you ship to.
