# Rust

## Flags + Options → enum with data
```rust
// before
struct Download {
    in_progress: bool,
    bytes: Option<u64>,
    error: Option<String>,
    path: Option<PathBuf>,
}
```
```rust
// after
enum Download {
    Pending,
    InProgress { bytes: u64 },
    Failed { error: String },
    Done { path: PathBuf },
}

impl Download {
    fn on(self, ev: Event) -> Result<Self, (Self, Event)> {
        use Download::*;
        match (self, ev) {
            (Pending, Event::Start)                      => Ok(InProgress { bytes: 0 }),
            (InProgress { bytes }, Event::Chunk(n))      => Ok(InProgress { bytes: bytes + n }),
            (InProgress { .. }, Event::Fail(error))      => Ok(Failed { error }),
            (InProgress { .. }, Event::Finish(path))     => Ok(Done { path }),
            (s, e)                                       => Err((s, e)),
        }
    }
}
```
The `match` on `(state, event)` is the transition table, checked by the compiler.
The catch-all arm rejects invalid events explicitly.
