---
name: caveman-code
description: Coding principles for every code task (writing, editing, refactoring, testing). Meet every stated requirement, then describe behavior as data (tables, maps, config) instead of branching; model state as one explicit value with named transitions instead of scattered booleans; then pick the simplest implementation that keeps both. Reuse existing helpers, never duplicate code, never write single-use helpers or throwaway tests. Use whenever writing or changing code, and especially before adding a flag, helper, layer, abstraction, or test.
---

# Caveman Code

*Code small. Code obvious. Rules are rocks, engine is stick.*

Three principles, in priority order. When they conflict, the earlier one wins.

1. **Declarative.** Describe behavior as data; keep the engine that reads it small.
2. **Explicit state.** Every lifecycle is one value with named transitions.
3. **Simplest implementation** that keeps 1 and 2 intact.

Plus three hard rules: **no duplication, no single-use helpers, no throwaway tests.**

**The spec is the floor.** Simplicity cuts *how* you build, never *what* was asked for. Every stated requirement and its edge cases must work and be tested. If the clean design can't meet a requirement, change the design (add a state, a row, or a field), never the requirement. Don't build what wasn't asked for, and don't drop what was.

If the user explicitly asks for something these rules discourage (an abstraction, a flag, a layer), build it. An explicit request wins.

---

## 1. Declarative: say what, not how

- **Lookup beats branching.** An `if/else if` or `switch` chain on one key becomes a map or table.
- **Rules are data.** Validation, routing, permissions, pricing, feature lists, error messages, retry policies, and transition tables all go into data structures read by one small function.
- **Decide in pure functions, act at the edges.** Pure code computes *what* should happen and returns a value; a thin shell performs I/O.
- **Name things after the domain**, not after the mechanism (`SHIPPING_RATES`, not `dataMap`).
- **Stop before building an interpreter.** If the data needs its own mini-language (nested conditions, expressions as strings), the logic belongs back in code.

→ [references/declarative.md](references/declarative.md)

## 2. Explicit state: state is a value, not a vibe

Use the lowest rung of this ladder that works:

1. **The structure is the machine.** Straight-line `async`/`await`, a loop, or a generator, where the current line *is* the state. No flags needed.
2. **One status value.** A sum type, discriminated union, or enum, plus `switch`/`match`.
3. **A transition table.** `state × event → next` as data (this is principle 1 applied to state), read by one `transition()` function.
4. **A library.** Only for hierarchy, parallel regions, or visualization. Rare.

Rules:
- **Never use two booleans for one thing's mode.** `isLoading` + `isError` + `hasData` → `status`.
- **Attach data to the state that owns it** (`{ status: 'error', error }`), so it can't exist in the wrong state.
- **Use strict types where the language has them**, so invalid states don't compile. Matches must be exhaustive.
- **Every empty cell is a decision.** For each state, ask what each event *should* do there. "Missing from the table, so ignored" is right only when ignoring is correct. A track can end while buffering, and an emergency can clear during a lead-in phase. When a rejection still owes something (return the inserted coin, record the error), the rejection must do it.
- **Put all transitions in one place.** Never scatter `setX(true)` across files.
- **Two causes, two states.** If something can reach a "similar" state for different reasons that behave differently later (paused by the user vs. held by a queue-wide pause), those are two states in the union or table, not one state plus a flag. Don't bend the spec to avoid the extra state.
- **Slow exits get their own state.** If leaving a state takes time (cancelling a running job, closing a socket), add the in-between state (`cancelling`). Don't report the final state before it's true.
- **Notify last.** Inside a transition, finish all side effects (flush buffers, start or stop timers) and *then* call listeners. Listeners can call back into you, so re-check the state after any callback before doing more work.
- **Re-entering the current state is usually a no-op.** Choosing the mode you're already in must not reset timers or trigger lockouts.
- **Give the table the shape of the behavior.** A single `next` per state fits only a pure cycle. If the spec has interrupts, queues, modes, overrides or anything that reacts to events, index the table by `state × event → next` from the start, with per-state entry actions and per-state data. If a requirement can't be written as a row, the table is the wrong shape: fix the shape, don't add a flag beside it.
- **Make the table the obvious place to extend.** Put a one-line *why* comment on any table that drives behavior, saying how to extend it ("every transition is a row here; add new behavior as a state or row, not as a branch in `send()`"). The next maintainer may not know the convention. When *you* extend such code, add the row: never intercept events before the table.

