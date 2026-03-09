# Eval Results

---

## Trigger Evals

**Method:** `claude -p` subprocess with stub plugin dir (target skill only) + stream-json `Skill` tool_use detection via tmux TTY.

### autology-workflow — 2026-03-09 — 17/20 (85%)

Description tested:
> Use after significant project actions — commit, push, PR — or when the team settles on how something should work: a technology choice, a standard, a rule, or an engineering policy.

| # | should_trigger | Result | Query |
|---|---------------|--------|-------|
| 0 | true | PASS | `just pushed feat(payments): add Stripe webhook handler for subscription events` |
| 1 | true | PASS | `PR #84 is up — refactored the notification service to use an event queue...` |
| 2 | true | PASS | `we decided: all background jobs will use BullMQ, not raw Redis pub/sub...` |
| 3 | true | FAIL | `going forward, every new service must expose a /healthz endpoint...` |
| 4 | true | PASS | `pushed the S3 migration — file uploads now go through FileStorageService...` |
| 5 | true | PASS | `settled on postgres jsonb for storing user preferences instead of a KV store` |
| 6 | true | PASS | `feat(auth): switch from bcrypt to argon2 for password hashing — merged to main` |
| 7 | true | FAIL | `the rule is: never store PII in logs. mask email and user IDs...` |
| 8 | true | PASS | `opened a PR to move rate limiting out of the API gateway into individual services` |
| 9 | true | FAIL | `we always do DB migrations in a separate PR from the feature code...` |
| 10 | false | PASS | `how does the FileStorageService handle large file uploads?` |
| 11 | false | PASS | `can you add pagination to the GET /users endpoint?` |
| 12 | false | PASS | `the webhook handler is throwing a 500 on Stripe's invoice.payment_failed...` |
| 13 | false | PASS | `what are the tradeoffs between BullMQ and Kafka for our job queue?` |
| 14 | false | PASS | `what does docs/payment-service.md say about how we handle refunds?` |
| 15 | false | PASS | `I committed to using React for the new admin dashboard...` |
| 16 | false | PASS | `can you push back on the requirement to add GraphQL?` |
| 17 | false | PASS | `what's the convention in this codebase for naming service classes?` |
| 18 | false | PASS | `triage just finished — it found FileStorageService as new...` |
| 19 | false | PASS | `you just wrote docs/background-jobs.md — looks good. now help me write the code` |

**Notes:** FAILs [3][7][9] are borderline team-process/operational-rule queries without explicit tech-choice framing. No false positives across all iterations.

---

### explore-knowledge — 2026-03-09 — 12/12 (100%)

Description tested:
> Use to answer questions about this project's decisions, architecture, and conventions — "why did we choose X?", "how does Y work?", "what's the convention for Z?". Also use for explicit /autology:explore-knowledge commands. Searches docs/, follows wikilinks, and synthesizes grounded answers from the knowledge base.

| # | should_trigger | Result | Query |
|---|---------------|--------|-------|
| 0 | true | PASS | `Why did we decide to use JWT over session cookies for the API?` |
| 1 | true | PASS | `How does the rate limiter work in this project?` |
| 2 | true | PASS | `What's the convention for error responses in our API?` |
| 3 | true | PASS | `What docs reference the auth service? I'm about to refactor it...` |
| 4 | true | PASS | `Walk me through what architectural decisions led to the current storage layer` |
| 5 | true | PASS | `What's the path between the JWT decision and the API gateway in the knowledge graph?` |
| 6 | false | PASS | `I just pushed feat(auth): add OAuth2 login with Google.` |
| 7 | false | PASS | `Remember this: we decided all background jobs will use BullMQ going forward.` |
| 8 | false | PASS | `How do I implement JWT token validation in Express?` |
| 9 | false | PASS | `Can you explain how bcrypt hashing works and why we use 12 salt rounds?` |
| 10 | false | PASS | `Sync the docs after my last commit — the FileService was refactored.` |
| 11 | false | PASS | `Can you help me write a unit test for the RateLimiter class?` |

**Notes:** 2 slash-command cases (`/autology:explore-knowledge overview`, `/autology:explore-knowledge autology-internals`) removed from eval set — they are routed as project commands, not Skill invocations.

