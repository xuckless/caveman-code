# 2026-11-22: upload-queue, baseline A/B

Both runs used Sonnet, with the same prompt and scratch repo. B was told to follow `skills/caveman-code/SKILL.md`. Neither knew it was being evaluated. Judged by Claude (Opus).

| | A (no skill) | B (skill) |
|---|---|---|
| Tests pass | 14/14 | 12/12 |
| `src` lines | 280 | **150** |
| Test lines | 247 | **178** |
| Booleans in state | `pausedByQueue`, plus queue `#paused` | **none** (queue has `status`) |
| Where transitions live | `status = …` in **12 places** across 9 methods | **one `TRANSITIONS` table** + one `#send()` |
| Invalid events | Ad-hoc guards in each method (`if status !== 'paused' return`) | Absent from the table, so ignored by construction |
| Resource cleanup | Each exit path calls `#stop()` by hand | "Leaving any state ends its run," in one spot |
| Unrequested extras | `maxConcurrent`/`retryDelays` options, listener try/catch, `retries` exposed in snapshot | Duplicate-id check (A has it too) |
| Public API | 9 methods | 9 methods; 4 are one-line `#send` aliases |

## Verdict: B is clearly better on the principles. Both are functionally correct.
- **Declarative and explicit state: big win.** The upload lifecycle in B fits in a 7-row table. A's lifecycle can only be reconstructed by reading every method.
- **The table makes B robust.** `#pump()` re-enters through `#send` and can try to `start` an upload that is already uploading. That transition isn't in the table, so it is a harmless no-op. A gets the same safety from a hand-written `current()` staleness guard.
- **Simplicity: win.** Lines of code roughly halved, and A's unrequested options are gone.

## Where B still fell short (tune the skill)
1. **Testing rules weren't followed.** There is no transition-table test (`(state, event) → next` rows), even though SKILL.md asks for exactly that, and the tests aren't table-driven. → Make the testing section more prominent and add a "you are done when" checklist item that names the transition table test.
2. **The spec was bent to avoid a flag.** Queue pause sends running uploads to `queued`, not `paused`, so the UI says "queued" while the queue says "paused". A cleaner model is a second state (`held`) in the table, not a boolean. → Add guidance: *when two causes lead to "the same" state, they are two states.*
3. **Status changes are still mixed with side effects inside `#send`** (`if next === 'uploading' …`). An `onEnter` table per state would be more declarative. That's borderline, and probably fine at this size.

## Harness note
The scratch repo's `node --test test/` fails on Node 22 (MODULE_NOT_FOUND); both agents changed it to `node --test`. Fixed in the case file.
