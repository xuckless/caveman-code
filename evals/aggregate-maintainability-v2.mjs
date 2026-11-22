import { readFileSync } from 'node:fs'
const J = process.argv[3]
const rows = JSON.parse(readFileSync(process.argv[2], 'utf8')).result
const started = readFileSync(J + '/journal.jsonl', 'utf8').trim().split('\n').map(JSON.parse).filter(e => e.type === 'started')
const cost = label => {
  const s = started.find(e => e.label === label); let out = 0, tools = 0
  for (const line of readFileSync(`${J}/agent-${s.agentId}.jsonl`, 'utf8').trim().split('\n')) {
    const m = JSON.parse(line).message; if (!m || m.role !== 'assistant') continue
    if (m.usage) out += m.usage.output_tokens
    if (Array.isArray(m.content)) tools += m.content.filter(c => c.type === 'tool_use').length
  }
  return { out, tools }
}
const T = { a: { tok: [0,0,0,0], tools: [0,0,0,0], health: [0,0,0,0,0], loc: [0,0,0,0,0], diff: [0,0,0,0,0], pass: [0,0,0,0,0], total: [0,0,0,0,0], reg: 0, fixed: 0, caught: 0, mk: 0, mn: 0, hunt: 0, huntTools: 0, fixReg: 0 }, b: null }
T.b = JSON.parse(JSON.stringify(T.a))
const wins = { a: 0, b: 0, tie: 0 }
for (const r of rows) {
  const w = r.verdict.more_maintainable === 'tie' ? 'tie' : r.map[r.verdict.more_maintainable]; wins[w]++
  const line = [r.id.padEnd(20), ('win=' + w).padEnd(8), r.verdict.margin.padEnd(6)]
  for (const v of ['a', 'b']) {
    const s = r.verdict[r.map.X === v ? 'X' : 'Y'], t = T[v], st = r.setups[v === 'a' ? 0 : 1]
    for (let k = 1; k <= 4; k++) { const c = cost(`ticket:${r.id}:${v}:${k}`); t.tok[k-1] += c.out; t.tools[k-1] += c.tools }
    const h = cost(`hunt:${r.id}:${v}`); t.hunt += h.out; t.huntTools += h.tools
    s.stages.forEach((g, k) => { t.health[k] += g.design_health; t.loc[k] += g.src_loc; t.diff[k] += g.diff_loc; t.pass[k] += g.hidden_pass; t.total[k] += g.hidden_total; t.reg += g.regressions })
    t.fixed += s.bug_fixed ? 1 : 0; t.fixReg += s.bug_fix_introduced_regressions; t.caught += st.caught_by_existing_tests ? 1 : 0
    const ap = st.mutations.filter(m => m.applied); t.mk += ap.filter(m => m.killed).length; t.mn += ap.length
    line.push(`${v}: health ${s.stages.map(g => g.design_health).join('')} loc ${s.stages[0].src_loc}→${s.stages[4].src_loc} hidden@4 ${s.stages[4].hidden_pass}/${s.stages[4].hidden_total} reg ${s.stages.reduce((a, g) => a + g.regressions, 0)} bug ${s.bug_fixed ? 'fixed' : 'MISSED'}${st.caught_by_existing_tests ? '(caught)' : ''} mut ${ap.filter(m => m.killed).length}/${ap.length}`)
  }
  console.log(line.join(' | '))
}
console.log('\nmore maintainable:', wins)
for (const v of ['a', 'b']) {
  const t = T[v]
  console.log(`\n${v}: ticket output tokens per stage ${t.tok.join(' / ')} (total ${t.tok.reduce((a, b) => a + b)}), tool calls ${t.tools.join('/')} (total ${t.tools.reduce((a, b) => a + b)})`)
  console.log(`   design health avg per stage ${t.health.map(h => (h / rows.length).toFixed(1)).join(' → ')}`)
  console.log(`   total src loc per stage ${t.loc.join(' → ')}; diff loc per ticket ${t.diff.slice(1).join('/')} (total ${t.diff.reduce((a, b) => a + b)})`)
  console.log(`   hidden pass per stage ${t.pass.map((p, k) => `${p}/${t.total[k]}`).join(' ')} ; regressions ${t.reg}`)
  console.log(`   hunt: fixed ${t.fixed}/${rows.length}, fix regressions ${t.fixReg}, caught by existing tests ${t.caught}/${rows.length}, ${t.hunt} tokens ${t.huntTools} tools | mutation kill ${t.mk}/${t.mn} (${(100 * t.mk / t.mn).toFixed(0)}%)`)
}
