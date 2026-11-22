# fetch-with-loading-state

## Prompt
Write a React hook `useUser(id)` that fetches `/api/users/:id` and exposes loading, error, and data.

## Expect
- A single discriminated `status` field (or equivalent union)
- Data and error live on their own states
- No dependencies beyond React

## Reject
- Separate `isLoading` / `isError` booleans
- A generic `useFetch<T>` abstraction nobody asked for
- Caching, retry, or abort logic that wasn't requested
