# PRAMAAN — Repository & Case Structure
### Authoritative layout of the codebase · HackVerse Track 3
### Owners: Vrajesh (Lead/BARK) · Murgesh (Tech Co-Lead/TRUNK) · Ajit (SAP) · Manas (ROOTS)

This document is the map of the repo. Every folder has one owner and one job.
If a file does not fit a folder below, the folder list is wrong — fix the list,
do not create a random new top-level directory.

---

## 0. Why this shape (read before you touch anything)

- Monorepo with workspaces. Four people, 36 hours, one demo. One repo means
  one `npm install`, one set of shared types, and no "which version of the
  schema do you have?" arguments. The cost of a monorepo (slightly bigger
  install) is nothing at this scale; the cost of two repos (drift) is fatal.
- `packages/contracts` IS the playbook's "schema-first" rule made into a
  folder. Both the app and the brain import the SAME generated types from
  here. The schema is the contract; the contract lives in one place.
- `services/brain/pipeline/steps` is the six-step trunk made literal: one
  file per step. The trunk is not a metaphor in the code — it is six files
  in a row.
- `apps/mobile/screens` is the vertical 4-flow made literal: one screen per
  beat. The mobile redesign and the 90-second beat sheet are the same four
  files.
- `packages/rulebooks` and `packages/templates` are Manas's lane as folders.
  His JSON and his wording are version-controlled artifacts, not chat
  messages. The citation gate (nothing ships unsigned) is enforceable
  because his work is reviewable in a diff.

---