---

### triage-knowledge — 2026-03-09 — 11/11 (100%)

Description tested:
> Use after significant actions (commits, decisions, refactors) or when asked to triage changes — classifies knowledge items as existing or new and provides topology hints for sync and capture.

| # | should_trigger | Result | Query |
|---|---------------|--------|-------|
| 0 | true | PASS | `I just pushed feat(auth): add OAuth2 login with Google. The UserService was updated to support OAuth users alongside existing password users.` |
| 1 | true | PASS | `Just committed refactor(storage): extract file upload logic from FileService into a dedicated S3FileStorage class.` |
| 2 | true | PASS | `We just merged a big PR — feat(payments): integrate Stripe for subscription billing. New PaymentService, updated UserService, and a new billing convention.` |
| 3 | true | PASS | `Triage my latest changes — I pushed a fix to the rate limiter and a new caching layer.` |
| 4 | true | PASS | `Just pushed fix(api): correct pagination cursor encoding. The cursor was double-encoded in base64.` |
| 5 | false | PASS | `Why did we move to a service-class pattern for rate limiting?` |
| 6 | false | PASS | `Capture this decision: we're adopting OpenTelemetry for distributed tracing across all services.` |
| 7 | false | PASS | `Run a full knowledge audit — the docs might be stale.` |
| 8 | false | PASS | `I'm designing the retry logic for the payment service. Should I use exponential backoff or fixed intervals?` |
| 9 | false | PASS | `Help me write a migration to add an index on users.email.` |
| 10 | false | PASS | `What does the FileService do? I need to understand it before I touch it.` |

**Notes:** Initial run (old description) scored 10/11 — FAIL [3] used "triage" informally without the description containing the word. Fixed by adding "or when asked to triage changes"; re-run confirmed 11/11. `/autology:triage-knowledge` slash-command case removed from eval set — routed as project command, not Skill invocation (same as explore-knowledge). Zero false positives.

---

## Behavioral Evals

### triage-knowledge — 2026-03-09 — with_skill: 14/14 (100%)  without_skill: 0/14 (0%)

| # | eval | assertion | with_skill | without_skill |
|---|------|-----------|-----------|--------------|
| 0 | mixed-batch | `existing-found` — `### Existing (→ sync)` section with user-service.md | PASS | FAIL |
| 1 | mixed-batch | `new-classified` — `### New (→ capture)` section with OAuth2 login | PASS | FAIL |
| 2 | mixed-batch | `topology-hints-existing` — `Connected:` and `Tags:` labels on existing node | PASS | FAIL |
| 3 | mixed-batch | `topology-hints-new` — `Suggested relations:` line on each new item | PASS | FAIL |
| 4 | mixed-batch | `output-format` — `**Autology** — Triage Results` header present | PASS | FAIL |
| 5 | all-new-items | `empty-state-format` — exact phrase "No existing matches found. All items classified as new." | PASS | FAIL |
| 6 | all-new-items | `no-matching-node-suffix` — each new item line includes `— no matching node` | PASS | FAIL |
| 7 | all-new-items | `new-items-listed` — BullMQ/email under `### New (→ capture)` | PASS | FAIL |
| 8 | all-new-items | `suggested-relations-present` — `Suggested relations:` line on each new item | PASS | FAIL |
| 9 | all-new-items | `output-format` — `**Autology** — Triage Results` header present | PASS | FAIL |
| 10 | topology-hints-depth | `primary-node-found` — shell-hook-scripts.md under `### Existing (→ sync)` | PASS | FAIL |
| 11 | topology-hints-depth | `connected-nodes-listed` — `Connected:` with autology-internals and codeless-architecture-decision wikilinks | PASS | FAIL |
| 12 | topology-hints-depth | `hub-or-orphan-flag` — `Hub`, `Orphan`, or link count in topology line | PASS | FAIL |
| 13 | topology-hints-depth | `output-format` — `**Autology** — Triage Results` header present | PASS | FAIL |

