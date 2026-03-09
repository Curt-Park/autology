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

### capture-knowledge — 2026-03-09 — 10/12 (83%)

Description tested:
> Use to permanently record a project decision, convention, pattern, or known issue into the knowledge base (docs/) — triggers on explicit save intent ("remember this", "save this", "document this"), decision or convention announcements ("we decided", "settled on", "the rule is"), or triage output classifying new items to capture. Distinct from conversational memory — this writes to docs/.

| # | should_trigger | Result | Query |
|---|---------------|--------|-------|
| 0 | true | FAIL | `Remember this: we decided to use Redis for session storage because it supports TTL natively and we need distributed sessions across pods.` |
| 1 | true | PASS | `Document this decision — we're going with PostgreSQL as our primary database. We evaluated MongoDB but chose Postgres for ACID compliance.` |
| 2 | true | FAIL | `We just settled on a convention: all timestamps in API responses must be ISO 8601 in UTC. No Unix timestamps.` |
| 3 | true | PASS | `I want to capture this for the team: we discovered that our ORM has N+1 query issues on nested relations — always use eager loading with include.` |
| 4 | true | PASS | `Save this as a known issue: the payment service has a race condition under high load when two requests try to create the same order simultaneously.` |
| 5 | true | PASS | `Let's document the architecture decision: we chose a monorepo over separate repos because shared types and atomic cross-service commits outweigh the CI complexity.` |
| 6 | false | PASS | `Why did we choose Redis over Memcached? I want to understand the reasoning.` |
| 7 | false | PASS | `I just pushed a commit: refactor(storage): extract FileService into S3FileStorage and LocalFileStorage.` |
| 8 | false | PASS | `I'm thinking about whether to use Redis or Memcached for the cache layer. What are the tradeoffs?` |
| 9 | false | PASS | `Sync the docs — the CacheService was refactored and the existing docs might be stale.` |
| 10 | false | PASS | `Help me implement a Redis-backed session store in Express.` |
| 11 | false | PASS | `What conventions do we have around database migrations?` |

**Notes:** Zero false positives. FAILs [0][2] are structural description limits: [0] "Remember this" is consistently interpreted as conversational memory instruction rather than a docs write request, even with "Distinct from conversational memory" in the description; [2] is a pure declarative announcement with no explicit save intent — Claude does not invoke the skill without an action verb. Both cases require an action verb ("document", "capture", "save") or a triage handoff to reliably trigger. Description iterated from phrase enumeration → semantic categories → current hybrid; 83% is the assessed ceiling without false positive risk.

---

### sync-knowledge — 2026-03-09 — 10/10 (100%)

Description tested:
> Use when existing autology docs/ nodes need syncing or updating — when a doc is out of date after a code change, after refactors, when triage identifies existing nodes to verify, or for periodic full audits. Not for new items (use capture) or knowledge questions (use explore).

| # | should_trigger | Result | Query |
|---|---------------|--------|-------|
| 0 | true | PASS | `The docs might be out of date after last week's refactor. Can you check and fix any drift?` |
| 1 | true | PASS | `Run a full knowledge audit — we've had a lot of churn lately and I want to make sure nothing is stale.` |
| 2 | true | PASS | `Triage found these existing nodes that need syncing: docs/rate-limiter-service.md, docs/file-service.md. Please sync them.` |
| 3 | true | PASS | `docs/api-gateway.md needs syncing after the port change — can you update it?` |
| 4 | false | PASS | `I just pushed feat(queue): add BullMQ job queue for background email sending. No existing docs reference this.` |
| 5 | false | PASS | `What does our knowledge graph say about the API gateway?` |
| 6 | false | PASS | `Capture this: we decided all background jobs will retry up to 3 times with exponential backoff.` |
| 7 | false | PASS | `Triage my latest commit: refactor(cache): replace in-memory Map with Redis-backed store.` |
| 8 | false | PASS | `Help me write tests for the CacheService.` |
| 9 | false | PASS | `What's the convention for how we name database migrations in this project?` |

**Notes:** Initial description scored 8/12 — FAIL on slash-command cases (routed as project commands, not Skill invocations; removed from eval set) and FAIL on single-file "needs syncing" query (description said "may need updating" without "syncing"). Added `"syncing or updating"` and `"when a doc is out of date after a code change"` to description; re-run confirmed 10/10. Zero false positives.

---

## Behavioral Evals

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

---

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

### capture-knowledge — 2026-03-09 — with_skill: 13/13 (100%)  without_skill: 9/13 (69%)  delta: +31%

