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

    Pramaan/
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.base.json
│
├── apps/
│   └── mobile/                          # Ionic + React (Capacitor)
│       ├── .browserslistrc
│       ├── .gitignore
│       ├── capacitor.config.ts
│       ├── cypress.config.ts
│       ├── eslint.config.js
│       ├── index.html
│       ├── ionic.config.json
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       ├── .vscode/
│       │   └── extensions.json
│       ├── cypress/
│       │   ├── e2e/
│       │   │   └── test.cy.ts
│       │   ├── fixtures/
│       │   │   └── example.json
│       │   └── support/
│       │       ├── commands.ts
│       │       └── e2e.ts
│       ├── dist/
│       ├── public/
│       │   ├── favicon.png
│       │   ├── manifest.json
│       │   └── demo/
│       │       ├── control_bill.json
│       │       └── trap_bill.json
│       └── src/
│           ├── App.test.tsx
│           ├── App.tsx
│           ├── main.tsx
│           ├── setupTests.ts
│           ├── vite-env.d.ts
│           ├── components/
│           │   ├── AuditViewer.tsx
│           │   ├── BBoxOverlay.tsx
│           │   ├── ConfidenceGate.tsx
│           │   ├── ConsentButton.tsx
│           │   ├── DomainSwitch.tsx
│           │   ├── DraftLetter.tsx
│           │   ├── ExploreContainer.css
│           │   ├── ExploreContainer.tsx
│           │   ├── HoldChip.tsx
│           │   └── ProofCard.tsx
│           ├── data/
│           │   ├── apiClient.ts
│           │   ├── dataSource.ts
│           │   └── mockRun.ts
│           ├── hooks/
│           │   ├── useAudit.ts
│           │   └── useRun.ts
│           ├── lib/
│           │   └── camera.ts
│           ├── pages/
│           │   ├── ActPage.tsx
│           │   ├── CapturePage.tsx
│           │   ├── Home.css
│           │   ├── Home.tsx
│           │   ├── ProofPage.tsx
│           │   └── ReadPage.tsx
│           └── theme/
│               └── variables.css
│
├── data/
│   └── samples/
│       ├── adversarial/
│       │   └── .gitkeep
│       ├── control/
│       │   └── .gitkeep
│       └── trap/
│           └── .gitkeep
│
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── pipeline.md
│   ├── pramaan.md
│   ├── pramaanref.md
│   ├── questions.md
│   ├── roles.md
│   ├── traps.md
│   ├── ajit.md
│   ├── manas.md
│   ├── manasbranches.md
│   └── murgesh.md
│   (plus *.html work-wiring reports: Ajit/Muraghesh/Vrajesh/manas)
│
├── packages/
│   ├── contracts/                       # JSON schemas + TS types
│   │   ├── package.json
│   │   ├── types.ts
│   │   ├── audit_event.schema.json
│   │   ├── extracted_field.schema.json
│   │   ├── hold_event.schema.json
│   │   ├── proof_card.schema.json
│   │   ├── rule_row.schema.json
│   │   └── run_response.schema.json
│   ├── rulebooks/
│   │   ├── bill_rules.json
│   │   ├── lease_rules.json
│   │   └── citations.md
│   └── templates/
│       ├── bill_complaint.txt
│       └── lease_counter_notice.txt
│
└── services/
    └── brain/                           # Node MCP server
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── audit/
            │   └── audit_log.ts
            ├── gateway/
            │   └── billing_gateway.ts
            ├── mcp/
            │   ├── server.ts
            │   └── tools/
            │       ├── get_hold_status.ts
            │       ├── lookup_rule.ts
            │       ├── place_hold.ts
            │       └── release_hold.ts
            ├── pipeline/
            │   ├── confidence.ts
            │   ├── orchestrator.ts
            │   └── steps/
            │       ├── 01_read.ts
            │       ├── 02_lookup.ts
            │       ├── 03_compare.ts
            │       ├── 04_prove.ts
            │       ├── 05_act.ts
            │       └── 06_draft.ts
            └── seeds/
                ├── control.ts
                ├── index.ts
                └── trap.ts

