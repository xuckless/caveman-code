# LLM Failure Catalog

Real or representative bad output from models, each with its caveman fix.
Entries marked **(eval)** were taken verbatim from the A/B eval runs in `evals/results/`.

---

## 1. Flag next to the status (eval)
A status union exists, but a boolean sneaks in to tell apart two ways of reaching the same status.
```ts
interface Upload {
  status: UploadStatus      // 'queued' | 'uploading' | 'paused' | ...
  /** Paused by a queue-level pause (so queue resume restores it). */
  pausedByQueue: boolean
}
// ...
if (u.status === "paused" && u.pausedByQueue) this.#requeue(u)
```
**Why it's bad:** `{status: 'uploading', pausedByQueue: true}` is representable and meaningless. The flag is a hidden second state.
**Fix:** two causes, two states.
```ts
type UploadStatus = 'queued' | 'uploading' | 'paused' | 'held' | ...   // held = paused by the queue
```

## 2. Transitions scattered across methods (eval)
```ts
cancel(id)  { ...; u.status = "cancelled"; ... }
#pauseUpload(u) { if (u.status !== "uploading" && u.status !== "queued" && u.status !== "retrying") return false; ...; u.status = "paused" }
#requeue(u) { u.status = "queued"; ... }
#start(u)   { u.status = "uploading"; ... }
// + done, failed, retrying in promise callbacks: 12 assignments in 9 places
```
**Why it's bad:** the lifecycle can only be reconstructed by reading every method, and each guard re-encodes part of the table by hand.
**Fix:** one table, one `send()`.
```ts
const TRANSITIONS = {
  queued:    { start: 'uploading', pause: 'paused', cancel: 'cancelled' },
  uploading: { succeed: 'done', backoff: 'retrying', fail: 'failed', pause: 'paused', cancel: 'cancelled' },
  ...
} as const
```

## 3. Unrequested options (eval)
```ts
export interface UploadQueueOptions {
  maxConcurrent?: number
  /** Backoff delays; its length is the max number of automatic retries. */
  retryDelays?: number[]
}
constructor(transport: Transport, opts: UploadQueueOptions = {}) { ... }
```
**Why it's bad:** the spec fixed both values ("at most 3", "500ms, 1s, 2s"), so the options exist "for flexibility" and "for tests".
**Fix:** named constants. Tests use mock timers.
```ts
export const MAX_CONCURRENT = 3
export const RETRY_DELAYS_MS = [500, 1000, 2000]
```

## 4. Boolean soup
```py
self.is_sent = False
self.is_failed = False
self.is_retrying = False
...
if n.is_failed and not n.is_retrying: continue
```
**Why it's bad:** 8 combinations, 4 meaningful ones, and every reader must re-derive which is which.
**Fix:**
```py
class Status(Enum): PENDING = auto(); RETRYING = auto(); SENT = auto(); FAILED = auto()
```

## 5. Rewriting a helper that already exists
```ts
// src/posts.ts — while src/lib/text.ts already exports slugify()
function makeSlug(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
```
**Why it's bad:** you get two slug rules that will drift apart (this one already drops the accent handling).
**Fix:** `import { slugify } from './lib/text.ts'`.

## 6. Single-use helper
```ts
function buildErrorMessage(field: string) { return `${field} is required` }
// called exactly once
if (!title) throw new Error(buildErrorMessage('title'))
```
**Fix:** `if (!title) throw new Error('title is required')`.

## 7. Throwaway test
```py
# tests/test_quick_check.py
def test_it_works():
    print(parse("a,b\n1,2"))   # eyeballed once, asserts nothing
```
**Why it's bad:** it passes forever, protects nothing, and adds noise to the suite.
**Fix:** add rows to the real table with expected outputs, or don't write it.

