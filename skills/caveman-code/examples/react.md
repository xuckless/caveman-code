# React

## useEffect flag chains → useReducer with union state
```tsx
// before
const [open, setOpen] = useState(false)
const [submitting, setSubmitting] = useState(false)
const [submitted, setSubmitted] = useState(false)
const [error, setError] = useState<string | null>(null)
useEffect(() => { if (submitted) setOpen(false) }, [submitted])
```
```tsx
// after
type State =
  | { phase: 'closed' }
  | { phase: 'editing' }
  | { phase: 'submitting' }
  | { phase: 'failed'; error: string }

type Action =
  | { type: 'open' } | { type: 'submit' }
  | { type: 'ok' } | { type: 'fail'; error: string } | { type: 'close' }

function reducer(s: State, a: Action): State {
  switch (s.phase) {
    case 'closed':     return a.type === 'open' ? { phase: 'editing' } : s
    case 'editing':    return a.type === 'submit' ? { phase: 'submitting' }
                            : a.type === 'close' ? { phase: 'closed' } : s
    case 'submitting': return a.type === 'ok' ? { phase: 'closed' }
                            : a.type === 'fail' ? { phase: 'failed', error: a.error } : s
    case 'failed':     return a.type === 'submit' ? { phase: 'submitting' }
                            : a.type === 'close' ? { phase: 'closed' } : s
  }
}
```
Success closes the dialog as a *transition*, not as an effect reacting to a flag.
Unknown actions in a state return `s` unchanged, which is a deliberate choice.
