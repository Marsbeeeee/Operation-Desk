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
const missingRequiredMarker = tools
  .filter(tool => requiredToolIds.includes(tool.id) && tool.required !== true)
  .map(tool => tool.id)
const missingSkillName = tools
  .filter(tool => ['badcase-detect-agent', 'eval-sop-skill'].includes(tool.id) && !tool.skillName)
  .map(tool => tool.id)
const missingTeamTarget = tools
  .filter(tool => requiredToolIds.includes(tool.id) && !tool.skillName && !tool.repoUrl && !tool.url)
  .map(tool => tool.id)
const duplicateIds = tools
  .map(tool => tool.id)
  .filter((id, index, allIds) => allIds.indexOf(id) !== index)

if (missing.length > 0 || missingRequiredMarker.length > 0 || missingSkillName.length > 0 || missingTeamTarget.length > 0 || duplicateIds.length > 0) {
  if (missing.length > 0) {
    console.error(`Missing required tools: ${missing.join(', ')}`)
  }
  if (missingRequiredMarker.length > 0) {
    console.error(`Required tools without required=true: ${missingRequiredMarker.join(', ')}`)
  }
  if (missingSkillName.length > 0) {
    console.error(`Skill tools without skillName: ${missingSkillName.join(', ')}`)
  }
  if (missingTeamTarget.length > 0) {
    console.error(`Team-visible tools without repoUrl/url: ${missingTeamTarget.join(', ')}`)
  }
  if (duplicateIds.length > 0) {
    console.error(`Duplicate tool ids: ${[...new Set(duplicateIds)].join(', ')}`)
  }
  process.exit(1)
}

console.log(`Tool config OK: ${requiredToolIds.length} required tools present, ${tools.length} total tools.`)
