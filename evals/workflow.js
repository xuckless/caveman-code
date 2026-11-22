export const meta = {
  name: 'caveman-ab-eval',
  description: 'A/B eval of the caveman-code skill: 30 tasks x (Sonnet without skill, Sonnet with skill) + blind Opus judge',
  phases: [
    { title: 'Implement', detail: 'Sonnet builds each task twice: A without skill, B with skill', model: 'sonnet' },
    { title: 'Judge', detail: 'blind judge scores X vs Y per task' },
  ],
}

const ROOT = args.root
const SKILL = args.skill

const LANG = {
  ts: 'TypeScript. Node 22 runs .ts files directly via type stripping: import with .ts extensions, and avoid enums, namespaces and constructor parameter properties (type stripping does not support them). Put code in src/ and tests in test/ using node:test. Run tests with `npm test`. No npm dependencies.',
  py: 'Python 3, standard library only. Put code in src/ and tests in tests/ using unittest. Run tests with `python3 -m unittest discover -s tests -t .` from the repo root.',
  go: 'Go 1.26, standard library only. Run tests with `go test ./...`.',
  rs: 'Rust, no external crates (offline). Run tests with `cargo test`.',
  c: 'C11. Put code in src/ and tests in tests/ (a test program with its own main using assert). Run tests with `make test` (see the Makefile).',
  zig: 'Zig 0.17. Put code in src/root.zig (other files are fine if imported from it) and write tests as `test` blocks. Run tests with `zig test src/root.zig`. The std library API changed recently: if something fails to compile, check the installed std source (`zig env` shows lib_dir) rather than guessing.',
}

function implPrompt(task, variant) {
  const dir = `${ROOT}/${task.id}/${variant}`
  const guide = variant === 'b'
    ? `\nThis team's coding guidelines are at ${SKILL}. Read it before you start, and follow it (and the files it links to, when relevant).\n`
    : ''
  return `You're working in the repo at ${dir}. Work only inside that directory.
${LANG[task.lang]}
${guide}
Feature request:
${task.prompt}

Write tests covering the behavior. Make all tests pass before finishing. Reply with a short summary of the files you created or changed.`
}

const SIDE = {
  type: 'object',
  properties: {
    tests_pass: { type: 'boolean' },
    tests_count: { type: 'integer' },
    src_loc: { type: 'integer', description: 'non-blank lines of source written/changed (excluding tests)' },
    test_loc: { type: 'integer' },
    scores: {
      type: 'object',
      description: '1 (bad) to 5 (excellent)',
      properties: {
        correctness: { type: 'integer' },
        declarative: { type: 'integer' },
        explicit_state: { type: 'integer' },
        simplicity: { type: 'integer' },
        no_duplication: { type: 'integer' },
        no_single_use_helpers: { type: 'integer' },
        tests_quality: { type: 'integer' },
      },
      required: ['correctness', 'declarative', 'explicit_state', 'simplicity', 'no_duplication', 'no_single_use_helpers', 'tests_quality'],
    },
    violations: { type: 'array', items: { type: 'string' }, description: 'concrete violations, each with file:line' },
  },
  required: ['tests_pass', 'tests_count', 'src_loc', 'test_loc', 'scores', 'violations'],
}

const VERDICT = {
  type: 'object',
  properties: {
    winner: { type: 'string', enum: ['X', 'Y', 'tie'] },
    margin: { type: 'string', enum: ['large', 'small', 'none'] },
    X: SIDE,
    Y: SIDE,
    bad_examples: {
      type: 'array',
      description: 'The 1-3 most instructive bad patterns found in either side',
      items: {
        type: 'object',
        properties: {
          side: { type: 'string', enum: ['X', 'Y'] },
          category: { type: 'string', description: 'e.g. boolean-soup, branch-ladder, scattered-transitions, speculative-abstraction, unrequested-feature, duplication, single-use-helper, rewritten-helper, throwaway-test, copy-paste-tests, missing-transition-tests, stored-derived-state, pass-through-layer, defensive-noise, narrating-comments, interpreter-config, spec-bending' },
          file: { type: 'string' },
          snippet: { type: 'string', description: 'verbatim code, at most 15 lines' },
          why: { type: 'string' },
          fix: { type: 'string', description: 'short corrected snippet or description' },
        },
        required: ['side', 'category', 'file', 'snippet', 'why', 'fix'],
      },
    },
    summary: { type: 'string', description: '2-4 sentences' },
  },
  required: ['winner', 'margin', 'X', 'Y', 'bad_examples', 'summary'],
}

function judgePrompt(task, xDir, yDir) {
  return `You are judging two independent implementations of the same feature request. Be strict and evidence-based. Do not modify either directory.

X: ${xDir}
Y: ${yDir}
Language/tooling: ${LANG[task.lang]}

Feature request both received:
${task.prompt}

Steps:
1. Read all source and test files in both (ignore build output like target/, zig-cache).${task.seeded ? ' Both started from the same pre-existing code; judge how each changed and reused it.' : ''}
2. Run each test suite and record pass/fail and test count.
3. Check correctness against the request: read the code for spec violations and edge-case bugs. Write small throwaway probe scripts only OUTSIDE both directories if needed.
4. Score each side 1-5 on:
   - correctness: meets the spec, no bugs found
   - declarative: behavior expressed as data (lookup tables, rule tables, transition tables) instead of if/else or switch ladders, where that fits; penalize building a mini-interpreter
   - explicit_state: each lifecycle is ONE status value (union/enum) with transitions in one place; penalize multiple booleans for one mode, representable invalid states, scattered status assignments, stored derived state
   - simplicity: least code for the spec; penalize unrequested features/options, single-implementation abstractions, pass-through layers, defensive noise
   - no_duplication: no repeated logic; existing helpers reused rather than rewritten
   - no_single_use_helpers: no helper functions with exactly one caller that only add indirection (a pure decision function tested directly is fine)
   - tests_quality: durable behavioral tests, table-driven where there are many similar cases, every state transition covered (including rejected ones), mocks only at I/O edges, no copy-paste tests
5. Pick the winner overall (correctness counts heavily: a broken implementation should not win on style).
6. Extract 1-3 of the most instructive bad patterns (verbatim snippets) from either side for a catalog of LLM coding failures.`
}

phase('Implement')
const results = await pipeline(
  args.tasks,
  (task) => parallel(['a', 'b'].map((v) => () =>
    agent(implPrompt(task, v), { label: `${task.id}:${v}`, phase: 'Implement', model: 'sonnet' }))),
  (impls, task, i) => {
    const flip = i % 2 === 1
    const xV = flip ? 'b' : 'a'
    const yV = flip ? 'a' : 'b'
    return agent(judgePrompt(task, `${ROOT}/${task.id}/${xV}`, `${ROOT}/${task.id}/${yV}`), {
      label: `judge:${task.id}`, phase: 'Judge', schema: VERDICT,
    }).then((v) => v && ({ id: task.id, lang: task.lang, map: { X: xV, Y: yV }, implFailed: impls.map((r) => r === null), verdict: v }))
  },
)
const done = results.filter(Boolean)
log(`${done.length}/${args.tasks.length} tasks judged`)
return done