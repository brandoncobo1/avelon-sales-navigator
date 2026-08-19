# Avelon Sales Navigator

A real-time sales call navigation and coaching system. During a live cold call, it shows
the rep exactly what to say next, what they're trying to learn, and the possible next
branches — one click per turn of the conversation. After the call, it tracks what happened
and which paths actually lead to booked meetings. It is not a CRM, a chatbot, or a training
course — it's a sales operating system built specifically around Avelon's process.

Built for Avelon, selling automation software to UK dental practices, cold-calling
receptionists who then route to the practice's decision-maker.

Live: **https://avelon-sales-navigator.vercel.app**

## What it does

- **Call Navigator** — the core screen. A "cockpit": current state, goal, the line to say
  next, and the possible next branches, all visible within about two seconds of glancing at
  the screen. One click advances the conversation; nothing requires two clicks.
- **Choose Branch** — a global search across every branch (not just the current node's
  children) by title, trigger, keyword, objective, or category — a manual escape hatch for
  when the conversation doesn't match any of the branches on screen.
- **Live transcript + AI suggestion** — the rep can type/paste what was just said; a
  suggestion engine proposes a branch with a confidence score. The rep must explicitly
  **Accept** or **Ignore** it — the app never switches branches on its own. See "AI
  architecture" below for what's real today versus architected for later.
- **Coach Me / Do Not Pitch Yet** — a one-line, rule-based coaching nudge (no LLM required)
  that watches whether pain has actually been established before the branch graph reaches a
  pitch, and surfaces a warning banner if not.
- **Conversation Builder** — add, edit, duplicate, reorder, and delete conversation branches
  without touching code. The script lives in the database, not in components.
- **Branch Quality** (`/builder/quality`) — automated validation: duplicate ids/titles,
  orphaned branches, unreachable branches, dead ends, broken transitions, self-loops,
  impossible speaker transitions, missing required fields. Runs on every seed and is
  browsable as an admin page with one-click jumps into the Builder.
- **Branch Analytics** (`/builder/analytics`) — how often each branch gets used, and its
  conversion rate to a booked discovery call.
- **Call History** — every call's full branch path, transcript, notes, coaching log, and
  outcome, plus an auto-generated rule-based call summary.
- **Dashboard** — aggregate stats (calls, decision-makers reached, common objections, etc).
- **Demo mode** — a seeded "Demo Dental Clinic" and the complete receptionist + decision-maker
  script so the whole flow can be exercised without a real call.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma** + **Postgres** (Neon, provisioned via the Vercel Marketplace)