| # | eval | assertion | with_skill | without_skill |
|---|------|-----------|-----------|--------------|
| 0 | granularity-fold | `granularity-reasoning-documented` — trace explains connection pool is folded into PostgreSQL node and why | PASS | FAIL |
| 1 | granularity-fold | `one-doc-created` — exactly 1 doc created (not 2) | PASS | FAIL |
| 2 | granularity-fold | `type-decision` — created doc has type: decision in frontmatter | PASS | PASS |
| 3 | granularity-fold | `pool-detail-folded` — connection pool max 10 in PostgreSQL node body, not a separate file | PASS | FAIL |
| 4 | bidirectional-wikilinks | `new-node-created` — docs/cache-service.md created with type: component | PASS | PASS |
| 5 | bidirectional-wikilinks | `forward-wikilink` — new node contains [[api-gateway]] wikilink | PASS | PASS |
| 6 | bidirectional-wikilinks | `reverse-wikilink` — docs/api-gateway.md edited to add [[cache-service]] reverse wikilink | PASS | PASS |
| 7 | bidirectional-wikilinks | `report-format` — report uses `**Autology** — Captured [type]: docs/{slug}.md` format | PASS | FAIL |
| 8 | convention-fold-mixed | `type-convention` — created doc has type: convention in frontmatter | PASS | PASS |
| 9 | convention-fold-mixed | `one-doc-created` — exactly 1 doc created (not 2) | PASS | PASS |
| 10 | convention-fold-mixed | `body-contains-rule` — node body describes the snake_case requirement | PASS | PASS |
| 11 | convention-fold-mixed | `example-folded` — userId → user_id example in convention node body, not a separate file | PASS | PASS |
| 12 | convention-fold-mixed | `granularity-reasoning-documented` — response explains why example is folded | PASS | PASS |

**Notes:** `granularity-fold` is the most discriminating case (+75% delta): without_skill treats every triage item as an independent capture target and creates one file per item; with_skill correctly identifies that a configuration detail belongs inside the parent decision node. `bidirectional-wikilinks` is partially discriminating (+25% delta) — both configs place wikilinks correctly but only with_skill produces the structured `**Autology** — Captured` report header. `convention-fold-mixed` is non-discriminating (0% delta): the fold relationship between "snake_case rule" and "userId → user_id example" is obvious enough that without_skill merges them anyway. The key skill discriminator for capture-knowledge is the granularity judgment rule — "a choice made with rationale → own node; a behavioral detail → fold into parent" — which without_skill does not apply.

---

### sync-knowledge — 2026-03-09 — with_skill: 11/11 (100%)  without_skill: 8/11 (73%)  delta: +27%

| # | eval | assertion | with_skill | without_skill |
|---|------|-----------|-----------|--------------|
| 0 | fast-mode-update | `reads-code-before-comparing` — code file searched/read before comparing with doc | PASS | PASS |
| 1 | fast-mode-update | `doc-edited-in-place` — docs/rate-limiter-service.md edited to fix outdated claim | PASS | PASS |
| 2 | fast-mode-update | `report-format` — Sync Report (fast) format with Updated/No changes needed sections | PASS | FAIL |
| 3 | fast-mode-update | `specific-change-described` — report describes what changed (middleware → service class) | PASS | PASS |
| 4 | skip-when-no-existing | `skip-sync-rule-cited` — rule that all-new triage output means no sync scope is cited | PASS | PASS |
| 5 | skip-when-no-existing | `no-full-mode-fallback` — does not fall back to full audit | PASS | PASS |
| 6 | skip-when-no-existing | `routes-to-capture` — output indicates capture should run next | PASS | PASS |
| 7 | full-mode-audit | `doc-code-discrepancy-fixed` — api-gateway.md port edited in-place (3000 → 8080) | PASS | FAIL |
| 8 | full-mode-audit | `broken-wikilink-reported` — [[session-store]] broken link in auth-service.md reported | PASS | PASS |
| 9 | full-mode-audit | `missing-wikilink-suggested` — cache-service ↔ api-gateway missing link suggested | PASS | PASS |
| 10 | full-mode-audit | `report-format` — Sync Report (full) format with all four sections | PASS | FAIL |

**Notes:** `full-mode-audit` is the most discriminating case (+50% delta): without_skill found all issues correctly but treated the task as an audit report, not a fix task — it recommended editing api-gateway.md instead of editing it in-place. The skill's fix-in-place policy ("edit docs in-place immediately, then report what was fixed") is the key discriminator. `fast-mode-update` without_skill also fails report format — free-form narrative instead of the structured Sync Report schema. `skip-when-no-existing` is non-discriminating (0% delta): skip logic is intuitive and without_skill even ran capture spontaneously. Report format assertions are the most reliable discriminators across both fast and full modes.
