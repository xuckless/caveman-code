# upload-queue

Scratch repo: `package.json` (`"type": "module"`, test script `node --test`), plus `src/transport.ts`:
```ts
export type Transport = (
  file: { id: string; name: string; size: number },
  opts: { signal: AbortSignal; onProgress: (bytesSent: number) => void },
) => Promise<{ url: string }>
```

## Prompt
Build an upload queue module in src/ that uses the Transport type in src/transport.ts.
- add(files) enqueues files; at most 3 uploads run concurrently.
- Each upload can be paused, resumed, and cancelled individually. Pausing aborts the in-flight request; resuming re-queues it (restarting from 0 is fine).
- Failed uploads retry automatically up to 3 times with exponential backoff (500ms, 1s, 2s); after that they're marked failed. A failed upload can be retried manually.
- The whole queue can be paused and resumed (pausing the queue stops new uploads from starting and pauses running ones).
- Track per-upload progress (0–1).
- Expose a snapshot() that a UI can render: every upload's status, progress, error, url, plus overall queue status.
- subscribe(listener) notifies on any change; returns an unsubscribe function.
- Write tests covering the behavior.

## Expect
- One `status` value per upload; transitions defined in one place (ideally a table)
- Invalid events rejected or ignored explicitly
- Per-run resources (AbortController, timer) cleaned up on any state exit
- Table-driven tests, including one row per transition

## Reject
- Boolean flags alongside `status` (`pausedByQueue`, `isRetrying`)
- `status = '...'` assignments scattered across many methods
- Unrequested options (configurable concurrency/delays), listener error swallowing, etc.
- Copy-paste tests
