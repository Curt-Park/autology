# Agent Triggering Test Scenarios

## Category 1: Architecture & Design Questions

### Scenario 1.1: Direct Decision Query
**Query**: "Why did we choose this database structure?"
**Should Trigger**: YES
**Expected Tool**: `autology_query` with type="decision"
**Rationale**: Contains "why" + "choose" (decision keywords)

### Scenario 1.2: Convention Request
**Query**: "What's our convention for error handling?"
**Should Trigger**: YES
**Expected Tool**: `autology_query` with type="convention"
**Rationale**: Contains "convention" (exact match)

### Scenario 1.3: Pattern Discovery
**Query**: "Show me past decisions about API design"
**Should Trigger**: YES
**Expected Tool**: `autology_query` with type="decision", tags filtering "api"
**Rationale**: Contains "past decisions" + topic area

### Scenario 1.4: Implicit Architecture Question
**Query**: "How should I structure the authentication module?"
**Should Trigger**: YES
**Expected Tool**: `autology_query` for related decisions/patterns
**Rationale**: Requires knowledge of existing architecture

### Scenario 1.5: Negative Case - Simple Typo Fix
**Query**: "Fix this typo in the README"
**Should Trigger**: NO
**Expected Tool**: None (direct edit)
**Rationale**: No architectural/design context needed

## Category 2: Implementation Guidance

### Scenario 2.1: Feature Implementation Start
**Query**: "I'm adding user authentication, what components will this affect?"
**Should Trigger**: YES
**Expected Tool**: `autology_query` + `autology_relate` for impact analysis
**Rationale**: Contains "affect" (impact analysis keyword)

### Scenario 2.2: Dependency Check
**Query**: "Before I refactor this, what depends on it?"
**Should Trigger**: YES
**Expected Tool**: `autology_relate` for dependency graph
**Rationale**: Contains "depends on" (relation keyword)

### Scenario 2.3: Pattern Following
**Query**: "What patterns should I follow for this new API endpoint?"
**Should Trigger**: YES
**Expected Tool**: `autology_query` with type="pattern"
**Rationale**: Contains "patterns" + "follow" (convention query)

### Scenario 2.4: Component Relationship
**Query**: "How does the auth service connect to the database layer?"
**Should Trigger**: YES
**Expected Tool**: `autology_query` for components + `autology_relate`
**Rationale**: Requires understanding of component relations

### Scenario 2.5: Negative Case - Direct Code Request
**Query**: "Write a function to validate email addresses"
**Should Trigger**: NO
**Expected Tool**: None (direct implementation)
**Rationale**: No ontology context needed, pure implementation
