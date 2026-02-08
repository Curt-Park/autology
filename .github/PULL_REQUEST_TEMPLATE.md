# Pull Request Description

## Background
<!-- Why is this change needed? What problem does it solve? -->

## Goal
<!-- What does this PR achieve? What is the desired outcome? -->

## Key Changes
<!-- List the main changes in bullet points -->
-
-
-

## Verification
<!-- How can reviewers verify this works? -->

```bash
go build -o .claude-plugin/bin/autology ./cmd/autology  # Build succeeds
go test ./internal/...                                   # All tests pass
```

---

**Guidelines**:
- Keep total description under 30 lines
- Use Background/Goal/Key Changes/Verification structure
- Include actual verification commands (Go, not npm)
- Be concise but complete
