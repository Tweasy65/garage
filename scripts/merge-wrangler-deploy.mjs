import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const rootDir = resolve(import.meta.dirname, '..')
const distPath = resolve(rootDir, 'dist/server/wrangler.json')
const rootPath = resolve(rootDir, 'wrangler.jsonc')

function stripJsonComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/[^\n]*/gm, '')
}

function parseRootWrangler() {
  if (!existsSync(rootPath)) return {}
  const raw = readFileSync(rootPath, 'utf8')
  try {
    return JSON.parse(stripJsonComments(raw))
  } catch (e) {
    console.warn('[merge-wrangler-deploy] Could not parse wrangler.jsonc', e)
    return {}
  }
}

if (!existsSync(distPath)) {
  console.error('[merge-wrangler-deploy] Missing', distPath, '— run vite build first.')
  process.exit(1)
}

const dist = JSON.parse(readFileSync(distPath, 'utf8'))
const root = parseRootWrangler()

const rootVars = root.vars
if (rootVars && typeof rootVars === 'object' && !Array.isArray(rootVars)) {
  dist.vars = { ...(dist.vars ?? {}), ...rootVars }
}

if (
  dist.vars &&
  typeof dist.vars === 'object' &&
  !Array.isArray(dist.vars) &&
  Object.keys(dist.vars).length === 0
) {
  delete dist.vars
}

writeFileSync(distPath, JSON.stringify(dist, null, 2) + '\n')
console.log('[merge-wrangler-deploy] Updated', distPath)
