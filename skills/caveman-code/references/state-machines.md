# State Machines: Explicit State, Implicit Machinery

Priority 2. Every component with a lifecycle is already a state machine. The only
question is whether its states are **written down** or **smeared across booleans**.

## The ladder: use the lowest rung that works

### Rung 1: the structure is the machine
When a process runs start to finish in one place, the program counter is the state.
```ts
async function checkout(cart) {
  const quote   = await priceCart(cart)
  const payment = await charge(quote)
  return await ship(cart, payment)
}
```
No `isPricing`/`isCharging` flags: whichever line is running *is* the state.
**Move up a rung** when the state must be observed from outside (UI rendering),
must survive across events or requests, or can be interrupted and resumed.

### Rung 2: one status value
```ts
type Upload =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'failed'; error: string }
  | { status: 'done'; url: string }
```
```rust
enum Upload { Idle, Uploading { progress: f32 }, Failed(String), Done { url: String } }
```
Use exhaustive `switch`/`match`, so the compiler catches a missing case.

### Rung 3: a transition table
Once several events can move between several states, write the transitions as data:
```ts
const TRANSITIONS = {
  idle:      { start: 'uploading' },
  uploading: { progress: 'uploading', fail: 'failed', finish: 'done', cancel: 'idle' },
  failed:    { retry: 'uploading', cancel: 'idle' },
  done:      {},
} as const satisfies Record<Status, Partial<Record<Event, Status>>>

function transition(s: Status, e: Event): Status {
  const next = TRANSITIONS[s][e]
  if (!next) throw new Error(`invalid: ${e} in ${s}`)
  return next
}
```
Every allowed transition is visible in one place, and tests are one row per entry.

#### Pick the table's shape from the spec, not from the happy path
A cycle table (`phase → { duration, next }`) looks clean for a traffic light's normal loop. But the spec also had emergencies, night mode and pedestrian presses, and the table had no slot for them. Every later feature then became a flag or an intercept beside the table (eval: go-traffic-light, both runs).
```ts
// too narrow: only one way out of each phase
const CYCLE = { nsGreen: { secs: 30, next: 'nsYellow' }, ... }

// right shape: every event has a cell, and timeouts are just another event
const TRANSITIONS = {
  nsGreen:  { timeout: 'nsYellow', emergencyEW: 'nsYellowToEW', night: 'nsYellowToNight', pedEW: 'nsGreenShort' },
  ...
}
```
Rule of thumb: list the spec's events first. If any event can happen in more than one state, you need `state × event`.

### Rung 4: a library (XState, etc.)
Only for hierarchical or parallel states, or when you need visualization. If you're asking whether you need it, you don't.

## Rules
- **Make impossible states unrepresentable.** Use sum types, discriminated unions, or tagged unions.
- **Data lives on its state.** `error` only exists inside `failed`.
- **One owner per piece of state.** It's mutated only through `transition` or a reducer.
- **Unknown events are explicit**: throw, return the state unchanged, or log, chosen deliberately.
- **Derived values are computed, not stored.** Don't keep `isDone` next to `status`.

## Smells
- `if (isLoading && !isError && data)`
- Setting 3 flags in a row to "enter a mode"
- `useEffect` chains reacting to each other's flags
- A `mode` string *and* booleans that are supposed to agree with it
- Timeouts or retries tracked with loose counters outside the state

## By language
| Language | Rung 2 tool |
|---|---|
| TypeScript | discriminated union on `status`/`kind` |
| Python | `enum.Enum` + `match`, or dataclasses per state |
| Rust | `enum` with data + `match` |
| Go | named type + `const` iota + `switch`; struct per state if data differs |
| C | `enum` + `switch`, tagged `union` for per-state data |
| C++ | `enum class`, `std::variant` + `std::visit` |
| Zig | `union(enum)` + `switch` (exhaustive) |
| React | `useReducer` with a union state |
