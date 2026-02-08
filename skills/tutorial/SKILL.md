---
name: autology:tutorial
description: Interactive tutorial for learning Autology's core concepts and mechanisms
---

Welcome to the Autology Tutorial! This interactive tutorial is designed to help you learn Autology's core concepts and working mechanisms through hands-on practice.

## Arguments Handling

Parse the user's invocation to determine the starting step:

- `/autology:tutorial` → Start from Step 1
- `/autology:tutorial <1-5>` → Jump to specific step (e.g., `/autology:tutorial 3`)
- `/autology:tutorial reset` → Clean up tutorial nodes

## Tutorial Structure

The tutorial consists of 5 progressive steps:

1. **What is an Ontology? — Checking Current State**
2. **Capturing Knowledge — Creating Nodes**
3. **Connecting Knowledge — Creating Relations**
4. **Searching Knowledge — Queries and Context**
5. **Automation and Knowledge Lifecycle — Hooks and Workflows**

## Process

### If `/autology:tutorial reset`

1. Use `autology_query { "tags": ["tutorial"] }` to find all tutorial nodes
2. For each node, use `autology_delete { "nodeId": "..." }` to remove it
3. Confirm cleanup: "✅ Cleaned up [N] tutorial nodes."

### Step 1: What is an Ontology? — Checking Current State

**Core Concept**: Ontology = Knowledge Graph (Nodes + Relations)

**Process**:

1. **Introduction**:
```
Welcome! 👋

Autology is a system that manages your knowledge as a **structured graph**.
It stores and connects all the decisions you make, components you create, and concepts you learn while coding.

Let's check the current state of your ontology.
```

2. **Check Current Status**:
```
Call autology_status { "detail": "full" }
```

3. **Interpret and Explain Results**:

**If ontology is empty**:
```
📊 **Current Ontology Status**: Empty

Perfect! Starting with a clean slate is great.
Let's build your knowledge graph together! 🚀
```

**If nodes exist**:
```
📊 **Current Ontology Status**

Total Nodes: [N]
Total Relations: [M]

### Distribution by Node Type:
- 🎯 Decisions: [X]
- 🔧 Components: [X]
- 📋 Conventions: [X]
- 💡 Concepts: [X]
- 🎨 Patterns: [X]
- ⚠️  Issues: [X]
- 📅 Sessions: [X]

You already have some knowledge captured! This tutorial will help you use Autology more effectively.
```

4. **Introduce Node Types**:
```
Autology supports 7 node types:

1. **decision**: Architectural choices, technology selections
   Example: "Decided to use PostgreSQL"

2. **component**: Code structures, modules, services
   Example: "AuthService handles user authentication"

3. **convention**: Coding standards, patterns, best practices
   Example: "All errors must include correlation IDs"

4. **concept**: Domain knowledge, business logic
   Example: "Order lifecycle: pending → confirmed → shipped"

5. **pattern**: Reusable design patterns
   Example: "Repository pattern for data access"

6. **issue**: Known problems, technical debt, bugs
   Example: "Performance bottleneck in user search"

7. **session**: Work session summaries
   Example: "Implemented authentication system"
```

5. **Introduce Node States**:
```
Each node can have one of 3 states:

- ✅ **active**: Currently valid knowledge
- 🔍 **needs_review**: Knowledge that requires review
- 🔄 **superseded**: No longer valid (replaced by newer decisions)
```

6. **Next Step**:
```
Step 1 complete! ✅

In the next step, you'll learn how to actually capture knowledge.
Ready to continue? (yes/no)
```

**Wait for user confirmation before proceeding to Step 2.**

---

### Step 2: Capturing Knowledge — Creating Nodes

**Core Concept**: Use `autology_capture` to save knowledge as structured nodes

**Process**:

1. **Introduction**:
```
## Step 2: Capturing Knowledge 🎯

Now let's capture some knowledge!
Using the `autology_capture` tool, you can save your thoughts and decisions as structured nodes.

For this hands-on exercise, please share something you recently decided or learned.
For example:
- "We decided to use TypeScript for this project"
- "Errors should always include user-friendly messages"
- "Created a UserService for managing users"

It can be anything! What would you like to capture?
```

2. **Wait for User Input and Analyze**:

Wait for user input, then:
- Analyze the content to determine the most appropriate node type
- If it's a **decision**, prepare to guide them through ADR format
- If it's another type, prepare to extract metadata

