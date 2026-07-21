import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const requiredToolIds = [
  'badcase-detect-agent',
  'data-viewer',
  'eval-llm-wiki',
  'eval-sop-skill',
  'codex-usage-dashboard',
]

const configPath = resolve(process.cwd(), 'automation.config.json')
const config = JSON.parse(await readFile(configPath, 'utf8'))
const tools = Array.isArray(config.tools) ? config.tools : []
const ids = new Set(tools.map(tool => tool.id))
const missing = requiredToolIds.filter(id => !ids.has(id))
const duplicateIds = tools
  .map(tool => tool.id)
  .filter((id, index, allIds) => allIds.indexOf(id) !== index)

if (missing.length > 0 || duplicateIds.length > 0) {
  if (missing.length > 0) {
    console.error(`Missing required tools: ${missing.join(', ')}`)
  }
  if (duplicateIds.length > 0) {
    console.error(`Duplicate tool ids: ${[...new Set(duplicateIds)].join(', ')}`)
  }
  process.exit(1)
}

console.log(`Tool config OK: ${requiredToolIds.length} required tools present, ${tools.length} total tools.`)
