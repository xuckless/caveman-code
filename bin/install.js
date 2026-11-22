#!/usr/bin/env node
// Copies every skill in ../skills into each chosen agent's skills directory.
// Agents are data: to support a new one, add one row.
import { cpSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILLS_SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills')
const SKILLS = readdirSync(SKILLS_SRC)
const HOME = homedir()

// All of these read the Agent Skills format (a folder holding SKILL.md); only the paths differ.
const AGENTS = {
  claude:      { user: join(HOME, '.claude', 'skills'),            project: join('.claude', 'skills') },
  codex:       { user: join(HOME, '.agents', 'skills'),            project: join('.agents', 'skills') },
  cursor:      { user: join(HOME, '.cursor', 'skills'),            project: join('.cursor', 'skills') },
  copilot:     { user: join(HOME, '.copilot', 'skills'),           project: join('.github', 'skills') },
  windsurf:    { user: join(HOME, '.codeium', 'windsurf', 'skills'), project: join('.windsurf', 'skills') },
  antigravity: { user: join(HOME, '.gemini', 'config', 'skills'),  project: join('.agents', 'skills') },
}

const COMMANDS = {
  install(dir) {
    for (const s of SKILLS) cpSync(join(SKILLS_SRC, s), join(dir, s), { recursive: true, force: true })
    console.log(`installed ${SKILLS.join(', ')} → ${dir}`)
  },
  uninstall(dir) {
    const present = SKILLS.filter(s => existsSync(join(dir, s)))
    for (const s of present) rmSync(join(dir, s), { recursive: true })
    console.log(present.length ? `removed ${present.join(', ')} from ${dir}` : `nothing installed in ${dir}`)
  },
}

const USAGE = `usage: caveman-code [install|uninstall] [--project] [--agent ${Object.keys(AGENTS).join(',')}|all]
  default: install, user scope, --agent claude`

const args = process.argv.slice(2)
const flag = name => { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1] }

if (args.includes('-h') || args.includes('--help')) { console.log(USAGE); process.exit(0) }

const command = args.find(a => a in COMMANDS) ?? 'install'
const scope = args.includes('--project') ? 'project' : 'user'
const agentArg = flag('--agent') ?? 'claude'
const agents = agentArg === 'all' ? Object.keys(AGENTS) : agentArg.split(',')

const unknown = agents.filter(a => !(a in AGENTS))
if (unknown.length) { console.error(`unknown agent: ${unknown.join(', ')}\n${USAGE}`); process.exit(1) }

// Several agents share a directory (e.g. .agents/skills), so install there only once.
const dirs = new Set(agents.map(a => AGENTS[a][scope]))
for (const dir of dirs) COMMANDS[command](dir)
