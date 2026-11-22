# Evals

## How the skill is measured
1. **Style and correctness A/B** (`workflow.js`). Each task in `tasks.json` is built twice by the same model, without (A) and with (B) the skill, from identical scratch repos. A blind judge runs both suites, probes for bugs, and scores 7 dimensions.
2. **Maintainability** (pilot). The A and B codebases are handed to fresh agents that have **no skill**. One adds a follow-up feature; another hunts a planted bug from a user-style symptom report. A judge runs hidden acceptance tests (written from the spec, adapted to each API), counts regressions, and measures diff size. Mutation testing measures how much each test suite actually protects.
   - The headline metric is the **cost of a correct change**: tokens and tool calls a fresh maintainer spends, plus whether the change is correct and has no regressions.

## Running
```sh
evals/setup.sh /path/to/scratch/eval2   # identical a/ and b/ repos for every task
```
Then run `workflow.js` with Claude Code's Workflow tool, with args `{ root, skill: <abs path to SKILL.md>, tasks: <tasks.json contents> }`.

## Files
- `tasks.json`: 30 task prompts (TS, Python, Go, Rust, C, Zig). Two are seeded with existing code (`seeds/`).
- `cases/`: hand-written single cases with Expect/Reject lists.
- `results/`: dated write-ups of each run.
