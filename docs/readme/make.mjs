// Generates the README SVGs. Run: node docs/readme/make.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = dirname(fileURLToPath(import.meta.url))
const write = (name, svg) => writeFileSync(join(OUT, name), svg.trim() + '\n')
const MONO = `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace`
const SANS = `-apple-system, 'Segoe UI', Inter, Roboto, 'Helvetica Neue', Arial, sans-serif`
const T = { bg: '#1f2335', bar: '#1a1b26', line: '#2f3449', text: '#c0caf5', muted: '#8089b3', blue: '#7aa2f7', red: '#f7768e', green: '#9ece6a', orange: '#ff9e64', purple: '#bb9af7', dim: '#3b4261' }
const REDUCED = `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`

// ---------- banner: six agent cavemen + carved wordmark ----------

const THEMES = {
  light: { stone: '#7a6a58', shade: '#3e342a', label: '#6b6257', skin: '#e9b98f', hair: '#3a2a1e', stroke: '#2b211a' },
  dark:  { stone: '#d4c2a4', shade: '#5a4a39', label: '#a9a091', skin: '#e9b98f', hair: '#2a1d14', stroke: '#1a130e' },
}

// Agent nods: tunic colour + a small original glyph on a chest badge. Not the real logos.
const AGENTS = [
  { name: 'claude',   tunic: '#D97757', glyph: 'burst' },
  { name: 'codex',    tunic: '#9aa0a6', glyph: 'prompt' },
  { name: 'cursor',   tunic: '#4a4f5e', glyph: 'arrow' },
  { name: 'copilot',  tunic: '#8957e5', glyph: 'goggles' },
  { name: 'gemini',   tunic: '#4285f4', glyph: 'sparkle' },
  { name: 'windsurf', tunic: '#0fb5a4', glyph: 'wave' },
]

const GLYPHS = {
  burst: [...Array(8)].map((_, i) => { const a = (i * Math.PI) / 4; return `<line x1="${(50 + 2.5 * Math.cos(a)).toFixed(1)}" y1="${(108 + 2.5 * Math.sin(a)).toFixed(1)}" x2="${(50 + 7 * Math.cos(a)).toFixed(1)}" y2="${(108 + 7 * Math.sin(a)).toFixed(1)}" stroke="#D97757" stroke-width="2.4" stroke-linecap="round"/>` }).join(''),
  prompt: `<path d="M44.5 104 L48.5 108 L44.5 112" fill="none" stroke="#1f2335" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="50.5" y1="112.5" x2="56" y2="112.5" stroke="#1f2335" stroke-width="2.2" stroke-linecap="round"/>`,
  arrow: `<path d="M46 101.5 L46 114 L49.3 110.8 L51.6 115.6 L53.6 114.6 L51.4 110 L56 110 Z" fill="#1f2335"/>`,
  goggles: `<path d="M50 108 m-8 0 a3.6 3.6 0 1 0 7.2 0 a3.6 3.6 0 1 0 -7.2 0 M50.8 108 a3.6 3.6 0 1 0 7.2 0 a3.6 3.6 0 1 0 -7.2 0" fill="#bb9af7" stroke="#1f2335" stroke-width="1.6"/>`,
  sparkle: `<path d="M50 100 C 51 106, 52 107, 58 108 C 52 109, 51 110, 50 116 C 49 110, 48 109, 42 108 C 48 107, 49 106, 50 100 Z" fill="url(#gem)"/>`,
  wave: `<path d="M42.5 110 C 45 105, 48 105, 50 108.5 S 55 112, 57.5 106" fill="none" stroke="#0fb5a4" stroke-width="2.4" stroke-linecap="round"/>`,
}