- **Lucide** icons
- No auth — single-user (see [Authentication](#authentication))
- Deployed on **Vercel**, auto-deploys on push to `main`

## Installation

```bash
npm install
npx prisma migrate dev   # applies the schema to your DATABASE_URL
npm run db:seed          # seeds the full conversation tree + demo clinic (validates first)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Start Demo** on the dashboard
to try the full receptionist → decision-maker tree end to end.

## Environment variables

```
DATABASE_URL           # pooled Postgres connection string (Neon)
DATABASE_URL_UNPOOLED   # direct/unpooled connection string, used only for migrations
```

Both are auto-populated in `.env.local` if you run `vercel env pull` against the linked
Vercel project (Neon is already provisioned there). For a fresh setup, provision your own
Postgres (Neon, Supabase, or local) and set both — `DATABASE_URL_UNPOOLED` can equal
`DATABASE_URL` if you're not using a pooler.

## Database

```bash
npx prisma studio   # browse/edit the database in a GUI
npm run db:seed      # re-run the seed (upserts, safe to run repeatedly; refuses to write if validation fails)
npm run db:reset      # drop the db, re-apply migrations, and re-seed
```

## Development

```bash
npm run dev     # local dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
npm test        # branch validation + AI-suggestion + "AI cannot hijack the branch" tests
```

## Architecture overview

```
src/
  app/
    page.tsx                        Dashboard
    call/new/page.tsx               Pre-call screen (pick/add a clinic)
    call/[callId]/page.tsx          Call Navigator (the core product)
    history/page.tsx                Call History table
    history/[callId]/page.tsx       Call path detail
    builder/page.tsx                Conversation Builder
    builder/quality/page.tsx        Branch Quality report
    builder/analytics/page.tsx      Branch Analytics
    settings/page.tsx               Settings
    api/                            REST routes — branches, clinics, calls, transcript,
                                     suggestions, coach, branch validation
    actions.ts                      Server actions (start call, reset script)
  components/
    layout/                         App shell, sidebar, mobile nav
    navigator/                      Call Navigator UI — state header, response card, branch
                                     buttons, choose-branch search, transcript panel, coach
                                     panel, do-not-pitch banner, modals
    builder/                        Conversation Builder UI (list, editor form)
    ui/                             Small shared primitives
  lib/
    types.ts                        Domain types (Branch, Call, CallEvent, AiSuggestion, ...)
    branches.ts / calls.ts / clinics.ts / stats.ts    Data access (wraps Prisma)
    branch-utils.ts                 Prisma row ↔ domain type mapping
    branch-validation.ts            The validation system (see below)
    branch-category.ts              Derives a branch's coarse `category` from its `stage`
    branch-analytics.ts             Encounter counts + conversion rate per branch
    branch-suggestion.ts            AI suggestion abstraction (mocked — see "AI architecture")
    call-goal.ts                    Derives the one-line GOAL shown at the top of a call
    call-coach.ts                   Rule-based "Coach Me" / "Do Not Pitch Yet" logic
    call-summary.ts                 Rule-based auto call summary
    prisma.ts                       Prisma client singleton
  data/
    seed-branches.ts                The full conversation tree as structured data
prisma/
  schema.prisma                     Full data model
  seed.ts                           Seed script (imports src/lib/seed-runner.ts)
tests/
  branch-validation.test.ts         Validation system tests (incl. a regression test that
                                     runs the actual seed data through validation)
  branch-suggestion.test.ts         AI suggestion service: deterministic, pure, no side effects
  ai-cannot-hijack-branch.test.ts   Static source checks that no code path lets AI change the
                                     active branch without an explicit rep click
backups/
  seed-branches.*.backup.ts.txt     Point-in-time snapshot of the seed data before schema changes
  live-db-branches.*.json           Point-in-time export of the live database's branch rows
```

**Conversation engine.** A `Branch` is the atomic unit: a trigger (what prompted it), a
response (what to say), an objective, and a list of `nextBranchIds`. Branches form a DAG,
not a strict tree — several different paths converge on shared branches (e.g. every "who's
the decision-maker" moment converges on the same "capture name/position/time/number" branch)
so content is written once and reused everywhere it applies.

**Performance.** The Call Navigator loads the *entire* branch tree once, on page load, into
a client-side `Map`. Every branch click is an instant local state update — the network call
that persists it (`PATCH /api/calls/[id]`) fires in the background and is never awaited by
the UI. AI suggestions arrive asynchronously and never block a click. If the AI/transcript
endpoints fail outright, the `catch` blocks around those `fetch` calls swallow the error —
manual navigation is completely unaffected either way.

**Breadcrumb / history.** The call's actual path is derived from its `CallEvent` log (the
sequence of branches actually selected during the call), not from a static "previous
branch" pointer on each branch — because a branch can be reached from more than one parent,
a single static pointer can't represent that. Jumping to an earlier breadcrumb entry
truncates local history and persists the jump as a new event, so the event log is always an
accurate record of what actually happened on the call, back-tracking included.

## Branch data model

```ts
{
  id, title,            // title describes WHAT HAPPENED, e.g. "They dislike current
                         // software" — never an instruction like "Continue"
  speaker, type, stage,
  category,             // coarse topic grouping shared across both trees — derived from
                         // stage, used for search/analytics (lib/branch-category.ts)
  trigger,               // what the prospect said or what happened
  responseText,          // what the rep should say — natural, not a corporate script
  responseAlt,           // optional alternative phrasing
  objective,              // what this line is trying to learn/achieve
  notes, warning,         // optional
  tags,                   // string[] — doubles as "keywords" for search
  aiKeywords,              // string[] — additional keywords for AI matching
  nextBranchIds,           // string[] — the branches this one can lead to
  previousBranchId, order, isRoot,
  terminal,                // computed — true iff nextBranchIds is empty; never set directly
  outcome,                  // which CallOutcome this (terminal) branch typically maps to
  objectionType,             // only meaningful when type = OBJECTION
  aiConfidenceThreshold,      // per-branch override for the AI confidence bar
  branchPriority,              // tie-breaker when multiple branches could plausibly match
  abTestGroup,                  // reserved for Phase 7 (A/B testing) — not yet wired up
}
```

## Branch validation

`src/lib/branch-validation.ts` checks, on every seed and on demand via `/builder/quality`:

- **Duplicate ids** (error) and **duplicate titles** (warning — context-aware: the same
  title in the same `category` is flagged as likely accidental; the same title in a
  *different* category is flagged as probably-fine-but-worth-a-glance)
- **Broken transitions** — a `nextBranchIds` entry that points at a branch that doesn't exist
- **Self-loops** — a branch listing itself as a next branch
- **Orphan branches** — no incoming reference from anywhere, and not a declared root
- **Unreachable branches** — can't be reached via BFS from any root (stricter than "orphan":
  catches branches that are only reachable through another already-unreachable branch)
- **Dead branches** — a leaf whose type isn't SUCCESS/EXIT/CALLBACK, i.e. probably not meant
  to be a dead end
- **Impossible transitions** — a receptionist-speaker branch leading straight into a
  decision-maker-speaker branch without a TRANSFER/DECISION_MAKER step in between
- **Empty required fields** — title/trigger/say/objective must all be non-empty

`seedConversationTree()` (`lib/seed-runner.ts`) runs validation **before** writing anything
to the database — a broken seed is refused, not written. This is the system that would have
caught the historical incident where the "They dislike it" branch briefly contained the
root's opening line after a mis-click in the Builder (that specific incident happened,
was caught, and was fixed by re-seeding — see git history).

## AI architecture

**What's real today:** a keyword-matching `MockBranchSuggestionService`
(`src/lib/branch-suggestion.ts`), fed by transcript chunks the rep types or pastes in the
Navigator's Transcript panel. It's a genuinely working feature — not a placeholder screen —
just not backed by real speech-to-text or an LLM yet. Rule-based coaching
(`lib/call-coach.ts`) and the rule-based call summary (`lib/call-summary.ts`) work the same
way: real, useful, zero external services.

**The contract that doesn't change when real AI is added:**

```ts
interface BranchSuggestionService {
  suggest(chunk: TranscriptChunk, candidateBranches: Branch[]): Promise<BranchSuggestion>;
}
// BranchSuggestion = { transcript, suggestedBranchId, confidence }
```

`POST /api/calls/[id]/transcript` logs the chunk, calls the suggestion service, and logs the
result as a pending `AiSuggestion` row — it never touches `Call.currentBranchId`. The rep's
explicit **Accept** click calls the exact same `handleSelect()` function a manual branch
click uses (`src/components/navigator/call-navigator-client.tsx`), then separately marks the
suggestion as accepted for the accuracy log. **Ignore** just marks it ignored. This
"AI proposes, rep disposes" boundary is enforced by architecture, not convention — see
`tests/ai-cannot-hijack-branch.test.ts`, which statically checks the relevant route/service
source files for the absence of any code path that could apply a suggestion automatically.

**Two decisions needed before real transcription/LLM wiring can start** (not solvable by
writing more code — these are calls only Avelon can make):

1. **Audio capture.** Isse calls from his own UK phone, not through this app. Live
   transcription needs audio in the browser somehow: (a) browser mic picking up his side +
   speakerphone, (b) a browser softphone (e.g. Twilio Voice) so the call itself routes
   through the browser, or (c) drop "live" and transcribe from a post-call recording upload
   instead. These are materially different builds.
2. **AI/LLM provider.** Once real transcription exists, branch classification and coaching
   need an LLM. Default recommendation: Vercel AI Gateway (works with the existing Vercel
   account, `provider/model` strings, no separate key management) — confirm or override.

Everything else in this app works today regardless of how those two questions are answered.

## Privacy & recording

`Call.recordingConsent` (nullable boolean) and `Call.recordingStatus`
(`not_recording` | `recording` | `recorded`) exist on the schema now so consent state has
somewhere to live once real recording is wired up. **No audio is recorded today** — there is
no telephony/audio capture in this build (see "AI architecture" above). Before implementing
real recording, add explicit consent capture appropriate to two-party-consent and UK
GDPR/PECR requirements — this app must never silently record a call.

## Call outcomes & follow-up

13 outcomes (`CALL_OUTCOMES` in `src/lib/types.ts`): discovery booked, callback booked,
decision-maker unavailable, interested, information requested, not interested, wrong number,
no fit, follow-up required, referred to another person, no answer, voicemail, other. Ending a
call without picking one is not possible — the outcome modal blocks on it. Picking
**Callback booked** or **Follow-up required** opens structured capture: date/time, timezone,
contact name, contact number, notes.

## How to add a new branch

Two ways:

1. **Conversation Builder** (`/builder`) — the intended way for anyone who isn't touching
   code. Create/edit/duplicate/delete branches, pick next branches from a searchable list,
   and preview exactly how the branch will render in the Navigator before saving. Deleting a
   branch automatically strips it from every other branch's `nextBranchIds` so nothing is
   left dangling.
2. **Seed data** (`src/data/seed-branches.ts`) — for changes that should ship as part of the
   built-in script. Add an entry, then run `npm run db:seed` (or use **Settings → Reset
   built-in script**, which re-runs the same seed without touching branches you've added
   yourself).

## Authentication

Intentionally single-user with no login — the whole app is Isse's. The API and data layer
don't assume a single user anywhere (e.g. `CallEvent.selectedBy` and `AiSuggestion.status`
already distinguish rep actions from AI proposals), so adding real multi-user auth later
means adding a `User` model, a `userId` on `Call`, and an auth check in the API routes — no
restructuring.

## Build phases (per the V2 spec)

| Phase | Status |
|---|---|
| 1. Branch architecture (data model, validation, quality report) | **Shipped** |
| 2. Manual live navigator (state header, goal, choose-branch, coach, do-not-pitch) | **Shipped** |
| 3. Live transcription | Architected + working with typed input; real STT blocked on the audio-capture decision above |
| 4. AI branch recommendations | Architected + working with the keyword mock; real LLM blocked on the AI-provider decision above |
| 5. Post-call AI coaching / call scoring | Rule-based summary shipped; LLM-based scoring/missed-opportunity detection not started |
| 6. Branch analytics | **Shipped** (encounter counts + discovery-booked conversion rate) |
| 7. A/B testing | Not started — `abTestGroup` field reserved on the schema only |

## Design decisions worth knowing

- **Postgres (Neon), not SQLite.** V1 shipped on SQLite for zero-setup local dev; moving to
  deployment required a real database (SQLite's file-based storage doesn't survive
  serverless functions), so V2 provisioned Neon Postgres via the Vercel Marketplace. Same
  database for local dev and production right now — see `.env` / `.env.local`.
- **No `framer-motion`.** The brief is explicit that speed beats polish here ("Isse is on a
  call") and to avoid excessive animation — a few CSS transitions cover everything the
  Navigator needs.
- **Node's built-in test runner, not Vitest.** Disk space was extremely tight during
  development; `node --import tsx --test` gets full TypeScript test support with zero new
  dependencies, since `tsx` was already installed.
- **Rule-based coaching/summary before LLM-based.** Both are genuinely useful today and
  ship with zero external dependencies. They're structured so a real LLM can replace the
  rule engine later without changing their call sites.
