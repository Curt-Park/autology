# Analysis Report Examples

This file contains detailed examples of analysis outputs following the What/Why/Impact/Action framework.

## Health Analysis Example

```markdown
# Ontology Health Report
**Generated**: 2026-02-10
**Total Nodes**: 47
**Total Relations**: 23

## Overall Score: 68/100

### Coverage: 75/100

**Finding**: 47 nodes across 6 types, but no session nodes and only 2 patterns
**Why**: Focus on implementation (decisions + components) without capturing work summaries or reusable patterns
**Impact**:
- Missing historical context of what was accomplished
- Pattern knowledge stays tacit, not explicitly documented
**Action**:
1. Start capturing session summaries after major work (use /autology:capture)
2. Extract 3-5 patterns from existing components (e.g., repository pattern usage)
3. Add session nodes retroactively from git history for major features
**Evidence**:
- 18 decisions, 15 components, 8 conventions, 2 concepts, 2 patterns, 0 issues, 0 sessions

---

### Consistency: 72/100

**Finding**: Tag naming inconsistent - both "auth"/"authentication", "api"/"rest-api" used
**Why**: No tagging guidelines, tags added organically without review
**Impact**:
- Related nodes split across different tags (7 with "auth", 4 with "authentication")
- Search requires multiple queries to find all related knowledge
**Action**:
1. Standardize: "auth" → "authentication", "api" → use specific "rest-api"/"graphql-api"
2. Update 11 affected nodes
3. Document tagging convention in README
**Evidence**: dec-001, dec-003, comp-002, comp-005, dec-007, dec-010, comp-008

---

### Freshness: 58/100

**Finding**: 12 nodes (25%) unchanged for >90 days, 3 with status "needs_review"
**Why**: Initial knowledge capture phase, nodes not revisited after implementation
**Impact**:
- Stale information may no longer reflect current implementation
- "needs_review" status ignored, never resolved
**Action**:
1. HIGH: Review 3 "needs_review" nodes, update or mark superseded
2. MEDIUM: Check 90-day-old nodes against current code, update or archive
3. Set quarterly review reminder for active nodes
**Evidence**:
- needs_review: dec-004, conv-002, comp-006
- stale (>90 days): dec-001, dec-002, dec-003, comp-001, comp-002, conv-001, conv-003, conc-001, pat-001

---

### Connectivity: 65/100

**Finding**: 23 relations for 47 nodes (0.49 relations/node), 14 orphaned nodes (30%)
**Why**: Nodes captured individually without explicit linking step
**Impact**:
- Knowledge fragmented, connections not explicit
- Can't trace decision impact or component dependencies
**Action**:
1. Connect decisions to affected components (8 unlinked decisions)
2. Link components that use each other (6 unlinked components)
3. Add supersedes relations for newer decisions (2 old decisions not marked)
**Evidence**:
- Orphaned: dec-005, dec-009, comp-007, comp-009, comp-011, conv-004, conv-005, conc-002, pat-002, dec-012, dec-013, dec-014, comp-012, comp-013

---

## Priority Actions

1. **[HIGH]** Review and resolve 3 "needs_review" nodes (freshness issue blocking knowledge trust)
2. **[HIGH]** Standardize tags "auth"→"authentication" (11 nodes, improves discoverability)
3. **[MEDIUM]** Connect 8 decisions to affected components (improves traceability)
4. **[MEDIUM]** Capture 5 session summaries from recent work (fills coverage gap)
5. **[LOW]** Extract 3-5 patterns from implementations (builds reusable knowledge)
```

---

## Gap Detection Example

