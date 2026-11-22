# Testing

Tests follow the same principles: cases are data (declarative), every transition is covered (explicit state), and there is no test infrastructure nobody needs (simplicity).

## Rules
- **Durable only.** Every test you write stays in the suite. Never write a one-off test to check something once and then forget it. If it's worth checking, it's worth keeping. If it isn't worth keeping, use the REPL or run the code instead.
- **Test behavior**, through public inputs and outputs. Never assert on private fields or call order.
- **Table-driven by default.** Cases are rows; one loop runs them.
- **Grow existing tables** before creating new test files or functions.
- **Mock only at I/O edges**: network, filesystem, database, clock, randomness. Heavy mocking means logic is tangled with I/O, so fix the design instead.
- **State machines: test every transition**, one row per `(state, event)`, including rejected events.
- **Reuse fixtures and builders** that already exist. Don't create a helper for a single test.
- **No new test frameworks or libraries.** Use what the project has.

## Shapes

### TypeScript (vitest/jest)
```ts
const CASES = [
  ['idle',      'start',  'uploading'],
  ['uploading', 'finish', 'done'],
  ['uploading', 'cancel', 'idle'],
  ['done',      'start',  'invalid'],
] as const

test.each(CASES)('%s + %s → %s', (from, event, to) => {
  expect(tryTransition(from, event)).toBe(to)
})
```

### Python (pytest)
```py
@pytest.mark.parametrize("region,cost", [("us", 5), ("eu", 8), ("uk", 7)])
def test_shipping(region, cost):
    assert shipping_cost(region) == cost
```

### Go
```go
for _, tc := range []struct{ from State; ev Event; want State }{
    {Idle, Start, Uploading},
    {Uploading, Finish, Done},
} {
    if got := Transition(tc.from, tc.ev); got != tc.want {
        t.Errorf("%v+%v = %v, want %v", tc.from, tc.ev, got, tc.want)
    }
}
```

## Smells
- A test file created for one check, then never run again
- `test('works')` with no clear behavior in its name
- Five near-identical test functions that should be five rows
- Mocking the module under test, or asserting on internal calls
- A new `testUtils.ts` holding one helper
