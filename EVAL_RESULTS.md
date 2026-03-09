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

## Behavioral Evals

_To be added._