```markdown
# Knowledge Gap Analysis
**Generated**: 2026-02-10

## Structural Gaps

### Orphaned Nodes

**Finding**: 14 nodes (30%) have no relations to other nodes
**Why**: Capture workflow focuses on creating nodes, not linking them
**Impact**:
- Decisions exist but unclear what they affect
- Components documented but dependencies not explicit
- Knowledge graph is sparse, reduces navigation value
**Action**:
1. For each decision: ask "What components does this affect?" → create "affects" relations
2. For each component: ask "What does it depend on?" → create "depends_on" relations
3. Update capture workflow to prompt for relations
**Evidence**: dec-005, dec-009, dec-012, dec-013, dec-014, comp-007, comp-009, comp-011, comp-012, comp-013, conv-004, conv-005, conc-002, pat-002

---

### Missing Decision Contexts

**Finding**: 6/18 decisions (33%) missing "Alternatives" section in ADR
**Why**: Captured during implementation when decision already made, alternatives not documented
**Impact**:
- Future developers can't understand why other options were rejected
- Harder to re-evaluate decisions when requirements change
**Action**:
1. Review git history/PRs for these 6 decisions to find discussed alternatives
2. Add alternatives section based on historical context
3. If no alternatives found, document "No alternatives considered at the time"
**Evidence**: dec-002, dec-004, dec-007, dec-011, dec-013, dec-015

---

### Components Without Decisions

**Finding**: 5 components have no incoming "affects" relations from decisions
**Why**: Components created without documenting the architectural choices behind them
**Impact**:
- Unclear why these components exist or were designed this way
- Harder to refactor without understanding original intent
**Action**:
1. For each component, identify the architectural decision that led to its creation
2. Create decision nodes retroactively based on code comments/PR descriptions
3. Link decision → affects → component
**Evidence**: comp-003, comp-008, comp-010, comp-012, comp-014

---

## Content Gaps

### Thin Nodes (< 100 words)

**Finding**: 8 nodes with less than 100 words of content
**Why**: Quick captures during busy implementation, never expanded
**Impact**: Insufficient context for someone unfamiliar with the code
**Action**:
1. Expand 3 high-priority thin nodes (decisions affecting multiple components)
2. Delete or merge 5 low-value thin nodes (redundant or obsolete)
**Evidence**:
- Expand: dec-009, comp-007, conv-003
- Consider deleting: conv-006, conc-001, pat-002, comp-015, dec-016

---

### Missing Consequences

**Finding**: 9/18 decisions (50%) have incomplete "Consequences" section
**Why**: Consequences not yet visible at capture time, not updated after implementation
**Impact**:
- Can't assess decision success or learn from outcomes
- Missing insights for future similar decisions
**Action**:
1. Review implemented code for these 9 decisions
2. Add consequences section: positive outcomes + challenges encountered
3. Update confidence scores based on implementation experience
**Evidence**: dec-001, dec-003, dec-005, dec-006, dec-008, dec-010, dec-012, dec-014, dec-017

---

## Suggested Nodes

Based on analysis of existing nodes, consider creating:

1. **decision**: "Use repository pattern for data access"
   - Rationale: Multiple components (comp-002, comp-005, comp-008) follow this pattern but decision not documented
   - Would clarify: Why this pattern, what alternatives were considered, consistency expectations

2. **session**: "Authentication system implementation (2026-01-15 to 2026-01-20)"
   - Rationale: 8 nodes (dec-001, dec-003, comp-002, comp-004, conv-001, conv-002) all related to auth
   - Would provide: Timeline, what was accomplished, lessons learned

3. **pattern**: "Error handling with correlation IDs"
   - Rationale: Convention conv-004 describes rule, but not the full pattern
   - Would include: Problem, solution structure, code examples, when to use

4. **issue**: "N+1 query problem in user search"
   - Rationale: Mentioned in comp-006 comments but not formally captured
   - Would track: Symptom, root cause, impact, proposed solution

5. **convention**: "Component naming: <Domain><Function>Service"
   - Rationale: Observed pattern (AuthService, UserService, CacheService) but not documented
   - Would specify: Format, rationale, examples, exceptions
```

---

## Relation Graph Analysis Example