3. **Type Classification and ADR Guidance** (if decision):
```
Great! This classifies as a **decision** node. 🎯

Decision nodes follow the **ADR (Architecture Decision Record)** format.
ADR consists of 4 sections:

1. **Context**: Why did you make this decision?
2. **Decision**: What did you decide?
3. **Alternatives**: What other options did you consider?
4. **Consequences**: What are the implications of this decision?

I'll structure [user input] as an ADR.
If I need more details, I'll ask a few questions.
```

If needed, ask clarifying questions:
- "What was the background or problem that led to this decision?"
- "Did you consider other alternatives? Why did you choose this?"
- "What impact will this decision have on the project?"

4. **Execute Capture**:
```
Call autology_capture with:
{
  "title": "Brief descriptive title",
  "content": "Full markdown content (use ADR format for decisions)",
  "type": "[classified-type]",
  "tags": ["tutorial", ...relevant tags],
  "confidence": 0.85,
  "references": [any file paths mentioned],
  "metadata": {
    "tutorial_step": "2",
    "created_in_tutorial": true
  }
}
```

5. **Explain Results**:
```
✅ **Node created successfully!**

**Node ID**: `[node-id]`
**Type**: [type]
**Title**: [title]
**Tags**: [tags]
**Confidence**: [confidence * 100]%
**Saved to**: `.autology/nodes/[type]s/[node-id].md`

### Key Concepts:

- **Node ID**: Each node has a unique ID. Use this ID to reference and connect nodes.
- **Confidence**: How certain is this knowledge (0.0~1.0).
- **Tags**: Used to categorize and search nodes.
- **Storage Location**: Saved as markdown files viewable in Obsidian.

[If decision] It's saved in ADR format, so you can view the structured document in Obsidian!
```

6. **Capture Second Node**:
```
Great! Let's do one more.

In the next step, we'll learn how to **connect** nodes,
so please share another piece of knowledge related to what you just captured.

For example:
- If you captured "Use PostgreSQL" → "Created UserRepository component"
- If you captured "Error message convention" → "ErrorHandler service"

What would you like to capture?
```

Repeat the capture process for the second node.

7. **Remember Node IDs and Next Step**:
```
Perfect! ✅ You've created two nodes:

1. **[first-node-title]** (`[first-node-id]`)
2. **[second-node-title]** (`[second-node-id]`)

Step 2 complete! In the next step, you'll learn how to **connect** these two nodes.

Ready to continue? (yes/no)
```

**Store the two node IDs in context for Step 3. Wait for user confirmation.**

---

### Step 3: Connecting Knowledge — Creating Relations

**Core Concept**: Use `autology_relate` to connect nodes and build a knowledge graph

**Process**:

1. **Introduction**:
```
## Step 3: Connecting Knowledge 🔗

Knowledge doesn't exist in isolation — it's **connected**.
Autology allows you to explicitly express relationships between nodes.

Let's connect the two nodes we created in the previous step:
1. **[first-node-title]** (`[first-node-id]`)
2. **[second-node-title]** (`[second-node-id]`)
```

2. **Introduce Relation Types**:
```
Autology supports 7 relation types:

1. **affects**: When one node impacts another
   Example: Decision → Component (decision affects component)

2. **uses**: When one node uses another
   Example: Component → Component (component uses another component)

3. **supersedes**: When a new decision replaces an old one
   Example: New Decision → Old Decision

4. **relates_to**: General relationship
   Example: Concept → Concept

5. **implements**: When implementing a pattern or concept
   Example: Component → Pattern

6. **depends_on**: When there's a dependency
   Example: Component → Component

7. **derived_from**: When knowledge is derived from another
   Example: Pattern → Concept
```

3. **Determine Appropriate Relation Type**:
```
How are these two nodes related?

[Analyze the two nodes and suggest the most appropriate relationship type]

For example:
- If the first is a decision and the second is a component → **affects** (decision affects component)
- If both are components → **uses** or **depends_on**
- If unclear → **relates_to**

Based on my analysis, a **[suggested-type]** relationship seems most appropriate.
Should I create this relationship? Or would you prefer a different type?
```

4. **Create Relation**:
```
Call autology_relate {
  "source": "[first-node-id]",
  "target": "[second-node-id]",
  "type": "[chosen-relationship-type]",
  "description": "Brief description of why they're related",
  "metadata": {
    "tutorial_step": "3",
    "created_in_tutorial": true
  }
}
```