function caveman(a, i, t) {
  const beard = i % 2 === 1
  const goggles = a.glyph === 'goggles'
  return `
<g transform="translate(${i * 112} 0)">
 <g class="bob" style="animation-delay:${(i * 0.23).toFixed(2)}s">
  <g class="club" style="animation-delay:${(i * 0.23).toFixed(2)}s">
   <path d="M70 99 L84 46" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
   <ellipse cx="86" cy="38" rx="11" ry="15" transform="rotate(16 86 38)" fill="#a0693a" stroke="${t.stroke}" stroke-width="2"/>
   <circle cx="82" cy="33" r="1.6" fill="${t.stroke}" opacity=".5"/><circle cx="90" cy="44" r="1.4" fill="${t.stroke}" opacity=".5"/>
  </g>
  <path d="M30 96 L17 121" stroke="${t.skin}" stroke-width="8" stroke-linecap="round"/>
  <path d="M68 96 L72 99" stroke="${t.skin}" stroke-width="8" stroke-linecap="round"/>
  <rect x="37" y="128" width="8" height="15" rx="3" fill="${t.skin}"/><rect x="55" y="128" width="8" height="15" rx="3" fill="${t.skin}"/>
  <ellipse cx="40" cy="144" rx="8" ry="3.5" fill="${t.hair}"/><ellipse cx="60" cy="144" rx="8" ry="3.5" fill="${t.hair}"/>
  <path d="M29 90 Q50 80 71 90 L77 133 L70 127 L63 134 L56 127 L49 134 L42 127 L35 134 L28 127 L23 133 Z" fill="${a.tunic}" stroke="${t.stroke}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M31 91 L42 88 L64 131 L56 132 Z" fill="#000" opacity=".16"/>
  <circle cx="50" cy="108" r="9.5" fill="#f4efe6" stroke="${t.stroke}" stroke-width="1.6"/>
  ${GLYPHS[a.glyph]}
  <circle cx="50" cy="58" r="23" fill="${t.skin}" stroke="${t.stroke}" stroke-width="2"/>
  ${beard ? `<path d="M30 62 Q33 86 50 88 Q67 86 70 62 Q64 72 50 73 Q36 72 30 62 Z" fill="${t.hair}"/>` : ''}
  <path d="M27 54 Q24 34 36 33 L34 25 L43 31 L46 21 L52 30 L58 22 L60 31 L68 27 L66 35 Q77 38 73 54 Q70 42 50 41 Q30 42 27 54 Z" fill="${t.hair}"/>
  ${goggles
    ? `<path d="M30 46 H70" stroke="#5b3f8f" stroke-width="3"/><circle cx="41" cy="46" r="6.5" fill="#bb9af7" stroke="${t.stroke}" stroke-width="2"/><circle cx="59" cy="46" r="6.5" fill="#bb9af7" stroke="${t.stroke}" stroke-width="2"/><circle cx="39" cy="44" r="1.8" fill="#fff" opacity=".8"/><circle cx="57" cy="44" r="1.8" fill="#fff" opacity=".8"/>`
    : `<path d="M35 51 Q42 47 49 51 M51 51 Q58 47 65 51" stroke="${t.hair}" stroke-width="4" stroke-linecap="round" fill="none"/>`}
  <circle cx="42" cy="57" r="2.6" fill="${t.stroke}"/><circle cx="58" cy="57" r="2.6" fill="${t.stroke}"/>
  <ellipse cx="50" cy="63" rx="4" ry="3" fill="#d79c72"/>
  <path d="M40 68 Q50 77 60 68 Z" fill="#5a2a1a" stroke="${t.stroke}" stroke-width="1.6" stroke-linejoin="round"/>
  <rect x="44" y="68" width="4" height="3.4" fill="#fff"/><rect x="52.5" y="68" width="4" height="3.4" fill="#fff"/>
 </g>
 <text x="50" y="164" text-anchor="middle" class="lbl">${a.name}</text>
</g>`
}

// Chunky carved letters on a 56-unit-tall grid: [advance, path]
const LETTERS = {
  C: [40, 'M35 7 H7 V49 H35'],
  A: [42, 'M4 51 L21 6 L38 51 M11 35 H31'],
  V: [42, 'M4 5 L21 50 L38 5'],
  E: [40, 'M35 7 H7 V49 H35 M7 28 H29'],
  M: [52, 'M6 51 V6 L26 31 L46 6 V51'],
  N: [42, 'M6 51 V6 L36 50 V5'],
  O: [42, 'M7 7 H35 V49 H7 Z'],
  D: [42, 'M7 7 H24 L35 17 V39 L24 49 H7 Z'],
}
function word(text, x0, y0, t) {
  let x = x0
  const strokes = []
  for (const ch of text) {
    if (ch === ' ') { x += 22; continue }
    const [adv, d] = LETTERS[ch]
    strokes.push(`<path transform="translate(${x} ${y0})" d="${d}"/>`)
    x += adv + 8
  }
  return { width: x - x0 - 8, svg: strokes.join('') }
}

