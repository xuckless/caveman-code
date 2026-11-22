export const meta = {
  name: 'caveman-maintainability-v2',
  description: 'Harder maintainability round: 4 sequential feature tickets per codebase by fresh no-skill agents, then an uncaught planted bug, subtle mutations, cumulative hidden tests, blind judge',
  phases: [
    { title: 'Plan tickets', detail: '4 cumulative tickets + scenarios per task' },
    { title: 'Grow', detail: 'fresh Sonnet agents (no skill) apply tickets 1-4 in sequence', model: 'sonnet' },
    { title: 'Plan bug', detail: 'design a bug the grown test suites miss + subtle mutations' },
    { title: 'Setup', detail: 'plant uncaught bug, mutation testing' },
    { title: 'Hunt', detail: 'fresh Sonnet agents (no skill) hunt the bug', model: 'sonnet' },
    { title: 'Judge', detail: 'cumulative hidden tests per stage, blind' },
  ],
}

const ROOT = args.root
const SRC = `${ROOT}/eval2`
const M = `${ROOT}/maint2`
const TASKS_FILE = args.tasksFile
const EXCLUDE = 'Exclude build output and caches (target/, node_modules/, .zig-cache/, zig-cache/, __pycache__/).'
const N = 4

const TICKETS = {
  type: 'object',
  properties: {
    base_scenarios: { type: 'array', items: { type: 'string' }, description: '15-20 behavioral acceptance scenarios for the ORIGINAL spec, concrete inputs and expected outputs' },
    tickets: {
      type: 'array', minItems: 4, maxItems: 4,
      items: {
        type: 'object',
        properties: {
          ticket: { type: 'string', description: 'realistic change request; builds on earlier tickets; changes core behavior (new states, rules, interactions), not cosmetic' },
          scenarios: { type: 'array', items: { type: 'string' }, description: '5-8 behavioral acceptance scenarios for this ticket, consistent with all earlier tickets' },
        },
        required: ['ticket', 'scenarios'],
      },
    },
  },
  required: ['base_scenarios', 'tickets'],
}

const BUGPLAN = {
  type: 'object',
  properties: {
    bug_candidates: { type: 'array', items: { type: 'string' }, description: '3 alternative subtle behavioral bugs (most preferred first), each applicable to BOTH grown codebases and each likely NOT covered by their existing tests' },
    symptom_reports: { type: 'array', items: { type: 'string' }, description: 'one user-style symptom report per candidate, same order, no hint of location or cause' },
    mutations: { type: 'array', items: { type: 'string' }, description: 'exactly 10 subtle behavior-level mutations: boundary off-by-ones, a dropped edge case, a wrong interaction between two tickets, an ignored event in one state' },
  },
  required: ['bug_candidates', 'symptom_reports', 'mutations'],
}

const SETUP = {
  type: 'object',
  properties: {
    candidate_used: { type: 'integer', description: '0-based index of the bug candidate planted' },
    bug_planted: { type: 'boolean' },
    caught_by_existing_tests: { type: 'boolean', description: 'after trying candidates in order, did the existing tests still catch the planted bug' },
    mutations: { type: 'array', items: { type: 'object', properties: { mutation: { type: 'string' }, applied: { type: 'boolean' }, killed: { type: 'boolean' } }, required: ['mutation', 'applied', 'killed'] } },
    notes: { type: 'string' },
  },
  required: ['candidate_used', 'bug_planted', 'caught_by_existing_tests', 'mutations', 'notes'],
}