```markdown
# Relation Graph Analysis
**Generated**: 2026-02-10

## Graph Statistics

- Total nodes: 47
- Total relations: 23
- Average degree: 0.98 (very sparse)
- Density: 1.06% (highly disconnected)
- Connected components: 19 (fragmented)

---

## Hub Nodes

### 1. dec-001: "Use JWT for authentication"

**Degree**: 0 in / 5 out
**Relations**:
- affects → comp-002 (AuthService)
- affects → comp-004 (TokenValidator)
- affects → conv-001 (Include user ID in tokens)
- affects → conv-002 (30-minute token expiry)
- relates_to → dec-003 (Use bcrypt for passwords)

**Why hub**: Foundation decision affecting multiple implementation components and conventions
**Impact**: Critical node - changes would cascade to 5 downstream nodes
**Action**: Ensure this decision is well-documented, up-to-date, and confidence score reflects current validity

---

### 2. comp-002: "AuthService"

**Degree**: 3 in / 2 out
**Relations**:
- ← affected by dec-001 (JWT decision)
- ← affected by dec-003 (bcrypt decision)
- ← implements pat-001 (Repository pattern)
- uses → comp-005 (UserRepository)
- depends_on → comp-010 (ConfigService)

**Why hub**: Central component with both decision inputs and component dependencies
**Impact**: High coupling - changes require reviewing 5 related nodes
**Action**: Document interfaces clearly, consider breaking into smaller focused services

---

## Isolated Clusters

### Cluster 1: API Documentation (3 nodes)

**Finding**: 3 nodes form isolated cluster with no connections to main graph
**Why**: API documentation effort separate from implementation knowledge
**Impact**: API knowledge disconnected from implementation decisions that shaped it
**Action**:
1. Link dec-011 (REST API design) → affects → comp-013 (APIController)
2. Link comp-013 → uses → comp-002 (AuthService)
3. Integrate API knowledge into main decision/component graph
**Evidence**: dec-011, comp-013, conv-007

---

### Cluster 2: Testing Strategy (2 nodes)

**Finding**: Testing convention and pattern isolated from components
**Why**: Created as general guidelines, not linked to specific implementations
**Impact**: Can't see which components follow testing conventions
**Action**:
1. Link conv-008 (Testing standards) → relates_to → well-tested components
2. Link pat-002 (Integration test pattern) → implemented by test files
**Evidence**: conv-008, pat-002

---

## Missing Critical Links

Based on content analysis, these relations should exist:

1. **dec-005** (Use Redis for caching) —affects→ **comp-007** (CacheService)
   - Rationale: CacheService implements Redis decision, but not explicitly linked

2. **comp-002** (AuthService) —uses→ **comp-007** (CacheService)
   - Rationale: Code shows AuthService caches tokens, dependency not documented

3. **dec-012** (Implement rate limiting) —affects→ **comp-015** (RateLimitMiddleware)
   - Rationale: Middleware implements decision, should be explicitly connected

4. **conv-003** (Error messages include correlation IDs) —relates_to→ **comp-009** (ErrorHandler)
   - Rationale: ErrorHandler enforces convention, link makes it discoverable

5. **dec-006** (PostgreSQL as primary DB) —supersedes→ **dec-002** (SQLite for MVP)
   - Rationale: PostgreSQL replaced SQLite, supersession not marked

---

## Supersession Chains

### Chain 1: Database Evolution

**Finding**: dec-002 → dec-006 → dec-018 (SQLite → PostgreSQL → Add read replicas)
**Why**: Database strategy evolved as project scaled
**Impact**: Shows healthy decision refinement, properly tracked
**Action**: None - good example of decision evolution
**Status**: ✓ Properly documented with supersedes relations

---

### Chain 2: Authentication (Broken)

**Finding**: dec-001 (JWT) still active, but dec-009 (OAuth2) seems to replace it
**Why**: New decision created but old one not marked superseded
**Impact**: Confusion about current authentication approach
**Action**:
1. Clarify if OAuth2 fully replaces JWT or complements it
2. If replaces: add dec-009 —supersedes→ dec-001, mark dec-001 as superseded
3. If complements: add dec-009 —relates_to→ dec-001, explain relationship
**Evidence**: dec-001, dec-009
```

