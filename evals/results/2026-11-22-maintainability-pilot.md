# 2026-11-22: maintainability pilot (10 tasks)

**Question:** is skill-written code easier for *someone else* to change and debug?

**Method** (`evals/maintainability.js`), run on the round-1 A (no skill) and B (skill) codebases from the 30-task eval:
1. A planner reads the spec and both codebases and writes: a follow-up feature ticket, one subtle bug described by behavior (planted at the equivalent spot in both), a user-style symptom report, 15–25 hidden acceptance scenarios, and 8 behavior-level mutations.
2. On each side, a setup agent copies the codebase, runs mutation testing, and plants the bug.
3. On each side, **fresh Sonnet agents without the skill** implement the feature and hunt the bug from the symptom report alone.
4. A blind Opus judge writes hidden tests per API, runs them on the original, after-feature, and after-fix copies, and measures the diffs.
5. Maintainer cost (output tokens, tool calls) is read from the agent transcripts.

Tasks: ts-form-wizard, ts-circuit-breaker, ts-media-player, ts-discount-engine, py-order-lifecycle, py-elevator, py-csv-parser, go-job-scheduler, go-traffic-light, rs-undo-redo.

## Results

| | A (no skill) | B (skill) |
|---|---|---|
| Judged more maintainable | 1 | **9** |
| Feature change: source lines changed | 541 | **376 (−30%)** |
| Feature change: design fit (1–5) | 3.9 | **4.7** |
| Feature change: maintainer output tokens | 140.9k | 129.9k (−8%) |
| Feature change: tool calls | 63 | 59 |
| Regressions after feature | 0 | 0 |
| Hidden tests after feature | 325/327 | 326/327 |
| Hidden tests on original | 237/239 | 238/239 |
| Bug hunt: fixed correctly | **10/10** | 9/10 |
| Bug hunt: output tokens / tool calls | 30.2k / 59 | 30.4k / 57 |
| Planted bug caught by own tests | 10/10 | 9/10 |
| Mutation kill rate | 78/80 | 77/80 |

## What it tells us
- **Feature changes clearly favor skill code.** Diffs are 30% smaller and fit the existing design better (4.7 vs 3.9). The judges' explanation is consistent: in table-driven code a new feature is a new row or entry (a coupon, a step, a state), while in branchy code it means editing many methods (media player: 41 vs 72 lines, 1 choke point vs ~7 methods).
- **Maintainer cost was only slightly lower** (−8% tokens, the same tool calls). For codebases of 50–450 lines a fresh agent reads everything either way. The cost gap should grow with codebase size, which this pilot doesn't test.
- **The one loss is instructive** (ts-discount-engine). In the compact, data-driven version the bug fixer pooled the units again but freed the wrong ones, and its own new tests didn't catch it. In the explicit version the correct fix was obvious. Compact code with weak tests leaves less to anchor a fix to. One sample, but it agrees with the round-1 finding that tests are the skill's weak spot.

## Weaknesses of this pilot (fix before scaling)
- **The bug hunt was too easy.** In 19/20 cases the existing tests already caught the planted bug, so "hunting" meant running the tests. Next time, plant bugs that the existing suite does *not* catch (for example a mutation that survived).
- **Ceiling effects.** Hidden tests (~99%) and mutation kills (~97%) were near 100% on both sides. Make the mutations subtler (boundary values, a dropped edge-case row) and the scenarios harder.
- **Codebases are small.** Maintainability effects compound with size. Add a "grow the codebase" step (3–4 sequential feature tickets on the same repo) and measure cost per ticket over time. That's where boolean soup and scattered transitions should hurt most.
- One sample per side and one judge per task.
