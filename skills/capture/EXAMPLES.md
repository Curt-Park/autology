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
[Hook or advisor triggers /autology:capture]
```

**Skill Response:**
```
I noticed we made a decision about authentication in our conversation:

**Decision**: Use JWT for API authentication
**Context**: Stateless auth needed for microservices architecture
**Alternative considered**: Session-based authentication (rejected: requires shared state)

Let me capture this as a decision node. I'll ask a few questions to make it comprehensive:

1. What are the main consequences of using JWT? (e.g., token refresh complexity, secret management)
2. Are there any other alternatives we considered?

[After user answers, structure as ADR and call autology_capture]
```

---

## Example 2: Context-Based Component Capture

**Conversation Context:**
```
User: "Add JWT validation to the API"
Claude: [creates src/services/auth.ts with AuthService class]
User: "Looks good!"
[Post-commit hook or advisor triggers /autology:capture]
```

**Skill Response:**
```
I noticed we just created a new component:

**Component**: AuthService (src/services/auth.ts)
**Purpose**: Handles JWT token validation and user authentication
**Key methods**: validateToken(), extractUser(), refreshToken()

[Search for related nodes]
Found related nodes:
- JWT authentication decision

[Query ontology for existing AuthService]
No existing AuthService node found.

Proposed operation: **Create** new component node

[Call autology_capture with:]
- type: "component"
- title: "AuthService"
- content: Expanded description with key methods
- tags: ["auth", "service", "jwt"]
- references: ["src/services/auth.ts"]
- relatedTo: [jwt-decision-id]

✅ Captured component node: com-auth-service-2024
```

---

## Example 3: Context-Based Convention Capture

**Conversation Context:**
```
User: "How should we handle API errors?"
Claude: "We should include correlation IDs for tracing..."
User: "Good idea, let's make that a standard"
[Advisor triggers /autology:capture]
```

**Skill Response:**
```
I noticed we established a new convention:

**Convention**: All API errors must include a correlation ID for tracing
**Rationale**: Enables distributed request tracing across microservices
**Example**: { "error": "Invalid token", "correlationId": "abc-123" }

[Query ontology for existing error handling conventions]
Found: "API Error Format Convention" (conv-api-errors-2024)

Proposed operation: **Update** (add correlation ID requirement)

Would you like to:
1. Update existing convention (recommended)
2. Create new convention specifically for correlation IDs

[User selects option 1]

[Call autology_update with:]
- id: "conv-api-errors-2024"
- content: [original content + correlation ID section]

✅ Updated convention node: conv-api-errors-2024
```

---

## Example 4: Context-Based Update

**Conversation Context:**
```
User: "Let's switch from HS256 to RS256 for better security"
Claude: [updates JWT implementation to use RS256]
User: "Perfect, this is more secure"
[Advisor triggers /autology:capture]
```

**Skill Response:**
```
I noticed we modified our JWT authentication approach:

**Change**: Switched from HS256 to RS256 algorithm
**Reason**: Improved security with asymmetric cryptography

[Query ontology for JWT decision]
Found: "JWT Authentication" (dec-auth-2024)

Proposed operation: **Update** (algorithm changed from HS256 to RS256)

[Call autology_update with:]
- id: "dec-auth-2024"
- content: "[original content with updated algorithm section and consequences]"
- confidence: 0.95 (increased confidence after implementation)

✅ Updated decision: dec-auth-2024
Fields changed: content, confidence
```

---

## Example 5: Context-Based Delete

**Conversation Context:**
```
User: "Remove all the old Redis caching code"
Claude: [deletes Redis implementation, removes dependencies]
User: "Good, we don't need that anymore"
[Advisor triggers /autology:capture]
```

**Skill Response:**
```
I noticed we removed Redis caching functionality:

**Removed**: Redis session caching implementation

[Query ontology for Redis decision]
Found: "Redis for Session Caching" (dec-cache-2023)

Proposed operation: **Delete** or **Supersede**

⚠️  Impact check:
- 3 components reference this decision
- 1 convention depends on it
- Total: 4 relations will be removed

Recommendation: Consider marking as superseded instead to preserve history.

Would you like to:
1. Mark as superseded (recommended - preserves history)
2. Delete completely

[User selects option 2]

✅ Deleted: dec-cache-2023
Relations removed: 4
```

---

## Example 6: Context-Based Supersede

**Conversation Context:**
```
User: "Let's switch from Redis to Memcached for caching"
Claude: "Why the change?"
User: "Memcached is simpler for our use case, lower overhead"
Claude: [implements Memcached, removes Redis]
[Advisor triggers /autology:capture]
```

**Skill Response:**
```
I noticed we replaced our caching solution:

**Old**: Redis for session caching
**New**: Memcached for session caching
**Reason**: Simpler, lower overhead for our needs

[Query ontology for caching decisions]
Found: "Redis for Session Caching" (dec-cache-2023)

Proposed operation: **Supersede** (replacing old decision with new one)

I'll create a new decision and link them:

1. Create new decision [autology_capture]:
   - title: "Memcached for Session Caching"
   - type: "decision"
   - content: [ADR format with supersession context]

2. Link decisions [autology_relate]:
   - source: new-decision-id
   - target: dec-cache-2023
   - type: "supersedes"

3. Mark old as superseded [autology_update]:
   - id: dec-cache-2023
   - status: "superseded"

✅ Decision superseded:
Old: dec-cache-2023 (Redis)
New: dec-cache-2024 (Memcached)
Reason: Simpler solution, lower operational overhead
```

---

## Common Patterns

### Pattern 1: Decision After Implementation

When code is written first, then the decision is captured:
1. Gather context from file changes
2. Extract technical approach
3. Ask for alternatives considered
4. Structure as ADR with full context

### Pattern 2: Update After Refinement

When existing knowledge is enhanced:
1. Query for existing node
2. Compare with new information
3. Propose update with diff preview
4. Merge and update confidence

### Pattern 3: Supersession with Migration Path

When decisions change:
1. Create new decision with full ADR
2. Link with supersedes relation
3. Mark old as superseded
4. Update dependent components

### Pattern 4: Component After Commit

When hook triggers after git commit:
1. Focus on committed files
2. Extract component purpose
3. Find related decisions
4. Create with references and relations

---

## Tips for Effective Capture

1. **Let conversation flow naturally**: Don't interrupt to capture, wait for natural pause
2. **Confirm before executing**: Always show what will be captured
3. **Link related nodes**: Search and connect to existing knowledge
4. **Use ADR for decisions**: Structure ensures completeness
5. **Prefer update over duplicate**: Query before creating new nodes
6. **Preserve history**: Use supersede instead of delete for decisions
