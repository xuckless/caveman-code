export const meta = {
  name: 'caveman-maintainability',
  description: 'Maintainability pilot: fresh agents (no skill) add a feature and hunt a planted bug in each no-skill vs skill codebase; mutation testing; hidden acceptance tests; blind judge',
  phases: [
    { title: 'Plan', detail: 'per task: change request, bug to plant, scenarios, mutations' },
    { title: 'Setup', detail: 'per side: copy, mutation testing, plant bug' },
    { title: 'Maintain', detail: 'fresh Sonnet agents (no skill): feature change + bug hunt', model: 'sonnet' },
    { title: 'Judge', detail: 'hidden acceptance tests + diff metrics, blind' },
  ],
}

const ROOT = args.root
const SRC = `${ROOT}/eval2`
const M = `${ROOT}/maint`
const TASKS_FILE = args.tasksFile

const PLAN = {
  type: 'object',
  properties: {
    feature_request: { type: 'string', description: 'a realistic follow-up change request, phrased like a ticket, implementable in both codebases' },
    bug: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'semantic description of a single subtle bug to plant, applicable to BOTH codebases (in behavior terms, not code terms)' },
        symptom_report: { type: 'string', description: 'what a user would report, without hinting at the location or cause' },
      },
      required: ['description', 'symptom_report'],
    },
    scenarios: { type: 'array', items: { type: 'string' }, description: '15-25 behavioral acceptance scenarios for the ORIGINAL spec, each with concrete inputs and expected outcomes' },
    feature_scenarios: { type: 'array', items: { type: 'string' }, description: '5-8 behavioral acceptance scenarios for the feature request' },
    mutations: { type: 'array', items: { type: 'string' }, description: 'exactly 8 semantic mutations (behavior-level, e.g. "allow one extra retry", "skip the cooldown check") applicable to both codebases' },
  },
  required: ['feature_request', 'bug', 'scenarios', 'feature_scenarios', 'mutations'],
}