→ [references/state-machines.md](references/state-machines.md)

## 3. Simplest implementation

Within the shape set by 1 and 2, write the least code that solves today's problem.

- No features, options, caching, retries, or logging that nobody asked for.
- No interfaces, factories, generics, or wrapper layers with a single use.
- No dependency for what the standard library or a few lines can do.
- Flat beats nested. Early return beats `else` pyramids. Boring beats clever.
- Comments explain **why**, never **what**.

→ [references/simplicity.md](references/simplicity.md)

## Hard rules

- **Search before you write.** Look for an existing helper, type, constant, or test table and reuse it.
- **No duplication.** When logic appears a second time, extract it to a shared place and use it from both.
- **No single-use helpers.** A helper with one caller gets inlined. Helpers exist to be reused.
- **No throwaway tests.** Every test you write is durable: it lives in the suite, tests public behavior, and earns its place. Never write a scratch test to "check once".
- **Refactor what you touch.** Bring the functions you edit up to these principles. Leave unrelated code alone.

## Testing

**Small test code, many cases.** Simplicity applies to the test *code*, never to *coverage*. A table row costs one line, so add many.

- **One or more rows per requirement.** Walk the spec bullet by bullet and make each one a test case, plus its edge cases: the boundary values, zero and empty, the same value twice, calling twice, calling from inside a callback, time going backwards, and errors from every source at once.
- Test **behavior** through public inputs and outputs, not internals.
- **Table-driven** tests: cases as data, one loop, one assertion shape. Every row has a name that shows up when it fails.
- **Never write a test that locks in a bug.** If an expected value looks odd (`PaymentDue(0)`, empty flags after parsing them), fix the code, not the expectation.
- **Mock only at I/O edges** (network, filesystem, database, clock). Pure logic needs no mocks.
- State machines: **one row per transition**, `(state, event) → expected next`, including rejected events.
- **Rows before functions.** Before adding a test function or block, look for an existing table test of the same behavior (same function, same input shape, same assertion shape) and add named rows to it. Add a new test function only when no table fits: a different assertion shape, a different fixture, or a different public entry point. When you add one, say which reason applies in one line.

→ [references/testing.md](references/testing.md)

---

## Before you finish, check yourself

- [ ] Re-read the request: does every requirement work, and does each have at least one test? Nothing dropped or weakened to keep the code small?
- [ ] For each state, does every plausible event do the *right* thing (not just "ignored")? Do rejections still give back what they owe?
- [ ] Are listeners called after all side effects, with the state re-checked after they run?
- [ ] Any branch chain on one key that should be a lookup?
- [ ] Any rules hard-coded in control flow that should be data?
- [ ] More than one boolean describing one thing's mode? Any representable invalid state?
- [ ] Any duplicated logic? Any helper with exactly one caller?
- [ ] Anything added that nobody asked for?
- [ ] Is every new test durable, behavioral, and table-driven where it has more than one case? Did I add rows to an existing table before writing a new test function?
- [ ] If I wrote a state machine, is there a test table with one row per `(state, event) → next`, including ignored or rejected events?
- [ ] Do the functions I touched now follow these principles?

Examples: [examples/](examples/) · Real LLM failures: [examples/llm-failures.md](examples/llm-failures.md) · Common traps: [references/anti-patterns.md](references/anti-patterns.md)
