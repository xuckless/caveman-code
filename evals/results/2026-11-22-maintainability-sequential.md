# 2026-11-22: maintainability, harder round (5 tasks, 4 sequential tickets)

**Method** (`evals/maintainability-v2.js`): starting from the round-1 A (no skill) and B (skill) codebases, fresh Sonnet agents **without the skill** applied 4 tickets that build on each other, one after another on the same repo, simulating a few months of feature work. Then a planner designed bug candidates that the *grown* test suites don't cover. A setup agent planted the first one the tests missed (the suites caught none of them: 0/10). A fresh agent hunted it from a user symptom report. 10 subtle mutations probed the grown test suites. A blind Opus judge ran cumulative hidden scenarios at every stage (base spec + tickets ≤ k) and rated design health per stage.

Tasks: ts-media-player, ts-discount-engine, py-order-lifecycle, go-traffic-light, rs-undo-redo.

## Results

| | A (no skill) | B (skill) |
|---|---|---|
| Judged more maintainable | 1 | **4** (all by a small margin) |
| Design health per stage (0→4) | 3.8 → 3.6 → 3.2 → 3.2 → **3.0** | 4.2 → 3.8 → 3.6 → 3.6 → **3.6** |
| Source lines per stage | 1269 → 1557 → 2028 → 2256 → 2501 | 747 → 985 → 1359 → 1559 → 1778 |
| Lines changed by tickets (total) | 1524 | 1394 (−9%) |
| Maintainer output tokens (4 tickets × 5 tasks) | 414k | **375k (−10%)** |
| Maintainer tool calls | 134 | 131 |
| Hidden scenarios at the final stage | 268/269 | 266/269 |
| Regressions across all stages | 0 | 0 |
| Uncaught planted bug fixed correctly | 5/5 | 5/5 |
| Bug-hunt tokens / tool calls | 21.9k / 34 | 26.1k / 37 |
| Mutation kill rate (grown suites) | 37/50 (74%) | 35/48 (73%) |

## What it tells us
- **The design holds up better over time.** Skill code starts healthier (4.2 vs 3.8) and decays less (−0.6 vs −0.8). After 4 tickets the gap is wider than at the start. The judges kept naming the same mechanism: in A, special cases pile up across methods (`_expire_review()` copied into all 11 event methods; parallel `Option` fields reset at ~10 sites, which is exactly where the planted bug hid). In B, a cross-cutting rule is one hook in `send()`, and closing a group is one assignment.
- **The size advantage persists.** B stays ~30% smaller at every stage. Maintainers spent ~10% fewer tokens over 4 tickets.
- **Correctness is a wash.** Both sides kept ~99% of hidden scenarios, had zero regressions, and fixed every planted bug. Because the maintainers never saw the skill, this is a property of the codebase.
- **The one loss is the important finding** (go-traffic-light). B started as an elegant transition table, but the fresh maintainer for ticket 1 bolted queueing and deferral logic on as branches inside `send()`. Ticket 2 then added a big switch that *intercepts events before the table*. The table stopped describing real behavior, design health fell 4 → 2, and a latent bug grew in the tangle. **Declarative designs decay when the next maintainer doesn't recognize the convention.** → SKILL.md now says to put a one-line *why* comment on behavior tables explaining how to extend them, and to never intercept events before the table.
- Practical consequence: **install the skill at project scope** (`--project`), so every agent working in the repo extends tables instead of bypassing them.

## Weaknesses
- The bug hunt is still not discriminating: both sides fixed 5/5. A fresh maintainer can read 150–750 lines quickly either way.
- Mutation testing: both discount-engine suites killed only 0–1 of 10 mutations (the mutations targeted fuzz-level allocation details), which pulls both averages down equally. One media-player setup agent left its mutation copy identical to the final stage, and the judge rebuilt the mutants from diffs.
- 5 tasks, one sample per side, one judge each. Every margin was rated "small". Directionally consistent with the 10-task pilot (9/10), but not conclusive alone.