function banner(theme) {
  const t = THEMES[theme]
  const W = 712
  const row = AGENTS.map((a, i) => caveman(a, i, t)).join('')
  const w = word('CAVEMAN CODE', 0, 0, t)
  const wx = (W - w.width) / 2
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 268" width="${W}" height="268" role="img" aria-label="Caveman Code: six cartoon cavemen, one per AI coding agent, above a stone-carved wordmark">
<title>Caveman Code</title>
<defs><linearGradient id="gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4285f4"/><stop offset=".6" stop-color="#9b72cb"/><stop offset="1" stop-color="#d96570"/></linearGradient></defs>
<style>
.lbl { font-family: ${MONO}; font-size: 12px; fill: ${t.label}; }
.bob { animation: bob 2.4s ease-in-out infinite; }
.club { transform-box: fill-box; transform-origin: 10% 95%; animation: swing 2.4s ease-in-out infinite; }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes swing { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(14deg); } }
${REDUCED}
</style>
<g transform="translate(20 4)">${row}</g>
<g transform="translate(${wx.toFixed(1)} 196)" fill="none" stroke-linecap="square" stroke-linejoin="bevel">
 <g transform="translate(3 4)" stroke="${t.shade}" stroke-width="13">${w.svg}</g>
 <g stroke="${t.stone}" stroke-width="13">${w.svg}</g>
</g>
</svg>`
}
write('logo-light.svg', banner('light'))
write('logo-dark.svg', banner('dark'))

// ---------- shared window frame ----------
const frame = (w, h, title, body, style = '') => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
<title>${title}</title>
<style>
text { font-family: ${MONO}; font-size: 12.5px; fill: ${T.text}; }
.m { fill: ${T.muted}; } .s { font-family: ${SANS}; font-size: 12px; }
* { transform-box: fill-box; }
${style}
${REDUCED}
</style>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10" fill="${T.bg}" stroke="${T.line}"/>
${body}
</svg>`

// ---------- state.svg: four booleans -> one status ----------
{
  const flags = ['isLoading', 'isError', 'hasData', 'isRetrying']
  // 4 frames of boolean values; frames 1 and 3 are impossible combinations
  const frames = [[1, 0, 0, 0], [1, 1, 1, 0], [0, 0, 1, 0], [0, 1, 1, 1]]
  const bad = [false, true, false, true]
  const D = 8 // seconds per cycle
  const css = frames.map((_, k) => `.f${k} { animation: show ${D}s steps(1) infinite; animation-delay: ${(k * D) / 4 - D}s; opacity: ${k === 1 ? 1 : 0}; }`).join('\n')
  const left = flags.map((f, r) => {
    const y = 64 + r * 22
    const vals = frames.map((fr, k) => `<text class="f${k}" x="186" y="${y}" text-anchor="end" style="fill:${fr[r] ? T.green : T.muted}">${fr[r] ? 'true' : 'false'}</text>`).join('')
    return `<text x="24" y="${y}">${f}</text>${vals}`
  }).join('')
  const verdicts = bad.map((b, k) => `<text class="f${k} s" x="105" y="170" text-anchor="middle" style="fill:${b ? T.red : T.green}">${b ? '✗ impossible state, still allowed' : '✓ valid'}</text>`).join('')
  const states = ['idle', 'loading', 'done', 'error']
  const colors = [T.muted, T.blue, T.green, T.red]
  const chips = states.map((s, k) => `<g class="f${k}"><rect x="290" y="72" width="164" height="34" rx="17" fill="${colors[k]}" opacity=".16"/><rect x="290.5" y="72.5" width="163" height="33" rx="16.5" fill="none" stroke="${colors[k]}"/><text x="372" y="94" text-anchor="middle">status: <tspan style="fill:${colors[k]}">'${s}'</tspan></text></g>`).join('')
  write('state.svg', frame(480, 196, 'Four booleans allow 16 combinations, most of them impossible; one status value allows only the 4 real states', `
<text class="s m" x="24" y="30">before: 4 booleans = 16 combos</text>
<text class="s m" x="290" y="30">after: 1 status = 4 states</text>
<line x1="240" y1="44" x2="240" y2="176" stroke="${T.line}"/>
${left}${verdicts}${chips}
<text class="s m" x="372" y="140" text-anchor="middle">every value is a real state</text>`,
  `@keyframes show { 0%, 24.9% { opacity: 1; } 25%, 100% { opacity: 0; } }\n${css}`))
}

