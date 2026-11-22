# Language-agnostic: over-engineered → caveman

### Task
"Read a JSON config file and return the `port` field, defaulting to 3000."

### Before (typical LLM output)
```ts
interface ConfigLoader { load(): Promise<Config> }
class FileConfigLoader implements ConfigLoader {
  constructor(private path: string, private opts: { encoding?: BufferEncoding; cache?: boolean } = {}) {}
  private cache?: Config
  async load() { /* 25 lines with caching, validation, and custom error classes */ }
}
export const getPort = async () => (await new FileConfigLoader('./config.json').load()).port ?? 3000
```

### After
```ts
import { readFileSync } from 'node:fs'
export const getPort = () => JSON.parse(readFileSync('./config.json', 'utf8')).port ?? 3000
```
That's one line. When a second config source actually exists, change it then.
