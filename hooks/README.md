# Hooks Directory

## Current State

**Hooks have been removed** as of 2026-02-09 in favor of agent-based triggering.

- **What's left**: `hooks.json` (empty, required by Claude Code plugin system)
- **What was removed**: All hook scripts (SessionStart, PostToolUse, SessionEnd)
- **Why removed**: Testing if agent pattern-matching can achieve comparable reliability (≥80%) to hooks (90%+)

## Backup & Restoration

**Full hook system backup**: `docs/legacy/hooks-backup-2026-02-09.md`

If agent-based triggering proves insufficient (<80% reliability), hooks can be restored:

```bash
# See backup file for restoration instructions
cat docs/legacy/hooks-backup-2026-02-09.md
```

## Current Approach

Autology now uses the **autology-explorer agent** for automatic context provision:
- Triggers via pattern matching on user queries
- Enhanced agent description with trigger keywords
- See `docs/GUIDE.md` - "Automation with Agents" section

## Testing

Agent triggering reliability is being validated empirically:
- **Test framework**: `tests/agent-triggering/`
- **25 scenarios** across 5 categories
- **Decision criteria**: ≥80% success rate to continue

For test execution: `tests/agent-triggering/EXECUTION.md`
