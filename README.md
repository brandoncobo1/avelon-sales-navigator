# Avelon Sales Navigator

A real-time sales call branching assistant. During a live cold call, it shows the rep
exactly what to say next, what they're trying to learn, and the possible next branches —
one click per turn of the conversation. It is not a CRM, a chatbot, or a training course.

Built for Avelon, selling automation software to UK dental practices, cold-calling
receptionists who then route to the practice's decision-maker.

## What it does

- **Call Navigator** — the core screen. Optimized for use while on the phone: the line to
  say next is the largest, most prominent thing on screen. One click on a branch button
  advances the conversation; nothing requires two clicks.
- **Conversation Builder** — add, edit, duplicate, reorder, and delete conversation
  branches without touching code. The script lives in the database, not in components.
- **Call History** — every call's full branch path, notes, and outcome.
- **Dashboard** — aggregate stats (calls, decision-makers reached, common objections, etc).
- **Demo mode** — a seeded "Demo Dental Clinic" and the complete receptionist script so the
  whole flow can be exercised without a real call.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma** + **SQLite** for local persistence (see [Swapping to Postgres/Supabase](#swapping-to-postgressupabase) below)
- **Lucide** icons
- No auth in V1 — single-user (see [Authentication](#authentication))

## Installation

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npm run db:seed          # seeds the full receptionist script + demo clinic
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Start Demo** on the dashboard
to try the full receptionist tree end to end.

## Environment variables

Only one, created automatically by `prisma init` (already in `.env`):

```
DATABASE_URL="file:./dev.db"
```

## Database

SQLite file at `prisma/dev.db`, managed by Prisma. Common commands:

```bash
npx prisma studio        # browse/edit the database in a GUI
npm run db:seed           # re-run the seed (upserts — safe to run repeatedly)
npm run db:reset           # drop the db, re-apply migrations, and re-seed
```

### Swapping to Postgres/Supabase

The schema (`prisma/schema.prisma`) intentionally avoids any SQLite-only feature, so moving
to Postgres/Supabase later is a two-line change:

1. `datasource db { provider = "postgresql" ... }`
2. Point `DATABASE_URL` at your Supabase connection string.
3. `npx prisma migrate dev`

No application code changes — everything goes through `src/lib/*.ts`.

## Development

```bash
npm run dev     # local dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Architecture overview

```
src/
  app/
    page.tsx                    Dashboard
    call/new/page.tsx           Pre-call screen (pick/add a clinic)
    call/[callId]/page.tsx      Call Navigator (the core product)
    history/page.tsx            Call History table
    history/[callId]/page.tsx   Call path detail
    builder/page.tsx            Conversation Builder
    settings/page.tsx           Settings
    api/                        REST routes (branches, clinics, calls, suggest)
    actions.ts                  Server actions (start call, reset script)
  components/
    layout/                     App shell, sidebar, mobile nav
    navigator/                  Call Navigator UI (response card, branch buttons, modals)
    builder/                    Conversation Builder UI (list, editor form)
    ui/                         Small shared primitives
  lib/
    types.ts                    Domain types (Branch, Call, CallEvent, ...)
    branches.ts / calls.ts / clinics.ts / stats.ts   Data access (wraps Prisma)
    branch-utils.ts             Prisma row ↔ domain type mapping
    branch-suggestion.ts        AI suggestion abstraction (mocked — see below)
    prisma.ts                   Prisma client singleton
  data/
    seed-branches.ts            The full conversation tree as structured data
prisma/
  schema.prisma                 Branch / Clinic / Call / CallEvent / Note models
  seed.ts                       Seed script (imports src/lib/seed-runner.ts)
```

**Conversation engine.** A `Branch` is the atomic unit: a trigger (what prompted it), a
response (what to say), an objective, and a list of `nextBranchIds`. Branches form a DAG,
not a strict tree — several different paths converge on shared branches (e.g. every "who's
the decision-maker" moment converges on the same "capture name/position/time/number" branch)
so that content is written once and reused everywhere it applies.

**Performance.** The Call Navigator loads the *entire* branch tree once, on page load, into
a client-side `Map`. Every branch click is an instant local state update — the network call
that persists it (`PATCH /api/calls/[id]`) fires in the background and is never awaited by
the UI. Branch switching never waits on a round trip.

**Breadcrumb / history.** The call's actual path is derived from its `CallEvent` log (the
sequence of branches actually selected during the call), not from a static "previous
branch" pointer on each branch — because a branch can be reached from more than one parent,
a single static pointer can't represent that. Jumping to an earlier breadcrumb entry
truncates local history and persists the jump as a new event, so the event log is always an
accurate record of what actually happened on the call, back-tracking included.

## How to add a new branch

Two ways:

1. **Conversation Builder** (`/builder`) — the intended way for anyone who isn't touching
   code. Create/edit/duplicate/delete branches, pick next branches from a searchable list,
   and preview exactly how the branch will render in the Navigator before saving.
2. **Seed data** (`src/data/seed-branches.ts`) — for changes that should ship as part of the
   built-in script. Add an entry, then run `npm run db:seed` (or use **Settings → Reset
   built-in script**, which re-runs the same seed without touching branches you've added
   yourself).

A branch's shape (`src/lib/types.ts`):

```ts
{
  id, title, speaker, type, stage,
  trigger,        // when to pick this branch
  responseText,   // what the rep should say
  responseAlt,    // optional alternative phrasing
  objective,      // what this line is trying to learn/achieve
  notes, warning, // optional
  tags,           // string[]
  nextBranchIds,  // string[] — the branches this one can lead to
  previousBranchId, order, isRoot,
}
```

## Authentication

V1 is intentionally single-user with no login — the whole app is Isse's. The API and data
layer don't assume a single user anywhere (e.g. `CallEvent.selectedBy` already distinguishes
`"rep"` from `"ai"`), so adding real multi-user auth later means adding a `User` model, a
`userId` on `Call`, and an auth check in the API routes — no restructuring.

## Future AI integration

The app is architected for a future live-transcript system, but V1 ships with branch
selection 100% manual — no microphone, no transcription, no auto-navigation.

**`BranchSuggestionService`** (`src/lib/branch-suggestion.ts`) is the abstraction a future
AI system plugs into:

```ts
interface BranchSuggestionService {
  suggest(chunk: TranscriptChunk, candidateBranches: Branch[]): Promise<BranchSuggestion>;
}
// BranchSuggestion = { transcript, suggestedBranchId, confidence }
```

V1 ships `MockBranchSuggestionService`, a keyword-matching stand-in, wired up behind
`POST /api/suggest`. A real implementation (LLM-backed, given the live transcript and the
current branch's candidate next-branches) can replace it without touching any UI — the
contract stays the same.

The intended future UI flow (not built in V1): a live transcript chunk comes in →
`POST /api/suggest` returns a suggested branch + confidence → the Navigator shows it as a
suggestion the rep must **explicitly confirm or reject** — the app must never jump branches
on its own.

## Design decisions worth knowing

- **SQLite, not Supabase, for V1.** The brief asked for Postgres/Supabase, but provisioning
  a hosted database needs an account/credentials this environment doesn't have, and the
  brief also asks for `npm install && npm run dev` to just work. Prisma + SQLite gets both:
  zero external setup today, and a two-line change to Postgres/Supabase later (see above).
- **No `framer-motion`.** The brief for this project is explicit that speed beats polish
  here ("Isse is on a call") and to avoid excessive animation — a few CSS transitions cover
  everything the Navigator needs.
- **Decision-maker tree is a stub.** Only the receptionist tree from the brief is fully
  built out (~80 branches). The decision-maker tree transfers into a minimal 3-branch stub
  (`dm-root`) — building it out is pure data entry via the Conversation Builder or
  `seed-branches.ts`, no new code required.