---

## 2. Data flow — the request path

```
[Camera / Seeded JSON]
   └── apps/mobile/src/pages/CapturePage.tsx
        └── apps/mobile/src/data/dataSource.ts   <-- VITE_RUN_MODE (mock | live)
             ├── (mock) ─────────────────────────> apps/mobile/public/demo/trap_bill.json
             └── (live) ─────────────────────────> apps/mobile/src/data/apiClient.ts
                            └── POST /run
                                 └── services/brain/src/index.ts
                                      └── services/brain/src/pipeline/orchestrator.ts
                                           ├── 01_read.ts (Ajit/M)   -> OCR/Vision
                                           ├── 02_lookup.ts (M)      -> MCP lookup_rule -> packages/rulebooks
                                           ├── 03_compare.ts (V)     -> Deterministic Math
                                           ├── 04_prove.ts (V)       -> 3-Anchor ProofCard
                                           ├── 05_act.ts (M)         -> MCP place_hold -> services/brain/src/gateway
                                           └── 06_draft.ts (Ajit/M)  -> Granite / Template
                                                └── Returns RunResponse to apps/mobile
                                                     └── apps/mobile/src/pages/ProofPage.tsx & ActPage.tsx
```

Walking the path, bottom-up:

- `CapturePage.tsx` is the single entry: it fires the Capacitor camera (live
  device) or a seeded JSON (stage). It does not decide where data comes from.
- `dataSource.ts` is THE mock|live switch. One env-var flip —
  `VITE_RUN_MODE` — changes the entire source of truth. Nothing in the app
  talks to the backend directly; everything goes through this one module.
- **mock**: reads `public/demo/trap_bill.json` (or `control_bill.json`),
  the deterministic stage payload — byte-identical every run, no camera, no
  network (playbook rule #6).
- **live**: `apiClient.ts` → `POST /run` on the brain → `index.ts` (HTTP
  surface) → `orchestrator.ts` runs the six-step trunk in order.
  1. `01_read.ts` (Ajit body / Murgesh wire) — OCR/vision → `extracted_fields[]`
  2. `02_lookup.ts` (Murgesh) — MCP `lookup_rule` → `packages/rulebooks`
  3. `03_compare.ts` (Vrajesh) — DETERMINISTIC subtraction → gaps (no LLM)
  4. `04_prove.ts` (Vrajesh) — assemble the 3-anchor proof card
  5. `05_act.ts` (Murgesh) — MCP `place_hold` → `gateway/billing_gateway.ts`
  6. `06_draft.ts` (Ajit body / Murgesh wire) — Granite fills the template
- The assembled `RunResponse` flows back to the mobile app, where
  `ProofPage.tsx` and `ActPage.tsx` render it (cards + consent + hold chip).

The two downstream readers of the switch are only `useRun.ts`/`useAudit.ts`
via `dataSource.ts`; pages never import `apiClient.ts` or the demo JSON
directly.

---

## 3. Ownership of folders (one owner each — the DRI rule as directories)

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

## 4. The three folders that encode the philosophy (do not "tidy" these away)

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

## 5. What is NOT in the repo (and why)

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

## 6. Build & run (the commands the team actually uses)

    # install everything once
    npm install

    # brain (Murgesh/Ajit)
    npm -w services/brain run dev          # serves /run on :4000

    # mobile, native (Ajit/Vrajesh) — needs a device/emulator
    npm -w apps/mobile run build
    npx cap run android                    # or ios

    # mobile, BROWSER — this is the STAGE demo path (Vrajesh)
    npm -w apps/mobile run serve           # ionic serve, phone width, VITE_RUN_MODE=mock

    # deterministic stage payload
    curl localhost:4000/run?seed=trap      # byte-identical every time

    # tests (run before every freeze tag)
    npm -w services/brain run test

`VITE_RUN_MODE` in `.env` flips `dataSource.ts` between mock and live. On stage
the browser build runs with the seeded `/run?seed=trap`, so there is no live
camera and no live network in the 90 seconds (playbook rule #6).

Pramaan · Repository & Case Structure · HackVerse Track 3