## 1. The tree

    pramaan/
    |
    |-- README.md                       # one-screen project summary + how to run
    |-- package.json                    # workspaces: apps/* packages/* services/*
    |-- tsconfig.base.json
    |-- .env.example                    # RUN_MODE=mock|live, IBM creds, thresholds
    |
    |-- apps/
    |   |-- mobile/                     # OWNER: Vrajesh (UI) + Ajit (camera/ingest)
    |   |   |-- ionic.config.json
    |   |   |-- capacitor.config.ts     # native runtime; Camera plugin declared
    |   |   |-- package.json
    |   |   |-- src/
    |   |   |   |-- main.tsx
    |   |   |   |-- App.tsx             # router over the 4 screens + DomainSwitch
    |   |   |   |-- data/
    |   |   |   |   |-- dataSource.ts   # THE mock|live switch (playbook rule #2)
    |   |   |   |   |-- mockRun.ts      # returns seeded /run payloads for ionic serve
    |   |   |   |   `-- apiClient.ts    # POST /run, POST /run?seed=trap
    |   |   |   |-- screens/            # one screen = one beat of the pitch
    |   |   |   |   |-- CaptureScreen.tsx   # beat "Scan"   : Capacitor Camera
    |   |   |   |   |-- ReadScreen.tsx      # beat "Read"   : image + BBoxOverlay + yellow gate
    |   |   |   |   |-- ProofScreen.tsx     # beat "Prove/Trap": ProofCard stack
    |   |   |   |   `-- ActScreen.tsx       # beat "Act/Consent": HoldChip + letter + tap + audit
    |   |   |   |-- components/
    |   |   |   |   |-- BBoxOverlay.tsx     # draws rectangles from extracted_fields[].bbox
    |   |   |   |   |-- ConfidenceGate.tsx  # yellow "tap to confirm" when conf < threshold
    |   |   |   |   |-- ProofCard.tsx       # your -> official -> gap + 3 anchors
    |   |   |   |   |-- HoldChip.tsx        # amber(staged) | green(placed) | grey(released)
    |   |   |   |   |-- ConsentButton.tsx   # the tap; calls /consent then logs audit
    |   |   |   |   |-- AuditViewer.tsx     # scrollable immutable trail
    |   |   |   |   |-- DraftLetter.tsx     # shows draft + the "AI-generated" banner
    |   |   |   |   `-- DomainSwitch.tsx    # Bill | Lease dropdown (proves the tree)
    |   |   |   |-- hooks/
    |   |   |   |   |-- useRun.ts           # orchestrates capture -> /run -> state
    |   |   |   |   `-- useAudit.ts
    |   |   |   `-- lib/
    |   |   |       `-- camera.ts           # @capacitor/camera wrapper + permissions
    |   |   `-- public/demo/            # pre-seeded bills for the browser stage demo
    |   |       |-- trap_bill.json
    |   |       `-- control_bill.json
    |   |
    |   `-- (web-demo optional)         # NOT required: `ionic serve` already gives
    |                                   # a browser build at phone width for the stage.
    |                                   # Add only if you want a separate framed shell.
    |
    |-- services/
    |   `-- brain/                      # OWNER: Murgesh (TRUNK)
    |       |-- package.json
    |       |-- src/
    |       |   |-- index.ts            # HTTP: POST /run, POST /run?seed=trap, POST /consent
    |       |   |-- pipeline/
    |       |   |   |-- orchestrator.ts # watsonx Orchestrate flow wiring the 6 steps
    |       |   |   |-- confidence.ts   # threshold gate: placed vs staged
    |       |   |   `-- steps/          # THE TRUNK — one file per step, in order
    |       |   |       |-- 01_read.ts      # OCR/vision -> extracted_fields[]
    |       |   |       |-- 02_lookup.ts    # MCP lookup_rule -> matched rule rows
    |       |   |       |-- 03_compare.ts   # DETERMINISTIC subtract -> gaps (NO LLM)
    |       |   |       |-- 04_prove.ts     # assemble 3-anchor proof cards
    |       |   |       |-- 05_act.ts       # MCP place_hold (provisional) | stage
    |       |   |       `-- 06_draft.ts     # Granite fill template + banner
    |       |   |-- mcp/
    |       |   |   |-- server.ts       # MCP server registering the tools below
    |       |   |   `-- tools/
    |       |   |       |-- lookup_rule.ts
    |       |   |       |-- place_hold.ts
    |       |   |       |-- get_hold_status.ts
    |       |   |       `-- release_hold.ts
    |       |   |-- gateway/
    |       |   |   `-- billing_gateway.ts  # MOCK billing API; in-memory hold state
    |       |   |-- audit/
    |       |   |   `-- audit_log.ts        # append-only writer (immutability by design)
    |       |   `-- seeds/
    |       |       `-- trap.ts             # deterministic payload for ?seed=trap
    |       `-- tests/
    |           |-- compare.test.ts         # unit: subtraction + rule matching
    |           |-- hold.test.ts            # unit: placed/staged/released transitions
    |           `-- pipeline.e2e.test.ts    # /run on trap + control seeds
    |
    |-- packages/
    |   |-- contracts/                  # OWNER: Murgesh (publish) + all (consume)
    |   |   |-- extracted_field.schema.json
    |   |   |-- proof_card.schema.json
    |   |   |-- hold_event.schema.json
    |   |   |-- audit_event.schema.json
    |   |   |-- run_response.schema.json
    |   |   |-- rule_row.schema.json        # shape Manas fills (bill + lease)
    |   |   `-- types.ts                    # TS types generated from the JSON schemas
    |   |
    |   |-- rulebooks/                  # OWNER: Manas (ROOTS) — the curated truth
    |   |   |-- bill_rules.json             # 10-15 rows, every row cited
    |   |   |-- lease_rules.json            # 5 rows (3 illegal), each with a fix
    |   |   `-- citations.md                # citation sheet / Q&A one-pager
    |   |
    |   `-- templates/                  # OWNER: Manas (wording) — filled by Granite/fallback
    |       |-- bill_complaint.txt          # {{placeholders}}
    |       `-- lease_counter_notice.txt
    |
    |-- data/
    |   `-- samples/                    # OWNER: Ajit (adversarial) + Manas (trap/control spec)
    |       |-- trap/                       # the planted-overcharge bill (image + json)
    |       |-- control/                    # the all-correct bill (all-green restraint beat)
    |       `-- adversarial/                # Ajit's 5 nasty bills (tilt/blur/blank/...)
    |
    `-- docs/                           # all team + engineering docs live here
        |-- pramaan-team-doc.md             # plain-language story (the "why")
        |-- pramaan-sprint-playbook.md      # the 36-hour plan
        |-- pramaan-traps.md                # the 4 pre-mortem fixes
        |-- pramaan-repo-structure.md       # THIS file
        |-- pramaan-pipeline.md             # how data travels
        `-- pramaan-technical-reference.md  # the A-Z technical bible