const SETUP = {
  type: 'object',
  properties: {
    mutations: { type: 'array', items: { type: 'object', properties: { mutation: { type: 'string' }, applied: { type: 'boolean' }, killed: { type: 'boolean' } }, required: ['mutation', 'applied', 'killed'] } },
    bug_planted: { type: 'boolean' },
    bug_caught_by_existing_tests: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['mutations', 'bug_planted', 'bug_caught_by_existing_tests', 'notes'],
}

const SIDE = {
  type: 'object',
  properties: {
    hidden_original: { type: 'object', properties: { pass: { type: 'integer' }, total: { type: 'integer' } }, required: ['pass', 'total'] },
    hidden_after_feature: { type: 'object', properties: { pass: { type: 'integer' }, total: { type: 'integer' } }, required: ['pass', 'total'], description: 'original + feature scenarios run against the feature-changed code' },
    regressions_after_feature: { type: 'integer', description: 'original scenarios that passed before the feature change and fail after' },
    feature_diff_loc: { type: 'integer', description: 'lines added+removed in non-test source by the feature change' },
    feature_files_touched: { type: 'integer' },
    feature_quality: { type: 'integer', description: '1-5: does the change fit the existing design cleanly' },
    bug_fixed: { type: 'boolean', description: 'planted bug actually fixed (not papered over), verified against the secret diff and hidden scenarios' },
    bug_fix_diff_loc: { type: 'integer' },
    notes: { type: 'string' },
  },
  required: ['hidden_original', 'hidden_after_feature', 'regressions_after_feature', 'feature_diff_loc', 'feature_files_touched', 'feature_quality', 'bug_fixed', 'bug_fix_diff_loc', 'notes'],
}

const VERDICT = {
  type: 'object',
  properties: {
    X: SIDE, Y: SIDE,
    more_maintainable: { type: 'string', enum: ['X', 'Y', 'tie'] },
    margin: { type: 'string', enum: ['large', 'small', 'none'] },
    summary: { type: 'string' },
  },
  required: ['X', 'Y', 'more_maintainable', 'margin', 'summary'],
}

const EXCLUDE = 'Exclude build output and caches (target/, node_modules/, .zig-cache/, zig-cache/, __pycache__/).'

phase('Plan')
const results = await pipeline(
  args.tasks,
  (task) => agent(`Read the feature spec for task "${task.id}" in ${TASKS_FILE} (the entry with that id). Two independent implementations exist at ${SRC}/${task.id}/a and ${SRC}/${task.id}/b. Read both so that everything you produce applies to BOTH equally, but do not modify them.

Produce a maintainability test plan:
- feature_request: a realistic follow-up change (the kind of ticket that arrives a month later) that touches the core logic, not just a new getter. It must be implementable in both codebases.
- bug: one subtle behavioral bug that can be planted at the equivalent place in both, plus a symptom report written like a user would write it, with no hint of the location or cause.
- scenarios and feature_scenarios: concrete behavioral acceptance checks (inputs and expected outputs), expressed against the SPEC, not either API.
- mutations: 8 behavior-level mutations applicable to both.`, { label: `plan:${task.id}`, phase: 'Plan', schema: PLAN }),

  (plan, task) => parallel(['a', 'b'].map((v) => () => {
    const base = `${M}/${task.id}/${v}`
    return agent(`Prepare maintainability test copies of the codebase at ${SRC}/${task.id}/${v}. Do NOT modify that original directory. ${EXCLUDE}

1. Copy it to ${base}/feature and to ${base}/bug. Also copy it once more to ${M}/${task.id}/secret/${v}-mut for mutation testing.
2. Mutation testing in ${M}/${task.id}/secret/${v}-mut: for each mutation below, make the smallest source edit (not tests) that implements it. If it cannot be meaningfully applied, set applied=false. Run the test suite and record killed=true if any test fails or the build breaks, then revert before the next mutation.
${plan.mutations.map((m, i) => `   ${i + 1}. ${m}`).join('\n')}
3. Plant this bug in ${base}/bug, with the smallest natural-looking source edit and no comments or other hints: ${plan.bug.description}
   Then run the test suite there and record whether the existing tests catch it. Save the planted change as a unified diff to ${M}/${task.id}/secret/${v}-bug.diff. Do not leave any other trace in ${base}/bug (no backup files).`, { label: `setup:${task.id}:${v}`, phase: 'Setup', schema: SETUP })
  })).then((setups) => ({ plan, setups })),

  ({ plan, setups }, task) => parallel(['a', 'b'].flatMap((v) => [
    () => agent(`You're maintaining the codebase at ${M}/${task.id}/${v}/feature. Work only inside that directory.

Change request:
${plan.feature_request}

Implement it, keep the existing tests passing, and add tests for the new behavior. Reply with a short summary of what you changed.`, { label: `feature:${task.id}:${v}`, phase: 'Maintain', model: 'sonnet' }),
    () => agent(`You're maintaining the codebase at ${M}/${task.id}/${v}/bug. Work only inside that directory.

A user reported this bug:
"${plan.bug.symptom_report}"

Find the root cause and fix it, then add a regression test. Reply with the root cause and the fix.`, { label: `hunt:${task.id}:${v}`, phase: 'Maintain', model: 'sonnet' }),
  ])).then((maint) => ({ plan, setups, maint })),

  ({ plan, setups }, task, i) => {
    const flip = i % 2 === 1
    const map = { X: flip ? 'b' : 'a', Y: flip ? 'a' : 'b' }
    const d = (s) => ({ orig: `${SRC}/${task.id}/${map[s]}`, feat: `${M}/${task.id}/${map[s]}/feature`, bug: `${M}/${task.id}/${map[s]}/bug`, diff: `${M}/${task.id}/secret/${map[s]}-bug.diff` })
    const X = d('X'), Y = d('Y')
    return agent(`You are judging the MAINTAINABILITY of two independent codebases for the same spec (task "${task.id}" in ${TASKS_FILE}). For each codebase, a fresh maintainer added a feature and another hunted a planted bug. Never modify any of the directories below. Do all test work in copies under ${M}/${task.id}/judge/. ${EXCLUDE}

X: original ${X.orig}, after feature ${X.feat}, after bug hunt ${X.bug}, planted bug diff ${X.diff}
Y: original ${Y.orig}, after feature ${Y.feat}, after bug hunt ${Y.bug}, planted bug diff ${Y.diff}

Feature request given to both maintainers:
${plan.feature_request}

Planted bug: ${plan.bug.description}

Acceptance scenarios (original spec):
${plan.scenarios.map((s, k) => `${k + 1}. ${s}`).join('\n')}

Feature scenarios:
${plan.feature_scenarios.map((s, k) => `F${k + 1}. ${s}`).join('\n')}

For each side:
1. Write hidden acceptance tests implementing the scenarios against that side's public API (adapt to each API, but test the same behavior). Run the original scenarios against the original copy. Run original + feature scenarios against the feature copy.
2. Count regressions: original scenarios that pass on the original and fail after the feature change.
3. Measure the feature change: lines and files changed in non-test source (diff the original against the feature copy). Rate how cleanly it fits the existing design (1-5).
4. Check the bug hunt: diff the bug copy against the original. Was the planted bug (see the diff) actually fixed at the root, or papered over? Count the fix's diff lines in source.
Then decide which codebase proved more maintainable: weight correct feature changes, no regressions, bugs found, and small focused diffs.`, { label: `judge:${task.id}`, phase: 'Judge', schema: VERDICT })
      .then((v) => v && ({ id: task.id, map, plan, setups, verdict: v }))
  },
)
const done = results.filter(Boolean)
log(`${done.length}/${args.tasks.length} tasks judged`)
return done