**Notes:** without_skill correctly classifies items but never produces the required section labels, topology hint format (`Connected:` / `Tags:` / `Suggested relations:`), or `— no matching node` suffix, scoring 0/14. The `output-format` assertion does not require the `>` blockquote prefix — it is visual styling only and not parsed by downstream skills (sync/capture).

---

### explore-knowledge — 2026-03-09 — with_skill: 25/25 (100%)  without_skill: 17/25 (68%)  delta: +32%

| # | eval | assertion | with_skill | without_skill |
|---|------|-----------|-----------|--------------|
| 0 | question-answering | `searches-docs-first` — grep/search of docs/ before answering | PASS | PASS |
| 1 | question-answering | `reads-architecture-decision` — codeless-architecture-decision.md read | PASS | PASS |
| 2 | question-answering | `follows-wikilinks` — at least one wikilinked node followed (1-hop) | PASS | FAIL |
| 3 | question-answering | `cites-docs-in-answer` — answer cites [[codeless-architecture-decision]] | PASS | PASS |
| 4 | question-answering | `correct-rationale` — ≥2 of 4 documented problems cited | PASS | PASS |
| 5 | overview-operation | `globs-all-docs` — docs/ globbed to find all nodes | PASS | PASS |
| 6 | overview-operation | `hub-nodes-listed` — top 5 hub nodes reported | PASS | PASS |
| 7 | overview-operation | `orphan-nodes-listed` — orphan node list reported | PASS | PASS |
| 8 | overview-operation | `counts-reported` — total node + link + component counts | PASS | PASS |
| 9 | overview-operation | `type-breakdown-reported` — node type breakdown summary line | PASS | FAIL |
| 10 | overview-operation | `type-breakdown-accurate` — 4 concept / 3 decision / 1 component (8 total) | PASS | FAIL |
| 11 | neighborhood-traversal | `target-node-read` — autology-internals.md read | PASS | PASS |
| 12 | neighborhood-traversal | `outgoing-links-found` — all 5 outgoing link targets identified | PASS | PASS |
| 13 | neighborhood-traversal | `incoming-links-considered` — docs/ grepped for [[autology-internals]]; codeless-architecture-decision found as 1-hop incoming | PASS | FAIL |
| 14 | neighborhood-traversal | `2-hop-traversal` — neighbors-of-neighbors also found and reported | PASS | PASS |
| 15 | neighborhood-traversal | `type-and-tags-included` — each node output includes its type and tags | PASS | FAIL |
| 16 | path-query | `endpoint-nodes-read` — both autology-philosophy.md and shell-hook-scripts.md read | PASS | PASS |
| 17 | path-query | `intermediate-node-found` — codeless-architecture-decision identified as intermediate | PASS | FAIL |
| 18 | path-query | `path-output-format` — A → B → C format with hop labels | PASS | FAIL |
| 19 | path-query | `correct-hop-count` — 2 hops | PASS | FAIL |
| 20 | reentry-guard-conditions | `searches-docs-first` — grep/search of docs/ before answering | PASS | PASS |
| 21 | reentry-guard-conditions | `reads-reentry-guard-doc` — autology-workflow-reentry-guard.md read | PASS | PASS |
| 22 | reentry-guard-conditions | `skill-based-condition` — triage-knowledge/sync-knowledge/capture-knowledge just ran | PASS | PASS |
| 23 | reentry-guard-conditions | `file-based-condition` — a docs/*.md file was just written or edited | PASS | PASS |
| 24 | reentry-guard-conditions | `event-vs-state-rationale` — state-based is fragile; event-based looks backward | PASS | PASS |

**Notes:** `path-query` is the most discriminating case (+75% delta): without_skill narrated a philosophical connection between endpoints instead of performing BFS graph traversal, missing the intermediate node entirely. `neighborhood-traversal` fails incoming-link grep and type/tags output without skill guidance. `overview-operation` without skill uses functional layers (Philosophy/Spec/Guide) rather than reading frontmatter `type:` fields for breakdown. `reentry-guard-conditions` is non-discriminating (0% delta) — the keyword "reentry guard" maps too directly to the filename; both configs found the doc without skill guidance. Assertions calibrated to main-branch repo state (8 docs: 4 concept / 3 decision / 1 component).
