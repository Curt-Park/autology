# Contributing to Autology

## Skill Evals

Each skill has a `skills/{skill-name}/evals/evals.json` file containing behavioral test cases. These test whether the skill guides Claude through the correct process steps — not just whether the output looks right, but whether triage produces structured topology hints, capture folds thin items correctly, sync cites routing rules, and so on.

### File Structure

```
skills/
└── {skill-name}/
    └── evals/
        └── evals.json
```

### evals.json Schema

```json
{
  "skill_name": "capture-knowledge",
  "evals": [
    {
      "id": 1,
      "name": "granularity-fold",
      "prompt": "The task prompt as a user would write it",
      "expected_output": "Description of what a correct run should produce",
      "files": [],
      "assertions": [
        {
          "id": "one-doc-created",
          "description": "Exactly 1 doc created (not 2)"
        }
      ]
    }
  ]
}
```

- **`prompt`** — the task given to Claude, verbatim
- **`expected_output`** — prose description of a correct result, used to guide grading
- **`files`** — input files to provide (paths relative to the eval workspace); empty for most autology evals
- **`assertions`** — objectively verifiable checks; each has an `id` and a `description` that reads clearly as pass/fail evidence

### Running Evals

Evals are run using the [skill-creator](https://github.com/anthropics/claude-plugins) plugin, which manages the full loop: spawn runs, grade, aggregate, and display results.

```bash
# Install skill-creator if you don't have it
/plugin marketplace add anthropics/claude-plugins skill-creator

# Run the eval loop for a skill
/skill-creator:skill-creator improve the skills in this project
```

The skill-creator workflow:
1. Spawns two subagents per eval — one **with the skill** loaded, one **without** (baseline)
2. Each subagent runs the eval prompt and saves outputs to a workspace directory
3. A grader subagent reads transcripts and outputs, grades each assertion, writes `grading.json`
4. Results are aggregated into `benchmark.json` and a static HTML review page

Workspace directories (`{skill-name}-workspace/`) are gitignored. The evals.json files are committed.

### Writing Good Assertions

Assertions should be **discriminating** — they should pass when the skill genuinely helps and fail when it doesn't. Weak assertions check presence ("a file was created") but not correctness ("the file has `type: decision` in frontmatter and the pool detail appears in the body, not as a separate node").

Things worth asserting for autology skills:
- **Output format** — does triage use the blockquote format with labeled sections?
- **Routing rules** — does sync cite the skip rule when triage returns no existing nodes?
- **Granularity decisions** — does capture fold thin items into parent nodes with documented reasoning?
- **Bidirectional links** — does capture add the reverse wikilink to the related node?
- **Process order** — does explore search docs before answering (not from memory)?

### Adding a New Eval

1. Add a new entry to `skills/{skill-name}/evals/evals.json` with a unique `id`, a descriptive `name`, a realistic `prompt`, and 3–5 assertions
2. Run the skill-creator eval loop to see how the skill performs
3. If the skill fails, improve `SKILL.md` and re-run into a new iteration directory

---

## Trigger Evals (Description Optimization)

Skills that are invoked via their SKILL.md description (rather than hook injection) also have a `trigger_evals.json` file. These test whether Claude selects the right skill for a given prompt.

This applies to: `explore-knowledge`, `capture-knowledge`, `triage-knowledge`, `sync-knowledge`.
It does **not** apply to `autology-workflow`, which is injected at session start via a hook.

### File Structure

```
skills/
└── {skill-name}/
    └── evals/
        ├── evals.json          # Behavioral test cases
        └── trigger_evals.json  # Trigger accuracy test cases
```

### trigger_evals.json Schema

```json
[
  { "query": "User prompt that should trigger this skill", "should_trigger": true },
  { "query": "User prompt that should NOT trigger this skill", "should_trigger": false }
]
```

Each entry is a realistic user prompt. Aim for 6–10 should-trigger and 6–10 should-not-trigger cases, with emphasis on **near-misses** — queries that share keywords with the skill but belong to a different skill.

### Running Description Optimization

The skill-creator `run_loop.py` script tests the current skill description against the eval set and iteratively proposes improvements:

```bash
SKILL_CREATOR=~/.claude/plugins/cache/claude-plugins-official/skill-creator/205b6e0b3036/skills/skill-creator

python -m scripts.run_loop \
  --eval-set skills/{skill-name}/evals/trigger_evals.json \
  --skill-path skills/{skill-name} \
  --model claude-sonnet-4-6 \
  --max-iterations 5 \
  --verbose
```

Run from the `$SKILL_CREATOR` directory. The script splits the eval set into 60% train / 40% held-out test, evaluates the current description, then calls Claude with extended thinking to propose improvements. It outputs `best_description` — selected by test score to avoid overfitting.

After the loop finishes, copy `best_description` into the skill's SKILL.md frontmatter `description` field.
