import { readFileSync, existsSync } from 'node:fs'
const J = process.argv[3]   // workflow transcript dir (printed when the run finishes)
const rows = JSON.parse(readFileSync(process.argv[2], 'utf8')).result   // argv[2]: workflow output file
const started = readFileSync(J + '/journal.jsonl', 'utf8').trim().split('\n').map(JSON.parse).filter(e => e.type === 'started')
const cost = label => {
  const s = started.find(e => e.label === label); const f = `${J}/agent-${s.agentId}.jsonl`
  let out = 0, tools = 0, ctx = 0
  for (const line of readFileSync(f, 'utf8').trim().split('\n')) {
    const m = JSON.parse(line).message; if (!m || m.role !== 'assistant') continue
    if (m.usage) { out += m.usage.output_tokens; ctx = Math.max(ctx, m.usage.input_tokens + m.usage.cache_read_input_tokens + m.usage.cache_creation_input_tokens) }
    if (Array.isArray(m.content)) tools += m.content.filter(c => c.type === 'tool_use').length
  }
  return { out, tools, ctx }
}
const T = { a: {}, b: {} }; const add = (v, k, n) => T[v][k] = (T[v][k] || 0) + n
const wins = { a: 0, b: 0, tie: 0 }
console.log('task                   win  | feat tok a/b  tools a/b | hunt tok a/b tools a/b | bugfix a/b | regress a/b | featdiff a/b | hidden-feat a/b | mut a/b | caught a/b')
for (const r of rows) {
  const side = v => r.verdict[r.map.X === v ? 'X' : 'Y']
  const w = r.verdict.more_maintainable === 'tie' ? 'tie' : r.map[r.verdict.more_maintainable]; wins[w]++
  const c = {}; for (const v of ['a', 'b']) { c[v] = { f: cost(`feature:${r.id}:${v}`), h: cost(`hunt:${r.id}:${v}`) } }
  const mut = v => { const s = r.setups[v === 'a' ? 0 : 1]; const ap = s.mutations.filter(m => m.applied); return [ap.filter(m => m.killed).length, ap.length] }
  for (const v of ['a', 'b']) {
    const s = side(v), [k, n] = mut(v)
    add(v, 'featOut', c[v].f.out); add(v, 'featTools', c[v].f.tools); add(v, 'huntOut', c[v].h.out); add(v, 'huntTools', c[v].h.tools)
    add(v, 'bugFixed', s.bug_fixed ? 1 : 0); add(v, 'regress', s.regressions_after_feature); add(v, 'featDiff', s.feature_diff_loc)
    add(v, 'hfPass', s.hidden_after_feature.pass); add(v, 'hfTotal', s.hidden_after_feature.total); add(v, 'hoPass', s.hidden_original.pass); add(v, 'hoTotal', s.hidden_original.total)
    add(v, 'mutK', k); add(v, 'mutN', n); add(v, 'caught', r.setups[v === 'a' ? 0 : 1].bug_caught_by_existing_tests ? 1 : 0); add(v, 'fq', s.feature_quality)
  }
  const A = side('a'), B = side('b')
  console.log(`${r.id.padEnd(22)} ${w.padEnd(4)} | ${String(c.a.f.out).padStart(6)}/${String(c.b.f.out).padEnd(6)} ${String(c.a.f.tools).padStart(3)}/${String(c.b.f.tools).padEnd(3)} | ${String(c.a.h.out).padStart(6)}/${String(c.b.h.out).padEnd(6)} ${String(c.a.h.tools).padStart(2)}/${String(c.b.h.tools).padEnd(2)} | ${A.bug_fixed ? 'Y' : 'n'}/${B.bug_fixed ? 'Y' : 'n'} | ${A.regressions_after_feature}/${B.regressions_after_feature} | ${A.feature_diff_loc}/${B.feature_diff_loc} | ${A.hidden_after_feature.pass}/${A.hidden_after_feature.total} vs ${B.hidden_after_feature.pass}/${B.hidden_after_feature.total} | ${mut('a').join('/')} vs ${mut('b').join('/')} | ${r.setups[0].bug_caught_by_existing_tests ? 'Y' : 'n'}/${r.setups[1].bug_caught_by_existing_tests ? 'Y' : 'n'}`)
}
console.log('\nmore maintainable:', wins)
for (const v of ['a', 'b']) { const t = T[v]; console.log(v, `feature: ${t.featOut} out-tokens, ${t.featTools} tool calls, diff ${t.featDiff} loc, quality ${(t.fq/10).toFixed(1)}, regressions ${t.regress} | hunt: ${t.huntOut} out-tokens, ${t.huntTools} tool calls, fixed ${t.bugFixed}/10, caught by own tests ${t.caught}/10 | hidden orig ${t.hoPass}/${t.hoTotal} (${(100*t.hoPass/t.hoTotal).toFixed(0)}%), hidden after feature ${t.hfPass}/${t.hfTotal} (${(100*t.hfPass/t.hfTotal).toFixed(0)}%) | mutation kill ${t.mutK}/${t.mutN} (${(100*t.mutK/t.mutN).toFixed(0)}%)`) }