5. **Explain Directionality**:
```
✅ **Relation created successfully!**

**Source**: [first-node-title]
**→ [relationship-type] →**
**Target**: [second-node-title]

### Key Concepts:

- **Directionality**: Relations have direction. `source → target`
  - Starts from `[first-node-id]` and points to `[second-node-id]`.

- **bidirectional option**: Some relations can be set as bidirectional.
  - Example: A ← relates_to → B (mutually related)

- **Graph Visualization**: You can visualize this relationship in Obsidian's graph view!
  - Open the `.autology/nodes/` folder in Obsidian.
  - In graph view, you'll see connection lines between nodes.
```

6. **Next Step**:
```
Step 3 complete! ✅

You've now built the basic structure of a knowledge graph.
In the next step, you'll learn how to **search and utilize** this accumulated knowledge.

Ready to continue? (yes/no)
```

**Wait for user confirmation before proceeding to Step 4.**

---

### Step 4: Searching Knowledge — Queries and Context

**Core Concept**: Search with `autology_query`, retrieve context-aware knowledge with `autology_context`

**Process**:

1. **Introduction**:
```
## Step 4: Searching Knowledge 🔍

Now that you've captured and connected knowledge, let's learn how to **find and use** it when needed!

Autology provides two ways to retrieve knowledge:
1. **autology_query**: Explicit search (search for what you want)
2. **autology_context**: Context-based recommendations (suggest knowledge related to current work)
```

2. **Tag Search Practice**:
```
First, let's **search by tag**.
All nodes created in this tutorial have the `tutorial` tag.

Call autology_query { "tags": ["tutorial"] }
```

Display results:
```
🔍 **Tag Search Results**: `tutorial`

Found: [N] nodes

[Display each node with:
- Title
- Type
- ID
- Brief content preview
]

Using tags makes it easy to group and find related knowledge!
```

3. **Type Filter Practice**:
```
Now let's **filter by type**.
For example, let's find all decision nodes.

Call autology_query { "type": "decision" }
```

Display results:
```
🔍 **Type Search Results**: `decision`

[Display decision nodes if any exist]

Useful when you want to see only specific types of knowledge.
Example: "Show me all technical decisions we've made"
```

4. **Text Search Practice**:
```
Now let's try **full-text search**.
Search for a keyword related to the nodes you created in Step 2.

[Suggest a relevant keyword based on the nodes created in Step 2]

Call autology_query { "query": "[keyword]" }
```

Display results:
```
🔍 **Text Search Results**: `[keyword]`

[Display matching nodes]

Text search finds keywords in both titles and content.
Answers questions like "What did we have about authentication?"
```

5. **Context-based Retrieval Practice**:
```
Finally, let's try **context-based retrieval**.

`autology_context` analyzes your current work situation and automatically recommends relevant knowledge.

For example, let's assume you're "implementing user authentication functionality".

Call autology_context {
  "currentTask": "implementing user authentication functionality",
  "recentFiles": []
}
```

Display results:
```
🎯 **Context-based Recommendations**

Current task: "implementing user authentication functionality"

Relevant knowledge:
[Display relevant nodes with confidence scores]

### Difference between Query and Context:

- **autology_query** (Search):
  - Explicit search: When you know exactly what you're looking for
  - Example: "Find JWT-related decisions"

- **autology_context** (Context):
  - Automatic recommendations: AI finds knowledge related to current work
  - Example: "Working on auth" → auto-suggest related decisions, components, conventions

Context is automatically activated when working with Claude Code!
```

6. **Next Step**:
```
Step 4 complete! ✅

You've now learned how to search and utilize knowledge.
In the final step, you'll learn how all of this works **automatically**!

Ready to continue? (yes/no)
```

**Wait for user confirmation before proceeding to Step 5.**

---

### Step 5: Automation and Knowledge Lifecycle — Hooks and Workflows

**Core Concept**: Hooks automatically suggest knowledge capture, knowledge persists across sessions

**Process**:

1. **Introduction**:
```
## Step 5: Automation and Knowledge Lifecycle 🔄

So far, you've learned how to manually capture and search knowledge.
But Autology's true power lies in **automation**!

Autology integrates naturally into your workflow through **Hooks**.
```

2. **Final Ontology Check**:
```
First, let's review the knowledge graph you've built.

Call autology_status { "detail": "full" }
```

Display comprehensive status:
```
📊 **Ontology Status After Tutorial**

Total Nodes: [N]
Total Relations: [M]

[Display full statistics by type, status, tags, etc.]

Excellent! Now let's see how this knowledge is automatically utilized.
```