---

## Impact Analysis Example

```markdown
# Impact Analysis: dec-001 "Use JWT for authentication"
**Generated**: 2026-02-10

## Node Details

- **Type**: decision
- **Status**: active
- **Created**: 2026-01-10
- **Confidence**: 90%
- **Tags**: authentication, jwt, security

## Direct Impacts

### Affects (5 nodes)

1. **comp-002**: AuthService
   - **Relation**: Core service implementing JWT generation and validation
   - **Risk**: Breaking change - would require full service rewrite

2. **comp-004**: TokenValidator
   - **Relation**: Utility specifically for JWT validation
   - **Risk**: Breaking change - component purpose would change entirely

3. **conv-001**: Include user ID in JWT payload
   - **Relation**: Convention derived from JWT decision
   - **Risk**: Medium - convention would need updating for new auth approach

4. **conv-002**: 30-minute token expiry
   - **Relation**: JWT-specific security convention
   - **Risk**: Low - expiry concept applies to other auth mechanisms

5. **dec-003**: Use bcrypt for password hashing
   - **Relation**: Related authentication decision
   - **Risk**: Low - password hashing orthogonal to token type

---

### Used by (0 nodes)

No nodes explicitly declare dependency on this decision (one-way impact).

---

## Transitive Impacts

### Level 2: Components depending on affected components

1. **comp-005** (UserRepository) ← used by **comp-002** (AuthService)
   - Indirect impact through AuthService interface changes

2. **comp-010** (ConfigService) ← used by **comp-002** (AuthService)
   - JWT config would change to OAuth/session config

3. **comp-013** (APIController) ← uses **comp-002** (AuthService)
   - All API endpoints using AuthService affected

---

### Level 3: Cascading to API layer

1. **All authenticated endpoints** ← depend on **comp-013** (APIController)
   - Every authenticated API call affected
   - Would require frontend changes (token handling → session handling)

---

### Total Impact Scope

**Finding**: Changes cascade to **12 total nodes** (5 direct + 7 transitive)
**Why**: JWT is foundational authentication decision affecting entire auth stack
**Impact**:
- **HIGH RISK** - touching 25% of codebase (12/47 nodes)
- Requires coordinated migration across multiple layers
- Frontend/mobile clients need simultaneous updates
**Action**:
1. DO NOT change without careful planning
2. If change needed:
   - Create new decision (e.g., dec-020: "Migrate to OAuth2")
   - Plan phased migration: support both JWT + new approach
   - Update all 12 affected nodes incrementally
   - Mark dec-001 as superseded only after full migration
3. Consider if change is truly necessary or if incremental improvement possible

---

## Breaking Change Risk Assessment

**Risk Level**: **CRITICAL**

**Rationale**:
- Foundation decision with 5 direct + 7 transitive dependencies
- Affects user-facing authentication flow (frontend impact)
- No gradual migration path identified
- Would break all existing sessions/tokens immediately

**Mitigation Strategy**:
1. **Phase 1**: Implement dual support (JWT + new auth)
2. **Phase 2**: Update services to handle both (2-3 weeks)
3. **Phase 3**: Frontend migration with feature flag (1 week)
4. **Phase 4**: Monitor, then deprecate JWT support (2 weeks grace)
5. **Phase 5**: Remove JWT code, mark dec-001 superseded

**Estimated Total Effort**: 8-10 weeks with 2 engineers

**Recommendation**: Only proceed if strong business justification (e.g., regulatory compliance, severe security issue). Otherwise, refine JWT approach incrementally.
```

---

## Key Patterns in Examples

All examples follow:
1. **Quantified findings** - specific numbers, percentages, counts
2. **Root cause analysis** - explain WHY, not just WHAT
3. **Real impact** - connect to project outcomes (discoverability, maintenance, risk)
4. **Concrete actions** - prioritized, specific steps with evidence
5. **Evidence** - node IDs for verification

This structure ensures analysis is actionable, not just informational.
