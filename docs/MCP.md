# MCP Server Implementation Details

**Purpose**: Technical documentation of Autology's MCP (Model Context Protocol) server internal mechanisms.

**Audience**: Developers who want to understand or extend the system.

---

## Table of Contents

1. [MCP Protocol](#mcp-protocol)
2. [Tool Implementations](#tool-implementations)
3. [Storage Layer](#storage-layer)
4. [Search Engine](#search-engine)
5. [Classification Layer](#classification-layer)
6. [Enrichment Layer](#enrichment-layer)
7. [Data Flow](#data-flow)

---

## MCP Protocol

### Transport: JSON-RPC 2.0 over stdio

Autology communicates with Claude Code via standard input/output using JSON-RPC 2.0 protocol.

**Request Format**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "autology_capture",
    "arguments": {
      "title": "Example",
      "content": "Content"
    }
  }
}
```

**Response Format**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Node created with ID: abc-123"
      }
    ]
  }
}
```

**Error Format**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": "title and content are required"
  }
}
```

### Supported Methods

1. **initialize** - Handshake, returns server info
2. **tools/list** - Returns available tools
3. **tools/call** - Executes a tool

### Server Lifecycle

```
1. Start on stdio
2. Wait for initialize request
3. Send server info (name, version, capabilities)
4. Handle tools/list and tools/call requests
5. Continue until EOF on stdin
```

---

## Tool Implementations

### autology_capture

**Purpose**: Create a knowledge node with automatic type classification.

**Processing Steps**:

1. **Input Validation**
   ```go
   // Required fields
   if title == "" || content == "" {
       return error
   }
   ```

2. **Type Classification**
   ```go
   // If user provides type hint, use it directly
   if typeHint != "" {
       nodeType = typeHint
   } else {
       // Automatic classification using heuristics
       result := classification.ClassifyNodeType(title, content, "manual")
       nodeType = result.Type
       confidence = result.Confidence
   }
   ```

3. **Relation Inference** (if auto-classification is used)
   ```go
   // Infer relationships with existing nodes
   nodes := nodeStore.ListNodes()
   inferences := enrichment.InferRelations(newNode, nodes)

   // Auto-create high-confidence relations (>= 0.8)
   for _, inf := range inferences {
       if inf.Confidence >= 0.8 && inf.Action == "autoCreate" {
           relations = append(relations, inf.Relation)
       }
   }
   ```

4. **Node Creation**
   ```go
   node := storage.CreateKnowledgeNode(
       title, content, nodeType, tags,
       relations, confidence, source, references, session,
   )
   ```

5. **Storage**
   ```go
   // Save markdown file
   nodeStore.SaveNode(node)

   // Update graph index
   for _, rel := range node.Relations {
       graphIndex.AddRelation(rel)
   }
   ```

**Output**: Node ID, classified type, confidence score

---

### autology_query

**Purpose**: Search knowledge nodes with filtering, ranking, and relevance scoring.

**Processing Steps**:

1. **Parse Filters**
   ```go
   filter := storage.NodeFilter{
       Type:        parseType(args["type"]),
       Tags:        parseTags(args["tags"]),
       SearchQuery: parseQuery(args["query"]),
   }
   limit := parseLimit(args["limit"]) // default: 10
   ```

2. **Execute Search**
   ```go
   results := searchEngine.Search(filter, limit)
   // Returns []storage.SearchResult with Score
   ```

3. **Format Results**
   ```go
   // Sort by score (descending)
   sort.Slice(results, func(i, j int) bool {
       return results[i].Score > results[j].Score
   })

   // Limit results
   if len(results) > limit {
       results = results[:limit]
   }
   ```

**Search Algorithm**: See [Search Engine](#search-engine) section below.

**Output**: Array of nodes with relevance scores

---

### autology_status

**Purpose**: Provide statistics about the knowledge graph.

**Processing Steps**:

1. **Count Nodes by Type**
   ```go
   nodes := nodeStore.ListNodes()

   nodesByType := make(map[string]int)
   for _, node := range nodes {
       nodesByType[string(node.Type)]++
   }
   ```

2. **Count Relations by Type**
   ```go
   relations := graphIndex.GetAllRelations()

   relationsByType := make(map[string]int)
   for _, rel := range relations {
       relationsByType[string(rel.Type)]++
   }
   ```

3. **Aggregate Statistics**
   ```go
   stats := map[string]interface{}{
       "totalNodes":       len(nodes),
       "nodesByType":      nodesByType,
       "totalRelations":   len(relations),
       "relationsByType":  relationsByType,
   }
   ```

**Output**: JSON object with counts and breakdowns

---

### autology_update

**Purpose**: Update an existing node with partial field updates (immutable pattern).

**Processing Steps**:

1. **Find Node**
   ```go
   // Find node by ID across all types
   node, err := nodeStore.FindNode(id)
   if err != nil {
       return fmt.Errorf("node not found: %s", id)
   }
   ```

2. **Build Updates Map**
   ```go
   updates := make(map[string]interface{})
   if title, ok := args["title"].(string); ok {
       updates["title"] = title
   }
   if content, ok := args["content"].(string); ok {
       updates["content"] = content
   }
   // ... similar for tags, status, confidence
   ```

3. **Apply Updates (Immutable)**
   ```go
   // Creates NEW node with updated fields
   updatedNode := storage.UpdateKnowledgeNode(node, updates)
   // updatedNode.Modified = time.Now() (automatic)
   ```

4. **Save Updated Node**
   ```go
   err := nodeStore.UpdateNode(updatedNode)
   ```

**Output**: Success message listing changed fields

---

### autology_delete

**Purpose**: Delete a node and cleanup all its relations.

**Processing Steps**:

1. **Find Node**
   ```go
   node, err := nodeStore.FindNode(id)
   if err != nil {
       return fmt.Errorf("node not found: %s", id)
   }
   ```

2. **Count Relations**
   ```go
   relations := graphIndex.GetNodeRelations(id)
   relCount := len(relations)
   ```

3. **Remove Relations**
   ```go
   // Remove all relations where node is source OR target
   err := graphIndex.RemoveNodeRelations(id)
   ```

4. **Delete Node File**
   ```go
   err := nodeStore.DeleteNode(id, node.Type)
   ```

**Output**: Success message with relation cleanup count

---

### autology_relate

**Purpose**: Create or update a relation between two nodes (upsert operation).

**Processing Steps**:

1. **Validate Nodes Exist**
   ```go
   if _, err := nodeStore.FindNode(source); err != nil {
       return fmt.Errorf("source node not found: %s", source)
   }
   if _, err := nodeStore.FindNode(target); err != nil {
       return fmt.Errorf("target node not found: %s", target)
   }
   ```

2. **Upsert Relation**
   ```go
   // AddRelation is idempotent: creates if new, updates if exists
   err := graphIndex.AddRelation(
       source, target,
       storage.RelationType(relType),
       description,
       confidence, // default: 0.8
   )
   ```

3. **Update Graph Index**
   ```go
   // Automatically saves to graph.json with timestamp
   graphIndex.Save()
   ```

**Output**: Success message showing relation created

---

### autology_unrelate

**Purpose**: Remove a specific relation between two nodes.

**Processing Steps**:

1. **Remove Relation**
   ```go
   err := graphIndex.RemoveRelation(
       source, target,
       storage.RelationType(relType),
   )
   // Does not fail if relation doesn't exist
   ```

2. **Update Graph Index**
   ```go
   graphIndex.Save()
   ```

**Output**: Success message showing relation removed

---

## Storage Layer

### NodeStore

**Implementation**: File-based storage with markdown + YAML frontmatter

**Directory Structure**:
```
.autology/
├── nodes/
│   ├── decisions/
│   │   └── {uuid}.md
│   ├── components/
│   │   └── {uuid}.md
│   ├── conventions/
│   ├── concepts/
│   ├── patterns/
│   ├── issues/
│   └── sessions/
└── graph/
    └── index.json
```

**Operations**:

1. **SaveNode**
   ```go
   // 1. Serialize to markdown with YAML frontmatter
   markdown := serializeNode(node)

   // 2. Determine file path
   dir := path.Join(rootPath, "nodes", node.Type+"s")
   filePath := path.Join(dir, node.ID+".md")

   // 3. Atomic write (write to temp file, then rename)
   tmpPath := filePath + ".tmp"
   ioutil.WriteFile(tmpPath, markdown, 0644)
   os.Rename(tmpPath, filePath)
   ```

2. **GetNode**
   ```go
   // 1. Read markdown file
   content := ioutil.ReadFile(filePath)

   // 2. Parse YAML frontmatter
   node := parseMarkdown(content)

   return node
   ```

3. **ListNodes**
   ```go
   // Scan all type directories
   for _, nodeType := range NODE_TYPES {
       dir := path.Join(rootPath, "nodes", nodeType+"s")
       files := readDir(dir)

       for _, file := range files {
           node := GetNode(file.ID)
           nodes = append(nodes, node)
       }
   }
   ```

**Markdown Format**:
```markdown
---
id: abc-123
type: decision
title: Use JWT for authentication
tags:
  - auth
  - security
confidence: 0.9
created: 2026-02-08T10:00:00Z
modified: 2026-02-08T10:00:00Z
status: active
source: manual
relations:
  - type: affects
    target: auth-component-id
    confidence: 0.85
references:
  - src/auth/jwt.go
---

# Use JWT for authentication

## Context
We need stateless authentication for our microservices...

## Decision
Use JWT (JSON Web Tokens) with RS256 signing...

## Alternatives
1. Session-based authentication
2. OAuth2 with external provider

## Consequences
- Increased complexity in key management
- Better scalability across services
```

---

### GraphIndexStore

**Implementation**: JSON file with all relations

**Format**:
```json
{
  "version": "1.0",
  "lastUpdated": "2026-02-08T12:00:00Z",
  "relations": [
    {
      "source": "decision-123",
      "target": "component-456",
      "type": "affects",
      "confidence": 0.85
    }
  ]
}
```

**Operations**:

1. **AddRelation**
   ```go
   // Check if relation already exists
   existing := findRelation(source, target, relType)

   if existing != nil {
       // Update confidence (take max)
       existing.Confidence = max(existing.Confidence, newConfidence)
   } else {
       // Add new relation
       relations = append(relations, newRelation)
   }

   // Save to disk
   Save()
   ```

2. **GetNodeRelations**
   ```go
   // Filter by source node (outgoing)
   outgoing := []Relation{}
   for _, rel := range relations {
       if rel.Source == nodeID {
           outgoing = append(outgoing, rel)
       }
   }

   // Filter by target node (incoming)
   incoming := []Relation{}
   for _, rel := range relations {
       if rel.Target == nodeID {
           incoming = append(incoming, rel)
       }
   }
   ```

3. **RemoveNodeRelations**
   ```go
   // Remove all relations where node is source or target
   filtered := []Relation{}
   for _, rel := range relations {
       if rel.Source != nodeID && rel.Target != nodeID {
           filtered = append(filtered, rel)
       }
   }
   relations = filtered
   Save()
   ```

---

## Search Engine

### Architecture

```
Query → Filter → Rank → Limit → Results
```

### Search Method

**Input**: NodeFilter + limit

**Steps**:

1. **Get Candidate Nodes**
   ```go
   candidates := nodeStore.ListNodes()
   ```

2. **Apply Filters**
   ```go
   filtered := []KnowledgeNode{}
   for _, node := range candidates {
       if matchesFilter(node, filter) {
           filtered = append(filtered, node)
       }
   }
   ```

3. **matchesFilter Logic**
   ```go
   func matchesFilter(node KnowledgeNode, filter NodeFilter) bool {
       // Type filter
       if filter.Type != nil && node.Type != *filter.Type {
           return false
       }

       // Tags filter (all must match)
       if len(filter.Tags) > 0 {
           for _, tag := range filter.Tags {
               if !contains(node.Tags, tag) {
                   return false
               }
           }
       }

       // Status filter
       if filter.Status != nil && node.Status != *filter.Status {
           return false
       }

       // Confidence filter
       if filter.MinConfidence != nil && node.Confidence < *filter.MinConfidence {
           return false
       }

       // Full-text search (if query provided)
       if filter.SearchQuery != nil {
           if !containsText(node, *filter.SearchQuery) {
               return false
           }
       }

       return true
   }
   ```

4. **Text Search** (when SearchQuery is provided)
   ```go
   func containsText(node KnowledgeNode, query string) bool {
       query = strings.ToLower(query)

       // Search in title
       if strings.Contains(strings.ToLower(node.Title), query) {
           return true
       }

       // Search in content
       if strings.Contains(strings.ToLower(node.Content), query) {
           return true
       }

       // Search in tags
       for _, tag := range node.Tags {
           if strings.Contains(strings.ToLower(tag), query) {
               return true
           }
       }

       return false
   }
   ```

5. **Calculate Relevance Score**
   ```go
   func calculateScore(node KnowledgeNode, filter NodeFilter) float64 {
       score := 0.0

       if filter.SearchQuery != nil {
           query := strings.ToLower(*filter.SearchQuery)

           // Title match: +0.5
           if strings.Contains(strings.ToLower(node.Title), query) {
               score += 0.5
           }

           // Content term frequency
           content := strings.ToLower(node.Content)
           termCount := strings.Count(content, query)

           // TF score (capped at 0.5)
           tfScore := float64(termCount) * 0.1
           if tfScore > 0.5 {
               tfScore = 0.5
           }
           score += tfScore

           // Tag match: +0.3 per tag
           for _, tag := range node.Tags {
               if strings.Contains(strings.ToLower(tag), query) {
                   score += 0.3
               }
           }
       }

       // Confidence boost
       score += node.Confidence * 0.2

       // Recency boost (nodes modified recently)
       daysSince := time.Since(node.Modified).Hours() / 24
       if daysSince < 7 {
           score += 0.1
       }

       return score
   }
   ```

6. **Rank and Limit**
   ```go
   // Create search results with scores
   results := []SearchResult{}
   for _, node := range filtered {
       score := calculateScore(node, filter)
       results = append(results, SearchResult{
           Node:  node,
           Score: score,
       })
   }

   // Sort by score (descending)
   sort.Slice(results, func(i, j int) bool {
       return results[i].Score > results[j].Score
   })

   // Apply limit
   if len(results) > limit {
       results = results[:limit]
   }
   ```

### Full-Text Search Algorithm

**Term Frequency (TF) Scoring**:
```
TF = (number of times term appears in content) * 0.1
TF = min(TF, 0.5)  // Cap at 0.5 to avoid bias toward long documents
```

**Field Weighting**:
- Title match: +0.5
- Tag match: +0.3 per tag
- Content TF: up to +0.5

**Boosting Factors**:
- Node confidence: +0.2 * confidence
- Recent modification (<7 days): +0.1

**Example**:
```
Query: "authentication"
Node: {
  title: "JWT Authentication Implementation",
  content: "authentication system using authentication tokens...",
  tags: ["auth", "security"],
  confidence: 0.9,
  modified: 2 days ago
}

Score calculation:
  Title match: +0.5 (contains "authentication")
  Content TF: +0.2 (appears 2 times, 2 * 0.1 = 0.2)
  Confidence: +0.18 (0.9 * 0.2)
  Recency: +0.1 (< 7 days)
  Total: 0.98
```

---

## Classification Layer

### Heuristic Classifier

**Purpose**: Automatically determine node type based on title and content.

**Algorithm**: Keyword pattern matching with confidence scoring.

**Pattern Database**: 42 keyword patterns across 7 node types

**Examples**:

**Decision Patterns** (10 keywords):
```go
var DECISION_KEYWORDS = []string{
    "decide", "decision", "chose", "alternative", "option",
    "trade-off", "adr", "context", "consequence", "rationale",
}
```

**Component Patterns** (6 keywords):
```go
var COMPONENT_KEYWORDS = []string{
    "component", "module", "service", "class", "package", "library",
}
```

**Convention Patterns** (6 keywords):
```go
var CONVENTION_KEYWORDS = []string{
    "convention", "guideline", "standard", "style", "rule", "practice",
}
```

... (see internal/classification/heuristics.go for full list)

### Classification Process

```go
func ClassifyNodeType(title, content, context string) ClassificationResult {
    // 1. Combine text for analysis
    text := strings.ToLower(title + " " + content)

    // 2. Score each type
    scores := make(map[NodeType]float64)
    for nodeType, patterns := range PATTERNS {
        score := 0.0
        for _, keyword := range patterns {
            if strings.Contains(text, keyword) {
                score += 0.15  // +0.15 per keyword match
            }
        }
        scores[nodeType] = score
    }

    // 3. Context boost (for hooks)
    if context == "hook_commit" {
        scores[NodeTypeSession] += 0.2
    }
    if context == "hook_file_change" {
        scores[NodeTypeComponent] += 0.1
    }

    // 4. Find max score
    maxType := NodeTypeConcept  // default
    maxScore := 0.0
    for nodeType, score := range scores {
        if score > maxScore {
            maxScore = score
            maxType = nodeType
        }
    }

    // 5. Cap confidence at 0.95
    if maxScore > 0.95 {
        maxScore = 0.95
    }

    // 6. Determine if confident
    confident := maxScore >= 0.6

    // 7. Get alternatives (top 3)
    alternatives := getTopN(scores, 3)

    return ClassificationResult{
        Type:        maxType,
        Confidence:  maxScore,
        Confident:   confident,
        Alternatives: alternatives,
    }
}
```

**Confidence Thresholds**:
- **>= 0.6**: Confident classification, use automatically
- **< 0.6**: Low confidence, suggest alternatives to user
- **User hint**: Always 0.95 confidence (user knows best)

**Example**:
```
Input:
  title: "Use PostgreSQL for data persistence"
  content: "Decision: We chose PostgreSQL over MySQL because..."

Pattern matching:
  decision: 3 matches ("decision", "chose", "alternative") → 0.45
  component: 0 matches → 0.0
  convention: 0 matches → 0.0
  ...

Output:
  Type: decision
  Confidence: 0.45 (< 0.6, not confident)
  Alternatives: [
    {type: "decision", score: 0.45},
    {type: "concept", score: 0.0},
    {type: "component", score: 0.0}
  ]
```

---

## Enrichment Layer

### Relation Inference

**Purpose**: Automatically discover relationships between nodes.

**7 Inference Rules**:

1. **Tag Overlap** (Jaccard similarity)
   ```go
   func inferFromTagOverlap(node1, node2 KnowledgeNode) *InferredRelation {
       overlap := jaccard(node1.Tags, node2.Tags)

       if overlap >= 0.3 {
           return &InferredRelation{
               Relation: Relation{
                   Source: node1.ID,
                   Target: node2.ID,
                   Type:   RelationTypeRelatesTo,
               },
               Confidence: overlap,
               Reason:     fmt.Sprintf("Tag overlap: %.0f%%", overlap*100),
               Action:     "suggest",  // User confirms
           }
       }
       return nil
   }

   func jaccard(set1, set2 []string) float64 {
       intersection := 0
       union := len(set1) + len(set2)

       for _, a := range set1 {
           for _, b := range set2 {
               if a == b {
                   intersection++
                   union--  // Don't double-count
                   break
               }
           }
       }

       if union == 0 {
           return 0
       }
       return float64(intersection) / float64(union)
   }
   ```

2. **Title Similarity** (substring match)
   ```go
   func inferFromTitleSimilarity(node1, node2 KnowledgeNode) *InferredRelation {
       title1 := strings.ToLower(node1.Title)
       title2 := strings.ToLower(node2.Title)

       // Extract significant words (>3 chars)
       words1 := extractWords(title1)
       words2 := extractWords(title2)

       // Calculate word overlap
       overlap := jaccard(words1, words2)

       if overlap >= 0.4 {
           return &InferredRelation{
               Relation: Relation{
                   Source: node1.ID,
                   Target: node2.ID,
                   Type:   RelationTypeRelatesTo,
               },
               Confidence: overlap * 0.9,  // Slightly lower than tags
               Reason:     "Similar titles",
               Action:     "suggest",
           }
       }
       return nil
   }
   ```

3. **File Reference Overlap**
   ```go
   func inferFromFileReferences(node1, node2 KnowledgeNode) *InferredRelation {
       // Find common file references
       common := []string{}
       for _, ref1 := range node1.References {
           for _, ref2 := range node2.References {
               if ref1 == ref2 {
                   common = append(common, ref1)
               }
           }
       }

       if len(common) > 0 {
           confidence := 0.7  // High confidence - same files

           return &InferredRelation{
               Relation: Relation{
                   Source: node1.ID,
                   Target: node2.ID,
                   Type:   RelationTypeRelatesTo,
               },
               Confidence: confidence,
               Reason:     fmt.Sprintf("Common files: %v", common),
               Action:     "autoCreate",  // High confidence
           }
       }
       return nil
   }
   ```

4. **Pattern Implementation** (decision → component)
   ```go
   func inferImplementation(decision, component KnowledgeNode) *InferredRelation {
       // Check if component content mentions decision
       decisionKeywords := extractKeywords(decision.Title)
       componentContent := strings.ToLower(component.Content)

       matches := 0
       for _, keyword := range decisionKeywords {
           if strings.Contains(componentContent, keyword) {
               matches++
           }
       }

       if matches >= 2 {
           return &InferredRelation{
               Relation: Relation{
                   Source: component.ID,
                   Target: decision.ID,
                   Type:   RelationTypeImplements,
               },
               Confidence: 0.75,
               Reason:     "Component implements decision",
               Action:     "autoCreate",
           }
       }
       return nil
   }
   ```

5. **Supersession** (newer replaces older)
   ```go
   func inferSupersession(node1, node2 KnowledgeNode) *InferredRelation {
       // Same type, similar title, newer timestamp
       if node1.Type != node2.Type {
           return nil
       }

       titleSimilarity := calculateTitleSimilarity(node1.Title, node2.Title)
       if titleSimilarity < 0.6 {
           return nil
       }

       // Check for supersession keywords
       content := strings.ToLower(node1.Content)
       keywords := []string{"supersedes", "replaces", "obsoletes", "deprecates"}

       for _, kw := range keywords {
           if strings.Contains(content, kw) {
               return &InferredRelation{
                   Relation: Relation{
                       Source: node1.ID,  // newer
                       Target: node2.ID,  // older
                       Type:   RelationTypeSupersedes,
                   },
                   Confidence: 0.85,
                   Reason:     "Supersession detected",
                   Action:     "suggest",  // User should confirm
               }
           }
       }
       return nil
   }
   ```

6. **Session Relations** (session → nodes created in that session)
   ```go
   func inferSessionRelations(session KnowledgeNode, nodes []KnowledgeNode) []InferredRelation {
       inferences := []InferredRelation{}

       for _, node := range nodes {
           if node.Session == session.ID {
               inferences = append(inferences, InferredRelation{
                   Relation: Relation{
                       Source: node.ID,
                       Target: session.ID,
                       Type:   RelationTypeDerivedFrom,
                   },
                   Confidence: 1.0,  // Certain
                   Reason:     "Created in same session",
                   Action:     "autoCreate",
               })
           }
       }

       return inferences
   }
   ```

7. **Dependency Detection** (uses pattern in content)
   ```go
   func inferDependency(node1, node2 KnowledgeNode) *InferredRelation {
       content := strings.ToLower(node1.Content)
       targetTitle := strings.ToLower(node2.Title)

       // Check for "uses X", "depends on X", "requires X"
       patterns := []string{
           "uses " + targetTitle,
           "depends on " + targetTitle,
           "requires " + targetTitle,
       }

       for _, pattern := range patterns {
           if strings.Contains(content, pattern) {
               return &InferredRelation{
                   Relation: Relation{
                       Source: node1.ID,
                       Target: node2.ID,
                       Type:   RelationTypeDependsOn,
                   },
                   Confidence: 0.8,
                   Reason:     "Dependency mentioned in content",
                   Action:     "autoCreate",
               }
           }
       }
       return nil
   }
   ```

**Inference Actions**:
- **autoCreate** (confidence >= 0.8): Create relation automatically
- **suggest** (confidence < 0.8): Suggest to user for approval

---

### Context Builder

**Purpose**: Score nodes for relevance to current working context.

**9 Relevance Factors**:

1. **Current File Exact Match** (+1.0)
   ```go
   if node.References contains currentFile {
       score += 1.0
   }
   ```

2. **Current File Partial Match** (+0.6)
   ```go
   // e.g., node has "src/auth" and currentFile is "src/auth/jwt.go"
   for _, ref := range node.References {
       if strings.HasPrefix(currentFile, ref) {
           score += 0.6
       }
   }
   ```

3. **Recent Files Match** (+0.4)
   ```go
   for _, ref := range node.References {
       if contains(recentFiles, ref) {
           score += 0.4
       }
   }
   ```

4. **Task Keyword Match** (+0.8)
   ```go
   taskKeywords := extractKeywords(currentTask)
   nodeText := node.Title + " " + node.Content

   for _, keyword := range taskKeywords {
       if strings.Contains(strings.ToLower(nodeText), keyword) {
           score += 0.8
           break  // Only once
       }
   }
   ```

5. **Node Type Weighting** (+0.05 to +0.3)
   ```go
   typeWeights := map[NodeType]float64{
       NodeTypeDecision:    0.3,
       NodeTypeComponent:   0.2,
       NodeTypeConvention:  0.25,
       NodeTypeConcept:     0.15,
       NodeTypePattern:     0.2,
       NodeTypeIssue:       0.1,
       NodeTypeSession:     0.05,
   }
   score += typeWeights[node.Type]
   ```

6. **Confidence Boost** (+0.2)
   ```go
   if node.Confidence >= 0.8 {
       score += 0.2
   }
   ```

7. **Recency Boost** (+0.3)
   ```go
   daysSince := time.Since(node.Modified).Hours() / 24
   if daysSince < 7 {
       score += 0.3
   }
   ```

8. **Status Penalty** (×0.3 or ×0.8)
   ```go
   if node.Status == NodeStatusSuperseded {
       score *= 0.3  // Heavy penalty
   } else if node.Status == NodeStatusNeedsReview {
       score *= 0.8  // Light penalty
   }
   ```

9. **Relation Density Boost** (+0.15)
   ```go
   relationCount := len(graphIndex.GetNodeRelations(node.ID))
   if relationCount >= 3 {
       score += 0.15  // Well-connected nodes are more important
   }
   ```

**Grouping by Relevance**:
```go
func GroupByRelevance(results []ScoredNode) RelevanceGroups {
    high := []ScoredNode{}
    medium := []ScoredNode{}
    low := []ScoredNode{}

    for _, result := range results {
        if result.Score >= 2.0 {
            high = append(high, result)
        } else if result.Score >= 1.0 {
            medium = append(medium, result)
        } else {
            low = append(low, result)
        }
    }

    return RelevanceGroups{
        High:   high,
        Medium: medium,
        Low:    low,
    }
}
```

---

## Data Flow

### autology_capture Flow

```
1. User Input
   ↓
2. Input Validation (title, content required)
   ↓
3. Type Classification
   ├─ User provided type? → Use it (0.95 confidence)
   └─ No type? → Heuristic classification (variable confidence)
   ↓
4. Relation Inference (if auto-classified)
   ├─ Load all existing nodes
   ├─ Apply 7 inference rules
   ├─ Filter by confidence >= 0.8
   └─ Create high-confidence relations automatically
   ↓
5. Node Creation
   ├─ Generate UUID v4
   ├─ Set timestamps (created, modified)
   ├─ Set source ("manual" or "hook_*")
   └─ Build KnowledgeNode struct
   ↓
6. Storage
   ├─ Serialize to markdown with YAML frontmatter
   ├─ Atomic write to .autology/nodes/{type}s/{id}.md
   └─ Update graph index with relations
   ↓
7. Return Response
   └─ {id, type, confidence}
```

### autology_query Flow

```
1. User Input (query, type, tags, limit)
   ↓
2. Parse Filters
   ├─ NodeFilter struct
   └─ Default limit = 10
   ↓
3. Load All Nodes
   └─ nodeStore.ListNodes()
   ↓
4. Apply Filters
   ├─ Type filter
   ├─ Tags filter (all must match)
   ├─ Status filter
   ├─ Confidence filter
   └─ Text search (title, content, tags)
   ↓
5. Calculate Relevance Scores
   ├─ Title match: +0.5
   ├─ Content TF: +0.1 per occurrence (cap 0.5)
   ├─ Tag match: +0.3 per tag
   ├─ Confidence boost: +0.2 * confidence
   └─ Recency boost: +0.1 if < 7 days
   ↓
6. Rank Results
   └─ Sort by score (descending)
   ↓
7. Apply Limit
   └─ Return top N results
   ↓
8. Return Response
   └─ [{node, score}, ...]
```

### autology_status Flow

```
1. Load All Nodes
   └─ nodeStore.ListNodes()
   ↓
2. Count Nodes by Type
   └─ Map: {decision: 10, component: 8, ...}
   ↓
3. Load Graph Index
   └─ graphIndex.GetAllRelations()
   ↓
4. Count Relations by Type
   └─ Map: {affects: 15, uses: 20, ...}
   ↓
5. Aggregate Statistics
   └─ {totalNodes, nodesByType, totalRelations, relationsByType}
   ↓
6. Return Response
   └─ JSON statistics object
```

---

## Performance Characteristics

### Time Complexity

- **autology_capture**: O(n) where n = total nodes (for relation inference)
- **autology_query**: O(n * m) where n = total nodes, m = query terms
- **autology_status**: O(n + r) where n = nodes, r = relations

### Space Complexity

- **Node storage**: O(n) - one file per node
- **Graph index**: O(r) - one entry per relation
- **Search cache**: None (stateless)

### Bottlenecks

1. **Large node counts** (>10,000 nodes)
   - Mitigation: Consider adding index files for faster filtering

2. **Complex queries** (full-text search on large content)
   - Mitigation: Consider adding inverted index for terms

3. **Relation inference** (O(n²) worst case)
   - Mitigation: Only infer for new nodes, cache results

### Optimization Opportunities

1. **Index files** for fast type/tag lookups
2. **Inverted index** for full-text search
3. **Lazy loading** of node content
4. **Caching** of frequently accessed nodes
5. **Incremental inference** (only for new/modified nodes)

---

## Error Handling

### Error Types

1. **ValidationError** - Invalid input
   ```go
   return fmt.Errorf("validation error: %s", details)
   ```

2. **NotFoundError** - Node doesn't exist
   ```go
   return fmt.Errorf("node not found: %s", nodeID)
   ```

3. **StorageError** - File system issues
   ```go
   return fmt.Errorf("storage error: %w", err)
   ```

### Error Propagation

```
Tool Handler
  ↓ (returns error)
MCP Server
  ↓ (converts to JSON-RPC error)
Claude Code
  ↓ (displays to user)
```

### Retry Strategy

- **No automatic retries** for tool calls
- **User must retry** if operation fails
- **Atomic writes** prevent partial state

---

## Future Enhancements

### Planned Features

1. **autology_context** - Context-aware recommendations (analyzes conversation history to suggest relevant nodes)

### Potential Improvements

1. **Vector embeddings** for semantic search
2. **Graph algorithms** (PageRank, community detection)
3. **Incremental indexing** for large graphs
4. **Multi-user support** with conflict resolution
5. **Export formats** (GraphML, Cytoscape)

---

## Appendix: Code References

- **MCP Server**: `internal/mcp/server.go`
- **Storage**: `internal/storage/node_store.go`, `graph_index.go`
- **Search**: `internal/storage/search.go`
- **Classification**: `internal/classification/heuristics.go`, `classifier.go`
- **Enrichment**: `internal/enrichment/relation_inferrer.go`, `context_builder.go`
- **Types**: `internal/storage/types.go`
