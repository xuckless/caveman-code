# Decisions (2026-11-22)

## Principles
- **Priority when principles conflict: declarative > explicit state > simplicity.** Describe behavior as data first, make the state explicit next, then pick the simplest implementation that keeps both.
- **State model is a ladder:** the code's structure is the machine (straight-line async, loops, generators); move up to one status value and a transition table when that stops being enough; use a library only when that fails too.
- **Types:** strict where the language has them. Use sum types, discriminated unions, and enums so invalid states don't compile.
- **Classes vs. functions:** no stance. Follow the project.
- **Comments:** only "why" comments, never narration.
- **Simplicity doesn't need carve-outs:** these principles make validation, error handling, and security code easier to read, so nothing gets special protection.

## Habits to hit hardest
- Speculative abstraction (interfaces, factories, or generics with a single use; pass-through layers)
- Boolean soup
- **Code duplication**
- **Single-use helpers**: written once, called once, never reused
- **Throwaway tests**: one-off tests written to check something once and then forgotten

## Reuse rule
Search for an existing helper and reuse it. Extract a shared helper on the **2nd** copy. Never create a helper with a single caller.
(This replaces the draft's "abstract on the third copy" rule.)

## Diff scope
**Refactor what you touch.** Bring the functions and files the task edits up to the principles. Leave untouched code alone.

## Testing
- Durable behavior tests that live in the suite and test public behavior. No scratch or one-off tests.
- Mock only at I/O edges (network, fs, db). Tests are table-driven: a table of cases run in one loop.
- State machines: test every transition, one table row per (state, event), including rejected events.

## Voice & activation
- Neutral, precise rules with a caveman flavor (tagline and headers only).
- Governs code and tests only, not the agent's prose.
- Activates on every coding task.

## Packaging
- One skill (`caveman-code`) plus a review mode (`/caveman-review`) that audits a diff.
- Installer targets: Claude Code, Codex, Cursor, Copilot, Windsurf, Antigravity. All read the Agent Skills format, so no AGENTS.md or .mdc conversion is needed.
- Example languages: TS/React, Python, Go, Rust, C, C++, Zig, plus language-agnostic.
- npm: scoped package, MIT.

## Evals
A/B test: a blind agent builds a moderately complex feature that invites implicit state machines, in a scratch repo, once with the skill and once without. Claude judges the two results.

## Still open
- ~~npm scope~~ → `@xuckless/caveman-code` (unscoped `caveman-code` is also unclaimed)
- ~~Antigravity path~~ → `.agents/skills` (project), `~/.gemini/config/skills` (user; docs inconsistent, legacy `~/.gemini/antigravity/skills`)
- ~~Override~~ → an explicit user request wins
- Real bad-output examples from your own sessions
