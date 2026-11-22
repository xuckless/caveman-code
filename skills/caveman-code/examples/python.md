# Python

## Boolean soup → enum + data per state
```py
# before
class Job:
    def __init__(self):
        self.running = False
        self.failed = False
        self.error = None
        self.result = None
```
```py
# after
from dataclasses import dataclass

@dataclass(frozen=True)
class Queued: pass
@dataclass(frozen=True)
class Running: started_at: float
@dataclass(frozen=True)
class Failed: error: str
@dataclass(frozen=True)
class Done: result: bytes

JobState = Queued | Running | Failed | Done

def describe(s: JobState) -> str:
    match s:
        case Queued():          return "queued"
        case Running(t):        return f"running since {t}"
        case Failed(error=e):   return f"failed: {e}"
        case Done():            return "done"
```

## Transition table
```py
TRANSITIONS = {
    ("queued",  "start"):  "running",
    ("running", "fail"):   "failed",
    ("running", "finish"): "done",
    ("failed",  "retry"):  "queued",
}

def transition(state: str, event: str) -> str:
    try:
        return TRANSITIONS[(state, event)]
    except KeyError:
        raise ValueError(f"invalid: {event} in {state}") from None
```

## Branch ladder → dict dispatch
```py
# before
def export(fmt, rows):
    if fmt == "csv":   return to_csv(rows)
    elif fmt == "json": return to_json(rows)
    elif fmt == "xml":  return to_xml(rows)
    raise ValueError(fmt)

# after
EXPORTERS = {"csv": to_csv, "json": to_json, "xml": to_xml}

def export(fmt, rows):
    return EXPORTERS[fmt](rows)
```
