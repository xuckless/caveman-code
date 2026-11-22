# Declarative Code

Priority 1. Write *what* should be true as data. Keep the *how* in a small, boring engine.

## The shape
```
DATA (rules, tables, config)  →  ENGINE (one small function)  →  RESULT
```
Adding behavior should mean adding a **row**, not adding a **branch**.

## Patterns

### Lookup over branching
```ts
// before
if (kind === 'png') return decodePng(buf)
else if (kind === 'jpg') return decodeJpg(buf)
else if (kind === 'gif') return decodeGif(buf)

// after
const DECODERS = { png: decodePng, jpg: decodeJpg, gif: decodeGif } as const
return DECODERS[kind](buf)
```

### Rules as data
```py
RULES = [
    ("email",    lambda v: "@" in v,     "must contain @"),
    ("age",      lambda v: 0 <= v < 150, "out of range"),
    ("username", lambda v: len(v) >= 3,  "too short"),
]

def validate(form):
    return [f"{field}: {msg}" for field, ok, msg in RULES if not ok(form[field])]
```

### Pure core, imperative shell
```ts
// pure: decides
function nextActions(order: Order): Action[] { ... }

// shell: does
for (const a of nextActions(order)) await perform(a)
```
The pure part gets easy table-driven tests. The shell stays too thin to need many.

### Transition tables
A state machine's transitions are rules, so they are data. See [state-machines.md](state-machines.md).

## Where declarative stops
- **You built an interpreter.** The config has conditions, expressions, or nesting that needs its own evaluator. Move the logic back to code.
- **Debugging needs you to execute the config in your head.** The data has become logic.
- **Every row has a special case.** If the rows aren't uniform, it isn't a table. Write the code.

A short table is fine. It's still the declarative choice, and principle 1 outranks "fewer lines".
