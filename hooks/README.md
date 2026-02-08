# autology Hooks

Hooks enable automatic knowledge capture during coding sessions, creating the **Write** loop of the bidirectional knowledge cycle.

## Hook Types

### 1. PostToolUse (Write/Edit) - `post-write-edit.sh`

**Trigger**: After any Write or Edit tool call
**Purpose**: Detect significant file changes and check for staleness

**Behavior**:

**(a) New Knowledge Capture**
- Detects when structurally significant files are modified (`.ts`, `.js`, `.py`, `.go`, etc.)
- Suggests capturing knowledge about the change
- Recommends appropriate node type (component, decision, convention, pattern)

**(b) Staleness Check**
- Searches existing nodes for file references
- Alerts when modified files are referenced by existing nodes
- Suggests reviewing and updating outdated nodes

**Debouncing**: 60-second window per file to avoid spam

**Excluded Patterns**:
- `node_modules/`
- `.git/`
- `/tmp/`
- `dist/`, `build/`, `coverage/`
- `.autology/`
- `.DS_Store`
- `package-lock.json`
- `*.log`

### 2. PostToolUse (Bash) - `post-commit.sh`

**Trigger**: After any Bash tool call
**Purpose**: Detect git commits and suggest capturing decisions

**Behavior**:
- Filters for `git commit` commands
- Extracts commit message
- Classifies commit type using conventional commits:
  - `feat:` → suggests `decision` node
  - `fix:` → suggests `issue` node
  - `refactor:` → suggests `pattern` node
- Lists changed files
- Suggests using `autology_capture` with appropriate metadata

**Significance Threshold**:
- Conventional commit prefixes (feat, fix, refactor)
- OR commit message > 50 characters

### 3. SessionStart - `session-start.sh`

**Trigger**: When a new Claude Code session starts
**Purpose**: Inject relevant knowledge from previous sessions (**Read** loop)

**Behavior**:
- Checks if `.autology/` directory exists
- Counts total nodes
- Lists recent conventions (last 30 days)
- Lists recent decisions (last 30 days)
- Reminds user of available tools
- Suggests using `autology_query` or `autology_context`

**This is the Read Loop**: Previous sessions' knowledge becomes available to new sessions automatically.

### 4. Stop - Prompt Hook

**Trigger**: When session ends
**Purpose**: Capture session summary

**Behavior**:
- LLM prompt asks Claude to evaluate the session
- If meaningful work was done, suggests creating a `session` type node
- Automatically skips if no significant work or summary already saved

## Hook Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Coding Session                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ File Edit    │    │ Git Commit   │    │ Session End  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ post-write-  │    │ post-commit  │    │ Stop Hook    │
│ edit.sh      │    │ .sh          │    │ (prompt)     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Additional       │
                    │ Context          │
                    │ (Suggestions)    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Claude Evaluates │
                    │ and Optionally   │
                    │ Calls MCP Tools  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Knowledge Saved  │
                    │ to .autology/    │
                    └──────────────────┘
                              │
        ┌─────────────────────┘
        │
        ▼
┌──────────────────┐
│ New Session      │
│ (SessionStart    │
│ hook injects     │
│ knowledge)       │
└──────────────────┘
```

## Testing

Run the test script to verify hooks are working:

```bash
./hooks/test-hooks.sh
```

## Configuration

Hooks are registered in `hooks/hooks.json` and loaded automatically when the plugin is active.

## Best Practices

1. **Don't fight the hooks** - Let them suggest, but you decide what to capture
2. **Trust the debouncing** - Rapid edits won't spam you
3. **Review staleness warnings** - Updated files might invalidate existing knowledge
4. **Use session summaries** - They're valuable for understanding project evolution
5. **Customize exclude patterns** - Edit `post-write-edit.sh` to fit your project

## Troubleshooting

**Hooks not firing?**
- Check that scripts are executable (`chmod +x hooks/scripts/*.sh`)
- Verify `hooks/hooks.json` is present
- Check Claude Code plugin is loaded

**Too many suggestions?**
- Adjust debounce window in `post-write-edit.sh` (default: 60s)
- Add more exclude patterns

**Missing context?**
- Ensure `.autology/` directory exists
- Run `autology_status` to verify nodes are present
- Check file references in existing nodes include correct paths
