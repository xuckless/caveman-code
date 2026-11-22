# 2026-11-22: table-comment rerun (go-traffic-light)

**Question:** after adding "put a one-line *why* comment on behavior tables saying how to extend them", do fresh maintainers extend the table instead of bypassing it?

**Method:** two new builds with the updated skill (c1, c2). Each got the same 4 sequential tickets from fresh Sonnet maintainers without the skill, and a blind Opus judge compared each against the original no-skill run (a) on the same tickets and hidden scenarios.

## Results

| | a (no skill, switch-based) | c1 (skill) | c2 (skill) |
|---|---|---|---|
| Hidden scenarios, stages 0→4 | 22/22 … 52/52 | 20/22 … 46/52 | 17/22 … 45/52 |
| Design health 0→4 | 4 → 3 | 4 → 2 | 3 → 2 |
| Source lines 0→4 | 297 → 594 | 178 → 370 | 161 → 422 |
| Did maintainers extend the table? | (no table) | **bypassed** | **bypassed** |
| Judge verdict | | a wins (small) | a wins (large) |

**It did not go well.** Both comments were written ("add behavior as a phase row, not as a branch"), and in both runs maintainers ignored them.

## Why
1. **The table was too narrow to extend.** Both builds used a *cycle* table (`phase → {lights, duration, next}`) with a single `next` per phase. Queued emergencies, deferred night mode, pedestrian clearance and failsafe guards need *event-* and *condition-dependent* transitions, and the table had no slot for them. So maintainers added flags, intercepts and `next` overrides. A comment can't fix a table that can't hold the behavior.
2. **The spec-floor rule slipped again.** Both builds started with spec defects that every maintainer inherited: clearing an emergency goes straight to yellow instead of a fresh green, and walk requests weren't tracked. Compact first versions still drop requirements on this task.

## Takeaways for the skill
- A behavior table must have the shape of the behavior: `state × event → next` (plus per-state entry actions and per-state data). A linear `next` chain is only right for a pure cycle. If the spec mentions interrupts, queues or modes, the table needs event columns from the start.
- The "make the table the obvious place to extend" comment stays (harmless), but it is not the fix.
- go-traffic-light is the skill's weakest task (it also lost round 1). The other 4 sequential tasks and 9 of 10 pilot tasks favored the skill, so this result is one task, not the aggregate.
