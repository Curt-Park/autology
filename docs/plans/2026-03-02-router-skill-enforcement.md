# Router Skill Enforcement Improvement Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve `skills/router/SKILL.md` enforcement section to match the superpowers pattern — tighter EXTREMELY-IMPORTANT block, expanded Red Flags table, cleaner structure.

**Architecture:** Single-file edit to `skills/router/SKILL.md`. No new files. Reference: `using-superpowers` SKILL injected at session start.

**Tech Stack:** Markdown

---

## What's Wrong (Gap Analysis)

| Area | Current | Target (superpowers pattern) |
|------|---------|------------------------------|
| Tag name | `<EXTREMELY_IMPORTANT>` (underscore) | `<EXTREMELY-IMPORTANT>` (hyphen) — matches superpowers |
| Block content | ~12 lines; rationalizations buried inside | 3 punchy statements only; rationalizations belong in Red Flags |
| Red Flags table | 6 rows, some overlap | 9–10 rows; covers all major rationalizations from block too |
| Rigid marker | Absent | Add after Overview: "**This skill is rigid. Follow exactly.** Do not adapt." |

---

## Task 1: Fix EXTREMELY-IMPORTANT tag name and tighten block

**File:** `skills/router/SKILL.md` (lines 6–16)

**Step 1: Replace block with this exact content**

```markdown
<EXTREMELY-IMPORTANT>
After every significant action, you ABSOLUTELY MUST run the autology workflow.

YOU DO NOT HAVE A CHOICE. YOU MUST INVOKE EXPLORE → SYNC/CAPTURE.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>
```

The rationalizations list is removed from here — they move to Red Flags in Task 2.

**Step 2: Verify**

```
grep -A8 'EXTREMELY' skills/router/SKILL.md
```
Expected: 6 lines of content, no bullet list, hyphen in tag name.

---

## Task 2: Add "Rigid" marker to Overview

**File:** `skills/router/SKILL.md`

**Step 1: Add rigid marker after Overview heading**

After the line `Route to the right autology skill after significant actions.` add:

```markdown
**This skill is rigid. Follow exactly. Do not adapt.**
```

---

## Task 3: Expand Red Flags table

**File:** `skills/router/SKILL.md`

**Step 1: Replace the existing 6-row Red Flags table with this 9-row version**

```markdown
| Thought | Reality |
|---------|---------|
| "This commit was too small" | No commit is too small to trigger the workflow. |
| "I just committed, no need to check docs" | Commit = trigger point. explore → sync or capture. |
| "This convention isn't worth capturing" | If it's a decision or convention, capture it. |
| "The docs are probably fine" | sync verifies. Don't assume. |
| "No docs/ in this repo" | Knowledge goes to the autology project docs/. |
| "I'll capture this later" | Later never comes. Do it now. |
| "There's nothing worth capturing" | You haven't run explore yet. How would you know? |
| "The user didn't ask me to" | The user configured this router. They already asked. |
| "I'm in the middle of something" | Run the workflow after each action. Not after everything. |
```

**Step 2: Verify**

```
grep -c '|' skills/router/SKILL.md
```
Expected: 11 pipe-separated lines (header + separator + 9 rows).

---

## Task 4: Commit

**Step 1: Stage and commit**

```bash
git add skills/router/SKILL.md
git commit -m "refactor: apply superpowers pattern to router enforcement

- EXTREMELY_IMPORTANT → EXTREMELY-IMPORTANT (standardize tag name)
- Tighten enforcement block to 3 punchy statements
- Add rigid marker to Overview
- Expand Red Flags from 6 → 9 rows; absorb rationalizations from block"
```

**Step 2: Push**

```bash
git push
```

---

## Verification

```bash
# Tag uses hyphen, not underscore
grep 'EXTREMELY-IMPORTANT' skills/router/SKILL.md

# Block is tight (no bullet lists inside it)
grep -A10 '<EXTREMELY-IMPORTANT>' skills/router/SKILL.md

# Rigid marker present
grep 'rigid' skills/router/SKILL.md

# Red Flags has 9 data rows
grep '| "' skills/router/SKILL.md | wc -l
# Expected: 9
```
