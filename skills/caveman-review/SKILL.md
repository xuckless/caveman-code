---
name: caveman-review
description: Audit a diff, branch, or set of files against the caveman-code principles (declarative over branching, explicit state over boolean soup, simplest implementation, no duplication, no single-use helpers, no throwaway tests). Use when the user asks to review code for these principles or runs /caveman-review.
---

# Caveman Review

Review the target (default: uncommitted changes, via `git diff HEAD`; otherwise what the user names) against the
`caveman-code` principles. Read `../caveman-code/SKILL.md` first if it isn't already loaded.

## Check, in priority order
| # | Check | Look for |
|---|---|---|
| 1 | Declarative | Branch chains on one key; rules buried in control flow |
| 2 | Explicit state | 2+ booleans for one mode; representable invalid states; transitions scattered; stored derived state |
| 3 | Simplicity | Unrequested features or options; single-implementation abstractions; pass-through layers; new deps |
| 4 | Duplication | Logic repeated in the diff or already existing elsewhere in the repo (search for it) |
| 5 | Single-use helpers | New functions with exactly one caller |
| 6 | Tests | Throwaway or one-off tests; copy-paste tests that should be one table; mocks of non-I/O; untested transitions |
| 7 | Rows before functions | A new test function whose cases could be rows in an existing table in the same file or suite (same subject, same assertion shape). Fix: move the cases into that table as named rows. Golden and fixture-heavy integration tests are exempt |

## Output
For each finding, report: `file:line`, check #, what it is, and the caveman fix (a short snippet when it helps).
Order by check number, most severe first within each. Only report findings you'd defend; skip style nits.
End with a one-line verdict: **caveman** (clean), **mostly caveman** (minor findings), or **not caveman** (findings in checks 1–2 or 4).

Don't edit files unless the user asks for fixes.