// ---------- table.svg: branch ladder vs lookup ----------
{
  const ladder = [`if (r === 'us') return 5`, `else if (r === 'eu') return 8`, `else if (r === 'uk') return 7`, `else if (r === 'au') return 12`]
  const rows = [['us', 5], ['eu', 8], ['uk', 7], ['au', 12]]
  write('table.svg', frame(480, 196, 'Looking up uk: the if-else ladder checks branch after branch, the rates table goes straight to the row', `
<text class="s m" x="24" y="30">branches: read top to bottom</text>
<text class="s m" x="300" y="30">rows: look it up</text>
<line x1="276" y1="44" x2="276" y2="176" stroke="${T.line}"/>
<rect class="scan" x="16" y="49" width="252" height="22" rx="4" fill="${T.blue}" opacity=".18"/>
${ladder.map((l, i) => `<text x="24" y="${65 + i * 26}">${l}</text>`).join('')}
<text class="s m" x="24" y="176">region = 'uk'</text>
<text x="300" y="62" class="m">RATES = {</text>
${rows.map(([k, v], i) => `<text x="316" y="${86 + i * 22}">${k}: <tspan style="fill:${T.orange}">${v}</tspan>,</text>`).join('')}
<text x="300" y="176" class="m">}</text>
<rect class="hit" x="308" y="114" width="96" height="21" rx="4" fill="${T.green}" opacity=".22"/>
<text class="hitlbl s" x="414" y="130" style="fill:${T.green}">← 7</text>`,
  `.scan { animation: scan 6s infinite; }
@keyframes scan { 0% { transform: translateY(0); opacity: .18; } 15% { transform: translateY(0); } 30% { transform: translateY(26px); } 45% { transform: translateY(52px); } 70% { transform: translateY(52px); opacity: .18; } 80%, 100% { opacity: 0; } }
.hit, .hitlbl { animation: hit 6s infinite; }
@keyframes hit { 0%, 12% { opacity: 0; } 18%, 70% { opacity: .22; } 80%, 100% { opacity: 0; } }
.hitlbl { animation-name: hitlbl; }
@keyframes hitlbl { 0%, 12% { opacity: 0; } 18%, 70% { opacity: 1; } 80%, 100% { opacity: 0; } }`))
}

// ---------- evals.svg: measured results ----------
{
  const rows = [
    { label: 'wins, 30 tasks', a: 8, b: 21, max: 30, fmt: (v) => v },
    { label: 'source lines', a: 5266, b: 3170, max: 5266, fmt: (v) => v.toLocaleString('en-US') },
    { label: 'design health after 4 tickets', a: 3.0, b: 3.6, max: 5, fmt: (v) => v.toFixed(1) + ' / 5' },
    { label: 'judged more maintainable', a: 1, b: 9, max: 10, fmt: (v) => v + ' / 10' },
  ]
  const X0 = 214, BW = 200
  const body = rows.map((r, i) => {
    const y = 58 + i * 40
    const wa = (BW * r.a) / r.max, wb = (BW * r.b) / r.max
    return `<text class="s m" x="24" y="${y + 13}">${r.label}</text>
<rect class="grow" style="animation-delay:${i * 0.15}s" x="${X0}" y="${y}" width="${wa.toFixed(1)}" height="9" rx="2" fill="${T.dim}"/>
<rect class="grow" style="animation-delay:${i * 0.15 + 0.1}s" x="${X0}" y="${y + 12}" width="${wb.toFixed(1)}" height="9" rx="2" fill="${T.orange}"/>
<text x="${X0 + wa + 6}" y="${y + 8.5}" class="m" style="font-size:10.5px">${r.fmt(r.a)}</text>
<text x="${X0 + wb + 6}" y="${y + 20.5}" style="font-size:10.5px;fill:${T.orange}">${r.fmt(r.b)}</text>`
  }).join('')
  write('evals.svg', frame(480, 246, 'Eval results: with the skill, 21 of 30 tasks won, 40 percent less code, design health holds up better, judged more maintainable 9 of 10', `
<rect x="24" y="22" width="10" height="10" rx="2" fill="${T.dim}"/><text class="s m" x="40" y="31">without skill</text>
<rect x="134" y="22" width="10" height="10" rx="2" fill="${T.orange}"/><text class="s" x="150" y="31" style="fill:${T.orange}">with caveman-code</text>
${body}
<text class="s m" x="24" y="230">Sonnet builds, blind Opus judge, fresh maintainers without the skill</text>`,
  `.grow { transform-origin: left; animation: grow 1.2s cubic-bezier(.2,.8,.2,1) both; }
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }`))
}

console.log('wrote logo-light.svg logo-dark.svg state.svg table.svg evals.svg')
