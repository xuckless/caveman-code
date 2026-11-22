# Anti-Patterns LLMs Commonly Produce

Ordered by how much damage they do. Add real examples from real model output here.

| Trap | What it looks like | Caveman fix |
|---|---|---|
| Boolean soup | `isOpen`, `isClosing`, `isAnimating` | One `phase` sum type |
| Branch ladder | `if (type==='a') … else if (type==='b') …` ×8 | Lookup table |
| Rules buried in code | Validation as 40 lines of `if` | Rules table + 3-line engine |
| Speculative abstraction | `BaseRepository<T>` with one subclass | Inline it |
| Duplication | Same 6 lines in two handlers | Extract once, call from both |
| Single-use helper | `formatUserNameForHeader()` called once | Inline it |
| Rewritten helper | New `slugify()` when `utils/slug.ts` exists | Search, then reuse |
| Throwaway test | `test_quick_check.py` written once and forgotten | Add a row to the real table, or don't test |
| Copy-paste tests | 5 test functions differing by one value | One table, 5 rows |
| Scattered transitions | `setStatus('x')` in 6 files | One `transition()` / reducer |
| Stored derived state | `isDone` next to `status` | Compute it |
| Option creep | `function f(x, opts = {})` with unused opts | Delete the opts |
| Unrequested features | Caching, retries, logging nobody asked for | Delete them |
| Pass-through layers | `api` → `service` → `client`, each one line | Collapse them |
| Narrating comments | `// loop over users` | Delete it, or explain *why* |

## Over-correction (what models do *with* this skill)
| Trap | What it looks like | Fix |
|---|---|---|
| Spec-bending | Dropping "report all errors" to keep an early return | The spec is the floor; change the design |
| Swallowing guard | A generic "not allowed" rejection that keeps the user's coin or input | The rejection returns what it owes |
| Empty-cell bug | An event left out of a state's row that should be handled there | Decide every cell; test the rejections that matter |
| Premature final state | `cancelled` while the job is still running | Add the in-between state (`cancelling`) |
| Notify-first | Listeners run before buffers are flushed and timers set | Side effects first, notify last, then re-check |
| Bug-locking test | A test asserting `PaymentDue(0)` or empty flags | Fix the code, not the expectation |
| Thin tests | Half the test code, missing edge cases | Short test code, many rows |
| Too-narrow table | A cycle table with one `next` per state, while the spec has interrupts and modes | Index by `state × event` from the start |