const STAGE = {
  type: 'object',
  properties: {
    stage: { type: 'integer', description: '0 = original, 1-4 = after ticket k' },
    hidden_pass: { type: 'integer' }, hidden_total: { type: 'integer' },
    regressions: { type: 'integer', description: 'scenarios from earlier stages that passed at the previous stage and fail now' },
    diff_loc: { type: 'integer', description: 'non-test source lines added+removed vs previous stage (0 for stage 0)' },
    files_touched: { type: 'integer' },
    src_loc: { type: 'integer', description: 'total non-test source lines at this stage' },
    design_health: { type: 'integer', description: '1-5: how clean/coherent the design is at this stage (state modeling, duplication, special cases piling up)' },
  },
  required: ['stage', 'hidden_pass', 'hidden_total', 'regressions', 'diff_loc', 'files_touched', 'src_loc', 'design_health'],
}
const SIDE = {
  type: 'object',
  properties: {
    stages: { type: 'array', items: STAGE, minItems: 5, maxItems: 5 },
    bug_fixed: { type: 'boolean', description: 'planted bug fixed at the root (checked against the secret diff and hidden scenarios)' },
    bug_fix_introduced_regressions: { type: 'integer' },
    notes: { type: 'string' },
  },
  required: ['stages', 'bug_fixed', 'bug_fix_introduced_regressions', 'notes'],
}
const VERDICT = {
  type: 'object',
  properties: { X: SIDE, Y: SIDE, more_maintainable: { type: 'string', enum: ['X', 'Y', 'tie'] }, margin: { type: 'string', enum: ['large', 'small', 'none'] }, summary: { type: 'string' } },
  required: ['X', 'Y', 'more_maintainable', 'margin', 'summary'],
}

const stageDir = (task, v, k) => `${M}/${task.id}/${v}/t${k}`