---

## 2. Ownership of folders (one owner each — the DRI rule as directories)

| Folder | Owner | What "own" means here |
|---|---|---|
| apps/mobile/src/screens, components, hooks | Vrajesh | the screen, the demo, the beat flow |
| apps/mobile/src/lib/camera.ts + ReadScreen ingest wiring | Ajit | Capacitor camera + bbox/confidence contract into the UI |
| apps/mobile/src/data/dataSource.ts | Vrajesh | the single mock|live switch |
| services/brain/** | Murgesh | the engine; he is the only one who merges here |
| services/brain/pipeline/steps/01_read.ts (OCR call) | Ajit | the OCR/vision step + confidence scoring |
| services/brain/pipeline/steps/06_draft.ts (Granite call) | Ajit | Granite integration + template fallback |
| packages/contracts/** | Murgesh (publish) | freezes schemas in P1; changes need a V-M sync |
| packages/rulebooks/** | Manas | the citation gate lives in his PRs |
| packages/templates/** | Manas | the wording the letter/notice renders |
| data/samples/adversarial/** | Ajit | the break-the-demo set |
| data/samples/trap, control | Manas (spec) + Vrajesh (charged side of trap) | co-owned per checklist C4 |
| docs/** | Vrajesh | keeps the single source of truth consistent |

Rule: a PR that touches two owners' folders needs both to approve. A PR
that touches `packages/contracts` needs Murgesh AND whoever consumes the
changed field (usually Vrajesh) — because a schema change is a contract
change, and contract changes are the #1 merge risk.

---

## 3. The three folders that encode the philosophy (do not "tidy" these away)

1. `packages/contracts` = "schema-first." If you ever feel like inlining a
   type in the app or the brain, stop. Add it here and import it. The moment
   the app and the brain disagree on a field name, the demo breaks silently.
2. `services/brain/pipeline/steps` = "the trunk is code, not a metaphor."
   Keep the files numbered and in order. Do not merge two steps into one
   file to "save a file" — the readability of the trunk IS the architecture
   story you tell on stage.
3. `packages/rulebooks` + `packages/templates` = "prove, don't guess." The
   engine cannot invent truth; it can only read these files. An empty or
   uncited row here is the only legitimate reason a card shows "unverified."
   This folder is the physical embodiment of Truth 2.

---

## 4. What is NOT in the repo (and why)

- No real hospital/insurance/government API keys. Every external system the
  agent "acts on" is the MOCK in `services/brain/gateway`. Real integrations
  are a post-hackathon concern; for the sprint, the mock IS the system.
- No scraped full law corpus. The rule-books are the curated highlight reel
  (Trap 3 fix). A `scrapers/` folder would be a time sink and a liability;
  do not create one during the sprint.
- No second copy of the engine for the lease. The lease is a config
  (`packages/rulebooks/lease_rules.json`) consumed by the SAME pipeline. If
  you see anyone about to copy `pipeline/` for the lease, stop them — that
  amputates the tree (playbook rule #10).

---

## 5. Build & run (the commands the team actually uses)

    # install everything once
    npm install

    # brain (Murgesh/Ajit)
    npm -w services/brain run dev          # serves /run on :4000

    # mobile, native (Ajit/Vrajesh) — needs a device/emulator
    npm -w apps/mobile run build
    npx cap run android                    # or ios

    # mobile, BROWSER — this is the STAGE demo path (Vrajesh)
    npm -w apps/mobile run serve           # ionic serve, phone width, RUN_MODE=mock

    # deterministic stage payload
    curl localhost:4000/run?seed=trap      # byte-identical every time

    # tests (run before every freeze tag)
    npm -w services/brain run test

`RUN_MODE` in `.env` flips `dataSource.ts` between mock and live. On stage
the browser build runs with the seeded `/run?seed=trap`, so there is no live
camera and no live network in the 90 seconds (playbook rule #6).

Pramaan · Repository & Case Structure · HackVerse Track 3