# autology Skills

Skills provide explicit, user-invocable commands for interacting with the ontology.

## Available Skills

### `/autology:capture` - Guided Knowledge Capture

**Purpose**: Capture knowledge with automatic classification and ADR structure guidance

**Usage**:
```bash
# Simple capture
/autology:capture "We chose JWT for auth because it's stateless"

# Detailed capture
/autology:capture "AuthService handles user authentication with JWT validation"

# With context
/autology:capture "All errors must include correlation IDs" --context "Discussed in team meeting"
```

**Features**:
- ✅ Automatic type classification
- ✅ ADR structure guidance for decisions
- ✅ Related node discovery
- ✅ Intelligent tagging
- ✅ File reference extraction
- ✅ Confidence scoring

**When to use**:
- After making an architectural decision
- When creating a new component
- To document a coding convention
- To capture domain knowledge
- At end of feature work

### `/autology:explore` - Ontology Navigation

**Purpose**: Search, filter, and browse the knowledge base

**Usage**:
```bash
# View ontology status
/autology:explore

# Search by type
/autology:explore decisions
/autology:explore components

# Search by tag
/autology:explore tagged auth

# Full-text search
/autology:explore authentication system

# By status
/autology:explore needs review

# By confidence
/autology:explore high confidence decisions

# Related nodes
/autology:explore related to jwt-auth
```

**Features**:
- ✅ Natural language queries
- ✅ Multiple filter types
- ✅ Formatted results with previews
- ✅ Statistics and insights
- ✅ Suggested next actions

**When to use**:
- To understand existing decisions
- Before implementing similar features
- To find relevant conventions
- To review knowledge quality
- When onboarding new team members

## Skill vs MCP Tool

| Feature | Skills | MCP Tools |
|---------|--------|-----------|
| Invocation | `/autology:capture` | Direct tool call |
| Guidance | Interactive, conversational | Structured parameters |
| Context | Understands user intent | Expects explicit inputs |
| Use case | Manual capture/exploration | Programmatic/automated |

**Rule of thumb**: Use skills for interactive work, tools for automation

## Examples

### Example 1: Capturing a Decision

```bash
User: /autology:capture "We're using PostgreSQL instead of MongoDB"

Claude: I'll help capture this decision. Let me ask a few questions to make it comprehensive:

1. What problem does PostgreSQL solve for us?
2. What made you choose it over MongoDB?
3. What are the main trade-offs?

[User provides answers]

Claude: [Structures as ADR and calls autology_capture]

✅ Captured decision node: postgresql-database-choice-a1b2c3d4

The node follows ADR format and is saved to:
.autology/nodes/decisions/postgresql-database-choice-a1b2c3d4.md
```

### Example 2: Exploring the Ontology

```bash
User: /autology:explore

Claude:
# 📚 autology Ontology

**Total Knowledge Nodes**: 47
**Total Relations**: 83

## By Type
- 🎯 Decisions: 12
- 🔧 Components: 18
- 📋 Conventions: 8
- 💡 Concepts: 5
- 🎨 Patterns: 3
- ⚠️  Issues: 1
- 📅 Sessions: 0

[... more details ...]
```

### Example 3: Finding Related Knowledge

```bash
User: /autology:explore auth

Claude: Found 8 nodes matching "auth":

## 1. JWT Authentication Decision
**Type**: decision | **Confidence**: 95%
**Tags**: auth, security, jwt

We chose JWT-based authentication for its stateless nature and compatibility with our microservices architecture...

🔗 **ID**: `jwt-auth-decision-x1y2z3w4`

[... more results ...]
```

## Skill Development Tips

### For Users

1. **Use skills for exploration** - Don't just capture, also explore what exists
2. **Be conversational** - Skills understand natural language
3. **Let ADR guide you** - For decisions, answer all ADR sections
4. **Review suggestions** - Skills will suggest relations and tags
5. **Combine with Obsidian** - Use skills to create, Obsidian to visualize

### For Skill Authors

Skills are written in markdown with frontmatter. See `capture/SKILL.md` and `explore/SKILL.md` for examples.

**Key sections**:
- Frontmatter: name, description
- Process: Step-by-step guidance
- Examples: Concrete use cases
- Key Principles: Important guidelines

## Related

- **Hooks**: Automatic capture during coding
- **MCP Tools**: Programmatic access
- **Agents**: Deep analysis (e.g., autology-explorer)