3. **Explain 4 Hooks**:
```
Autology provides 4 hooks:

### 1. **SessionStart Hook** 🚀
**When**: When a Claude Code session starts
**Role**: Inject existing knowledge as context
**Effect**: Claude remembers and applies decisions and conventions from previous sessions

Example:
- Session starts with memory of "Use PostgreSQL" decision
- Automatically applies related conventions when writing new code

### 2. **PostToolUse(Write/Edit) Hook** ✍️
**When**: After creating or modifying files
**Role**: Suggest capturing important changes
**Effect**: Code changes are automatically saved as knowledge

Example:
- Write new component → "Capture AuthService component?"
- Modify config file → "Record this configuration change?"

### 3. **PostToolUse(Bash - git commit) Hook** 📝
**When**: After executing git commit
**Role**: Suggest capturing commit content as session node
**Effect**: Work history is recorded in the knowledge graph

Example:
- `git commit -m "Add authentication"`
- → "Save this commit as a session node?"

### 4. **SessionEnd Hook** 🏁
**When**: When a Claude Code session terminates
**Role**: Suggest capturing session summary
**Effect**: Everything learned in one session is organized and saved

Example:
- Session ends → "Summarize and save today's work?"
- → Suggests classification as decision, component, issue, etc.
```

4. **Knowledge Lifecycle Review**:
```
### 🔄 Autology Knowledge Lifecycle

1. **Capture**
   - Manual: `/autology:capture` or `autology_capture` tool
   - Automatic: PostToolUse and SessionEnd hooks suggest capture

2. **Connect**
   - Create relations between nodes with `autology_relate`
   - Relation types: affects, uses, supersedes, ...

3. **Retrieve**
   - Explicit: `autology_query` (tag, type, text search)
   - Automatic: `autology_context` (work context-based recommendations)
   - Hooks: SessionStart auto-injects relevant knowledge

4. **Evolve**
   - New decisions supersede old decisions
   - Node state changes: active → needs_review → superseded
   - Continuous improvement and refinement

As this cycle repeats, your **personal knowledge graph** grows!
```

5. **Hook Activation Check**:
```
### Checking Hook Setup

To verify that Autology hooks are activated:

1. Check `~/.claude/hooks/` directory
2. Or check project's `.claude/hooks/` directory

If hooks are configured, from now on:
- ✅ Relevant knowledge is automatically loaded at session start
- ✅ You'll receive capture suggestions when modifying files
- ✅ You'll get session node creation suggestions on git commit
- ✅ You'll be prompted to save summaries when sessions end

Everything works naturally and non-intrusively!
```

6. **Next Steps Guidance**:
```
🎉 **Tutorial Complete!** 🎉

Congratulations! You've learned all of Autology's core concepts:

✅ **Ontology Structure**: Node types, node states
✅ **Knowledge Capture**: `autology_capture`, ADR format
✅ **Knowledge Connection**: `autology_relate`, relation types
✅ **Knowledge Search**: `autology_query`, `autology_context`
✅ **Automation**: 4 hooks, knowledge lifecycle

### What's Next?

1. **Real-world Use**: Use `/autology:capture` and `/autology:explore` in actual projects
2. **Obsidian Integration**: Open `.autology/nodes/` folder in Obsidian to view graph
3. **Hook Setup**: Activate hooks for automatic capture
4. **Exploration**: Capture and connect more knowledge

The nodes you created in this tutorial will remain.
If you want to clean them up, run `/autology:tutorial reset`.

Feel free to ask if you have any questions! 🚀
```

7. **End Tutorial**:

End the tutorial session. Do not automatically proceed to cleanup unless user explicitly requests `/autology:tutorial reset`.

---

## Key Principles

1. **English Responses**: All guidance and explanations in English
2. **Step-by-step Confirmation**: Get user confirmation after each step before proceeding
3. **Real Knowledge Capture**: Use user's actual knowledge, not pre-defined examples
4. **Tutorial Tag on All Nodes**: For later cleanup
5. **Domain Independent**: User freely chooses topics
6. **Friendly and Encouraging Tone**: Keep the learning experience positive

## Error Handling

If any tool call fails:
- Explain the error in user-friendly English
- Provide guidance on how to fix it
- Offer to retry or skip to the next step

If the user wants to skip a step:
- Acknowledge their request
- Briefly explain what they would have learned
- Proceed to the requested step

## Output Format

Use clear markdown formatting with:
- Emojis for visual appeal (but not excessive)
- Code blocks for tool calls and technical content
- Clear section headers
- Bullet points for lists
- Emphasis (**bold**) for key concepts
