# Simplest Implementation

Priority 3. Once behavior is data and state is explicit, write the least code that solves today's problem.

## Rules
- **Build only what was asked for.** No speculative options, caching, retries, logging, or extension points.
- **Search before writing.** Grep for an existing helper, type, constant, or table. Reuse beats rewriting.
- **Extract on the second copy.** Duplicated logic is a defect, so move it to a shared place right away.
- **Inline single-use helpers.** A function with one caller is indirection, not reuse. Exceptions: a pure decision function you test directly, and a callback the framework requires.
- **No single-implementation abstractions.** No interface with one implementer, no generic used with one type, no factory that makes one thing.
- **Prefer the standard library** over a new dependency.
- **Shape:** flat over nested, early return over `else`, explicit over clever.
- **Comments say why.** Delete comments that restate the code.

## The duplication / helper balance
| Situation | Do |
|---|---|
| Logic exists already somewhere | Reuse it (move it to a shared spot if it's private) |
| You're about to write logic a second time | Extract once, call it from both |
| You're writing a helper with one caller | Inline it |
| Two blocks look alike but mean different things | Leave them separate (coincidental similarity isn't duplication) |

## Signals you over-built
- Files named `utils`, `helpers`, `manager`, `factory`, or `base` holding one thing
- Generic type parameters instantiated once
- A config flag whose value never changes
- A function whose body is a single call to another function
- A wrapper layer (`api` → `service` → `client`) that only passes calls through
