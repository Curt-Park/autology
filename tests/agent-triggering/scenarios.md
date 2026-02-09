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