## 8. Copy-paste tests instead of a table
```ts
test('pause from queued', () => { const q = setup(); q.add([f]); q.pause('1'); assert.equal(st(q), 'paused') })
test('pause from uploading', () => { const q = setup(); q.add([f]); start(q); q.pause('1'); assert.equal(st(q), 'paused') })
test('pause from retrying', () => { const q = setup(); q.add([f]); fail(q); q.pause('1'); assert.equal(st(q), 'paused') })
```
**Fix:** one table driving one test body.
```ts
for (const [from, event, to] of TRANSITION_CASES) test(`${from} + ${event} → ${to}`, () => { ... })
```

## 9. Branch ladder on one key
```go
if seg.SYN && !seg.ACK && state == LISTEN { ... } else if seg.SYN && seg.ACK && state == SYN_SENT { ... } else if ...
```
**Fix:** `transitions[state][input]`, with a lookup that rejects unknown pairs.

## 10. Stored derived state
```ts
status: 'done', progress: 1, isComplete: true   // isComplete must always equal status === 'done'
```
**Fix:** delete `isComplete` and compute it where needed.

## 11. Defensive noise
```ts
try { listener() } catch { /* a faulty listener must not break the queue */ }
```
Nobody asked for this, and it swallows real bugs silently. Add it when there's a real requirement such as third-party plugins, and then log what it catches.

## 12. Pass-through layers
```ts
// api.ts → service.ts → repository.ts → db.ts, each one line forwarding to the next
export const getUser = (id: string) => userService.getUser(id)
```
**Fix:** call the thing that does the work.

---


## From the 30-task eval (2026-11-22)

### Without the skill: the usual over-building

#### 13. Five loose fields for one lifecycle (eval: circuit breaker)
```ts
#state: CircuitState = "closed";
#failures = 0;
#openedAt = 0;
#trialInFlight = false;   // true exactly when state is 'half-open'
#epoch = 0;               // added later to patch races caused by the above
```
**Fix:** put the data on the state that owns it.
```ts
type State = { status: 'closed'; failures: number } | { status: 'open'; openedAt: number } | { status: 'half-open' }
```

#### 14. A step plus three variables (eval: checkout wizard)
```ts
let step: Step = 'shipping'
let submitting = false
let submitError: string | null = null
let orderId: string | null = null      // can be set while step !== 'confirmation'
```
**Fix:** one union, e.g. `{ step: 'review'; status: 'failed'; error } | { step: 'confirmation'; orderId }`.

#### 15. A flag that mirrors another variable (eval: autosave)
```ts
let saving = false                 // == (status.state === 'saving')
let timer: TimerHandle | undefined
let hasTimer = false               // == (timer !== undefined)
```
**Fix:** delete both flags and derive them.

#### 16. Guessing at the contract (eval: checkout wizard)
```ts
export type SubmitResult = string | number | { orderId: string | number } | { id: string | number }
function extractOrderId(result: SubmitResult): string { /* four branches */ }
```
**Fix:** `submitOrder: (data) => Promise<string>`. Accept one shape, the one the spec implies.

#### 17. Re-checking at runtime what the types already guarantee (eval: RBAC)
```ts
const ROLES: readonly string[] = ['admin', 'editor', 'author', 'viewer']
if (!ROLES.includes(user.role) || !ACTIONS.includes(action) || !TYPES.includes(resource.type)) return false
```
**Fix:** `return RULES[user.role]?.[resource.type]?.[action]?.(user, resource) ?? false`, where the table lookup denies unknown keys for free.

#### 18. Stored derived value that goes stale (eval: elevator)
```py
self._direction = ...   # recomputed by _update_direction() at 3 call sites; request() forgets, so it reads IDLE
```
**Fix:** make `direction` a property computed from the floor, the stops and the last heading.

### With the skill: over-correction (the skill's own failure mode)
Adding the skill made models cut *requirements* to keep the code small. These were the most common reason the skill-guided run lost a task. They are why SKILL.md now says "the spec is the floor."

#### 19. The generic guard swallows a payload (eval: vending machine)
```py
def action(fn):
    def guarded(self, *args):
        if fn.__name__ not in ALLOWED[self.mode]:
            return Result(REJECTED[self.mode])      # insert(coin) in maintenance: the coin is never returned
        return fn(self, *args)
```
**Why:** the tidy table-driven guard rejects every action the same way, but rejecting `insert` still owes the customer a coin.
**Fix:** the rejection carries what it owes: `Result('Out of service', coins=(coin,))`.

