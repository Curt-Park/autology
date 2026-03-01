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
echo '{}' | AUTOLOGY_ROOT=docs bash scripts/session-start.sh | jq .  # Hook output valid
echo '{}' | bash scripts/session-end.sh 2>&1                          # Tip shown
```

---

**Guidelines**:
- Keep total description under 30 lines
- Use Background/Goal/Key Changes/Verification structure
- Include actual verification commands
- Be concise but complete
