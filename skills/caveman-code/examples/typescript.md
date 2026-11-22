# TypeScript

## Boolean soup → one status value

### Before
```ts
const [isLoading, setIsLoading] = useState(false)
const [isError, setIsError] = useState(false)
const [error, setError] = useState<Error | null>(null)
const [data, setData] = useState<User | null>(null)

async function load() {
  setIsLoading(true); setIsError(false); setError(null)
  try { setData(await fetchUser()) }
  catch (e) { setIsError(true); setError(e as Error) }
  finally { setIsLoading(false) }
}
```
The code allows 16 combinations, and only 4 of them make sense.

### After
```ts
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'done'; data: User }

const [state, setState] = useState<State>({ status: 'idle' })

async function load() {
  setState({ status: 'loading' })
  try { setState({ status: 'done', data: await fetchUser() }) }
  catch (error) { setState({ status: 'error', error: error as Error }) }
}
```
There are 4 states, all of them valid, and the data cannot exist in the wrong state.
## Branch ladder → lookup table

### Before
```js
function shippingCost(region) {
  if (region === 'us') return 5
  else if (region === 'eu') return 8
  else if (region === 'uk') return 7
  else if (region === 'au') return 12
  else throw new Error(`unknown region ${region}`)
}
```

### After
```js
const SHIPPING = { us: 5, eu: 8, uk: 7, au: 12 }

function shippingCost(region) {
  if (!(region in SHIPPING)) throw new Error(`unknown region ${region}`)
  return SHIPPING[region]
}
```
The rules are now data. Adding a region is a one-line change.
