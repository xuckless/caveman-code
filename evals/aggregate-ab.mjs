import { readFileSync, writeFileSync } from 'node:fs'
const rows = JSON.parse(readFileSync(process.argv[2], 'utf8')).result
const K = ['correctness','declarative','explicit_state','simplicity','no_duplication','no_single_use_helpers','tests_quality']
const side = (r, v) => r.verdict[r.map.X === v ? 'X' : 'Y']
const win = r => r.verdict.winner === 'tie' ? 'tie' : r.map[r.verdict.winner]
const sum = { a: Object.fromEntries(K.map(k => [k, 0])), b: Object.fromEntries(K.map(k => [k, 0])) }
const tally = { a: 0, b: 0, tie: 0 }, loc = { a: 0, b: 0 }, tloc = { a: 0, b: 0 }, pass = { a: 0, b: 0 }
const lines = []
for (const r of rows) {
  const w = win(r); tally[w]++
  for (const v of ['a','b']) { const s = side(r, v); K.forEach(k => sum[v][k] += s.scores[k]); loc[v] += s.src_loc; tloc[v] += s.test_loc; pass[v] += s.tests_pass ? 1 : 0 }
  const A = side(r,'a'), B = side(r,'b')
  lines.push(`${r.id.padEnd(26)} win=${w.padEnd(3)} ${r.verdict.margin.padEnd(5)} loc ${String(A.src_loc).padStart(4)}→${String(B.src_loc).padStart(4)}  corr ${A.scores.correctness}→${B.scores.correctness}  decl ${A.scores.declarative}→${B.scores.declarative}  state ${A.scores.explicit_state}→${B.scores.explicit_state}  simp ${A.scores.simplicity}→${B.scores.simplicity}  tests ${A.scores.tests_quality}→${B.scores.tests_quality}`)
}
const n = rows.length
console.log(lines.join('\n'))
console.log(`\nwins: a=${tally.a} b=${tally.b} tie=${tally.tie}  | tests pass a=${pass.a}/${n} b=${pass.b}/${n}`)
console.log(`src loc a=${loc.a} b=${loc.b} (${Math.round(100*(loc.b-loc.a)/loc.a)}%)  test loc a=${tloc.a} b=${tloc.b}`)
for (const k of K) console.log(`${k.padEnd(22)} a=${(sum.a[k]/n).toFixed(2)} b=${(sum.b[k]/n).toFixed(2)}`)
// dump per-task detail with sides relabeled
const detail = rows.map(r => ({ id: r.id, winner: win(r), margin: r.verdict.margin, summary: r.verdict.summary,
  a_violations: side(r,'a').violations, b_violations: side(r,'b').violations,
  bad_examples: r.verdict.bad_examples.map(e => ({ ...e, side: r.map[e.side] })) }))
writeFileSync('eval2-detail.json', JSON.stringify(detail, null, 1))