phase('Plan tickets')
const results = await pipeline(
  args.tasks,
  (task) => agent(`Read the spec for task "${task.id}" in ${TASKS_FILE}. Two independent implementations exist at ${SRC}/${task.id}/a and ${SRC}/${task.id}/b. Read both (do not modify them) so that everything you write applies to both equally.

Write a maintainability plan that simulates the codebase living on for a few months:
- base_scenarios: hidden acceptance checks for the original spec, written against the SPEC (behavior), not either API.
- tickets: 4 realistic follow-up change requests, applied in order. Each builds on the previous ones and changes core behavior: new states or modes, new rules, interactions between features, new edge cases. Together they should stress the design. Avoid renames, getters and logging. Each ticket has its own behavioral scenarios, consistent with all earlier tickets.`, { label: `plan:${task.id}`, phase: 'Plan tickets', schema: TICKETS }),

  (plan, task) => parallel(['a', 'b'].map((v) => async () => {
    for (let k = 1; k <= N; k++) {
      const prev = k === 1 ? `${SRC}/${task.id}/${v}` : stageDir(task, v, k - 1)
      const dir = stageDir(task, v, k)
      const r = await agent(`First copy ${prev} to ${dir} (\`mkdir -p\` the parent, then \`cp -r\`; ${EXCLUDE}). Then work ONLY inside ${dir}, and never touch ${prev}.

You're maintaining this codebase. Change request:
${plan.tickets[k - 1].ticket}

Implement it, keep all existing tests passing, and add tests for the new behavior. Reply with a short summary of what you changed.`, { label: `ticket:${task.id}:${v}:${k}`, phase: 'Grow', model: 'sonnet' })
      if (r === null) return false
    }
    return true
  })).then((grown) => ({ plan, grown })),

  ({ plan, grown }, task) => agent(`Two codebases for the same spec (task "${task.id}" in ${TASKS_FILE}) have each received the same 4 change requests:
${plan.tickets.map((t, k) => `${k + 1}. ${t.ticket}`).join('\n')}
The grown codebases are at ${stageDir(task, 'a', N)} and ${stageDir(task, 'b', N)}. Read both, including their tests. Do not modify them.

Design a bug-hunt and mutation test that is HARD:
- bug_candidates: 3 alternative subtle behavioral bugs, preferably in logic added or changed by the tickets or in how tickets interact. Each must be plantable at the equivalent place in both codebases, and each should be a behavior their existing tests do NOT check (read the tests to make sure).
- symptom_reports: what a user would report for each, with no hint of the location.
- mutations: 10 subtle behavior-level mutations (boundary off-by-ones, a dropped edge case, a wrong interaction between features, an event ignored in one state).`, { label: `bugplan:${task.id}`, phase: 'Plan bug', schema: BUGPLAN })
    .then((bugplan) => ({ plan, grown, bugplan })),

  ({ plan, grown, bugplan }, task) => parallel(['a', 'b'].map((v) => () => agent(`Prepare a hard bug-hunt on the grown codebase at ${stageDir(task, v, N)}. Never modify that directory. ${EXCLUDE}

1. Copy it to ${M}/${task.id}/${v}/bug and to ${M}/${task.id}/secret/${v}-mut.
2. Plant a bug in ${M}/${task.id}/${v}/bug with the smallest natural-looking source edit (no comments, no hints, no backup files). Try the candidates in order:
${bugplan.bug_candidates.map((c, i) => `   ${i}. ${c}`).join('\n')}
   After planting, run the full test suite. If the existing tests catch it, revert and try the next candidate. Use the first candidate the tests do NOT catch, or if every candidate is caught, keep the first one and set caught_by_existing_tests=true. Save the final planted change as a unified diff to ${M}/${task.id}/secret/${v}-bug.diff.
3. Mutation testing in ${M}/${task.id}/secret/${v}-mut: for each mutation, make the smallest source edit (never tests), run the suite, record killed if any test fails or the build breaks, then revert. Set applied=false if it can't be meaningfully applied.
${bugplan.mutations.map((m, i) => `   ${i + 1}. ${m}`).join('\n')}`, { label: `setup:${task.id}:${v}`, phase: 'Setup', schema: SETUP })))
    .then((setups) => ({ plan, grown, bugplan, setups })),

  (ctx, task) => parallel(['a', 'b'].map((v, i) => () => agent(`You're maintaining the codebase at ${M}/${task.id}/${v}/bug. Work only inside that directory.

A user reported this bug:
"${ctx.bugplan.symptom_reports[ctx.setups[i] ? ctx.setups[i].candidate_used : 0]}"

Find the root cause and fix it, then add a regression test. Reply with the root cause and the fix.`, { label: `hunt:${task.id}:${v}`, phase: 'Hunt', model: 'sonnet' })))
    .then(() => ctx),

  ({ plan, bugplan, setups }, task, i) => {
    const flip = i % 2 === 1
    const map = { X: flip ? 'b' : 'a', Y: flip ? 'a' : 'b' }
    const dirs = (s) => `original ${SRC}/${task.id}/${map[s]}; stages ${[1, 2, 3, 4].map((k) => stageDir(task, map[s], k)).join(', ')}; after bug hunt ${M}/${task.id}/${map[s]}/bug; planted bug diff ${M}/${task.id}/secret/${map[s]}-bug.diff`
    return agent(`You are judging how MAINTAINABLE two codebases (same spec: task "${task.id}" in ${TASKS_FILE}) proved over a simulated few months. Fresh maintainers applied the same 4 tickets in sequence to each, and then another maintainer hunted a planted bug. Never modify any of these directories. Do all test work in copies under ${M}/${task.id}/judge/. ${EXCLUDE}

X: ${dirs('X')}
Y: ${dirs('Y')}

Tickets, in order:
${plan.tickets.map((t, k) => `${k + 1}. ${t.ticket}`).join('\n')}

Base scenarios:
${plan.base_scenarios.map((s, k) => `B${k + 1}. ${s}`).join('\n')}
${plan.tickets.map((t, k) => `Ticket ${k + 1} scenarios:\n${t.scenarios.map((s, j) => `T${k + 1}.${j + 1}. ${s}`).join('\n')}`).join('\n')}

For each side and each stage (0 = original, then 1-4): write hidden tests for the base scenarios plus every ticket scenario up to that stage, adapted to that side's API, and run them against that stage. A later ticket may intentionally change behavior an earlier scenario checks; in that case use the newer behavior and don't count it as a regression. Record pass/total, regressions against the previous stage, the size of the source diff from the previous stage, the files touched, total source size, and design health (1-5).
Then check the bug hunt: was the planted bug (see the diff) fixed at the root, and did the fix break any scenario?
Decide which codebase proved more maintainable over time. Weight correctness at every stage, regressions, a bug fixed correctly, diff size per ticket, and whether design health held up or decayed.`, { label: `judge:${task.id}`, phase: 'Judge', schema: VERDICT })
      .then((v) => v && ({ id: task.id, map, plan, bugplan, setups, verdict: v }))
  },
)
const done = results.filter(Boolean)
log(`${done.length}/${args.tasks.length} tasks judged`)
return done