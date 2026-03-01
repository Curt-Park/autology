# `/autology:capture` Examples

Detailed context-based capture scenarios showing how the skill works in practice.

---

## Example 1: Context-Based Decision Capture

**Conversation Context:**
```
User: "Let's add authentication to the API"
Claude: [implements JWT authentication]
User: "Why JWT instead of sessions?"
Claude: "JWT is stateless, works better for microservices..."
[Claude autonomously identifies this as a capture-worthy decision]
```

**Skill Response:**

Check for existing nodes:
```
Grep docs/ for "jwt" or "authentication" (case-insensitive)
```
No existing node found.

Write `docs/jwt-authentication-decision.md`:
```yaml
---
title: "Use JWT for API Authentication"
type: decision
tags: [auth, api, architecture]
status: active
---

# Use JWT for API Authentication

## Context
Building a stateless API for microservices. Need auth that doesn't require shared session state.

## Decision
Use JWT (JSON Web Tokens) for API authentication.

## Alternatives Considered
- Session-based authentication: requires shared state, doesn't scale across services

## Consequences
- Token refresh complexity
- Secret key management required
- Works across distributed services without coordination
```

```
Captured [decision] node: docs/jwt-authentication-decision.md
Title: Use JWT for API Authentication
Tags: auth, api, architecture
```

---

## Example 2: Context-Based Component Capture

**Conversation Context:**
```
User: "Add JWT validation to the API"
Claude: [creates src/services/auth.ts with AuthService class]
User: "Looks good!"
[Claude autonomously captures the new component]
```

**Skill Response:**

Check for existing nodes:
```
Grep docs/ for "AuthService" or "auth service"
```
No existing node found. Check for related decision:
```
Grep docs/ for "jwt"
```
Found: `docs/jwt-authentication-decision.md`

Write `docs/auth-service.md`:
```yaml
---
title: "AuthService"
type: component
tags: [auth, service, jwt]
status: active
---

# AuthService

Implements [[jwt-authentication-decision]].

**Location**: `src/services/auth.ts`

**Purpose**: Handles JWT token validation and user authentication.

**Key methods**: `validateToken()`, `extractUser()`, `refreshToken()`
```

Also Edit `docs/jwt-authentication-decision.md` to add reverse wikilink in body:
```
See also: [[auth-service]]
```

```
Captured [component] node: docs/auth-service.md
Title: AuthService
Tags: auth, service, jwt
Relations: jwt-authentication-decision
```

---

## Example 3: Context-Based Convention Capture

**Conversation Context:**
```
User: "How should we handle API errors?"
Claude: "We should include correlation IDs for tracing..."
User: "Good idea, let's make that a standard"
[Claude autonomously captures the new convention]
```

**Skill Response:**

Check for existing nodes:
```
Grep docs/ for "error" or "correlation" (case-insensitive)
```
Found: `docs/api-error-format.md` — "API Error Format Convention"

Read `docs/api-error-format.md` — existing convention doesn't mention correlation IDs.

Edit `docs/api-error-format.md` to add correlation ID requirement:
```
Add section: "## Correlation IDs
All API errors must include a `correlationId` field for distributed tracing.
Example: { "error": "Invalid token", "correlationId": "abc-123" }"
```

```
Updated [convention] node: docs/api-error-format.md
Title: API Error Format Convention
Change: Added correlation ID requirement
```

---

## Example 4: Context-Based Update

**Conversation Context:**
```
User: "Let's switch from HS256 to RS256 for better security"
Claude: [updates JWT implementation to use RS256]
User: "Perfect, this is more secure"
[Claude autonomously updates the existing decision node]
```

**Skill Response:**

Check for existing nodes:
```
Grep docs/ for "jwt" or "HS256"
```
Found: `docs/jwt-authentication-decision.md`

Read `docs/jwt-authentication-decision.md` — mentions HS256 algorithm.

Edit `docs/jwt-authentication-decision.md`:
- Update algorithm from HS256 → RS256 in the Decision section
- Add note: asymmetric cryptography improves security (private key signs, public key verifies)

```
Updated [decision] node: docs/jwt-authentication-decision.md
Title: Use JWT for API Authentication
Change: Algorithm updated from HS256 to RS256
```

---

## Example 5: Removing Obsolete Knowledge

**Conversation Context:**
```
User: "Remove all the old Redis caching code"
Claude: [deletes Redis implementation, removes dependencies]
User: "Good, we don't need that anymore"
[Claude autonomously updates the knowledge base]
```

**Skill Response:**

Check for existing nodes:
```
Grep docs/ for "redis" (case-insensitive)
```
Found: `docs/redis-session-caching.md`

The code is gone. Edit `docs/redis-session-caching.md` to reflect current state:
- Update `status: active` → `status: archived`
- Add note at top: "## Status\nRemoved — Redis caching was eliminated. See git history for rationale."

Git history preserves what it used to say. The knowledge base now reflects reality.

```
Updated [decision] node: docs/redis-session-caching.md
Change: Marked archived — implementation removed
```

---

## Example 6: Technology Replacement

**Conversation Context:**
```
User: "Let's switch from Redis to Memcached for caching"
Claude: "Why the change?"
User: "Memcached is simpler for our use case, lower overhead"
Claude: [implements Memcached, removes Redis]
[Claude autonomously captures the change]
```

**Skill Response:**

Check for existing nodes:
```
Grep docs/ for "redis" or "caching"
```
Found: `docs/redis-session-caching.md`

Read existing node — describes Redis. Since the decision changed, edit the node in place to reflect the new reality (git tracks what it used to say):

Edit `docs/redis-session-caching.md`:
- Rename file → `docs/memcached-session-caching.md` (Write new + rm old)
- Update `title` → `"Use Memcached for Session Caching"`
- Rewrite content to document the Memcached decision with context about why Redis was replaced

```
Updated [decision] node: docs/memcached-session-caching.md
Title: Use Memcached for Session Caching
Change: Replaced Redis decision — edit in place, git tracks history
```

---

## Common Patterns

### Pattern 1: Decision After Implementation

When code is written first, then the decision is captured:
1. Grep docs/ for related keywords to find existing nodes
2. Extract technical approach from conversation
3. Write new node or Edit existing with full ADR context

### Pattern 2: Update After Refinement

When existing knowledge is enhanced:
1. Grep docs/ to find the existing node
2. Read it to understand current state
3. Edit with the new information

### Pattern 3: Technology Replacement

When decisions change:
1. Find existing node with Grep
2. Edit in place — update to reflect current reality
3. Git history preserves the old decision automatically

### Pattern 4: Component After Creation

When a new component is built:
1. Grep docs/ to check for existing node and related decisions
2. Write new component node with wikilinks to related decisions
3. Edit related nodes to add reverse wikilinks

---

## Tips for Effective Capture

1. **Let conversation flow naturally**: Capture at natural pauses, not mid-implementation
2. **Save autonomously**: Don't ask for confirmation — just capture and report
3. **Link related nodes**: Use `[[node-slug]]` wikilinks in body text
4. **Prefer edit over duplicate**: Grep before creating new nodes
5. **Edit in place**: Git tracks history — no need for separate "superseded" nodes
6. **Use ADR for decisions**: Context/Decision/Alternatives/Consequences structure