#### 20. Short-circuiting "report ALL problems" (eval: config loader)
```py
except json.JSONDecodeError as e:
    raise ConfigError([f"{path}: invalid JSON ({e})"]) from None   # env/override errors never get collected
```
**Fix:** append the error to `problems`, fall back to `{}`, keep validating, and raise once at the end.

#### 21. Reporting a final state before it's true (eval: job scheduler)
```go
// Cancel on a running job: state = Cancelled immediately, while fn is still running
return s.send(j, Cancel)
```
**Fix:** add a `Cancelling` state. Running + cancel → Cancelling, then Cancelling + fn returns → Cancelled.

#### 22. An empty table cell that should have been a row (eval: media player, traffic light)
```ts
playing:   { ..., finished: 'ended', ... },
buffering: { ..., /* no 'finished' */ },     // last track ends while buffering → never reaches 'ended'
```
```go
redForNS: {timeout: nsHold},   // no emergencyCleared: an early clear is dropped, NS stays green forever
```
**Fix:** for every state, decide what each plausible event should do, and write a test for the rejected cells that matter.

#### 23. Notifying listeners before the side effects (eval: WebSocket client)
```ts
current.onopen = () => {
  if (!go('open')) return          // listeners run here and may call send() or close()
  for (const m of buffer.splice(0)) current.send(m)   // listener's send() went out first; order broken
  schedulePing()                   // runs even if a listener called close(), so the timer leaks forever
}
```
**Fix:** flush the buffer and schedule the timer first, then notify. Re-check the status after any callback.

#### 24. A test that locks in the bug (eval: CLI parser, parking garage)
```go
{name: "parent flags before subcommands", args: []string{"-v", "--config=c.toml", "remote", "ls"}, flags: flags{}},
```
```rust
(Some(20 * MIN), 20 * MIN + GRACE_SECS + 1, Some(3), Err(Error::PaymentDue(0))),   // owes $0 but can't leave
```
**Fix:** when an expected value looks odd, fix the code. `flags{"verbose": ..., "config": "c.toml"}`, and exit is allowed when $0 is owed.

#### 25. Re-selecting the current mode resets everything (eval: thermostat)
```zig
pub fn setMode(self: *Thermostat, mode: Mode, now: u64) Command {
    self.mode = mode;
    self.switchTo(.idle, now);    // cool → cool stops the compressor and starts a 5-minute lockout
```
**Fix:** `if (mode == self.mode) return self.command(now);`

### From the maintainability rounds: how good designs decay

#### 26. Intercepting events before the table (eval: traffic light, ticket 2)
A later maintainer who didn't know the convention added behavior *around* the transition table instead of *in* it:
```go
func (c *Controller) send(ev event) {
	switch c.clearance {            // new: handled before the table even sees the event
	case pedClearance: ...; return
	case emergencyClearance: ...; return
	}
	next := transitions[c.phase][ev]
	...
}
```
**Why it's bad:** the table no longer describes the real behavior, so every reader must mentally merge two mechanisms. A latent bug grew in exactly this tangle.
**Fix:** add the clearance phases as states and rows. Mark the table so the next person knows: `// Every transition is a row here. Add behavior as states/rows, not branches in send().`

#### 27. One cross-cutting rule copied into every method (eval: order lifecycle, ticket 4)
```py
def pay(self, ...):     self._expire_review(); ...
def ship(self, ...):    self._expire_review(); ...
def cancel(self, ...):  self._expire_review(); ...
# ... in all 11 event methods
```
**Fix:** with a single `send()`, a cross-cutting rule is one hook, written once.

#### 28. Parallel fields reset together at many sites (eval: undo/redo)
```rust
self.typing_group = None; self.erase_group = None;   // repeated at ~10 sites; the planted bug was one site drifting
```
**Fix:** `enum Group { None, Typing{..}, Erasing{..} }`. Closing a group is a single assignment that can't drift.
