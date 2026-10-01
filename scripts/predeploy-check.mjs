import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const failures = []
const warnings = []

function pass(label) {
  console.log(`✓ ${label}`)
}

function fail(label, detail) {
  failures.push({ label, detail })
  console.error(`✗ ${label}`)
  if (detail) console.error(`  ${detail}`)
}

function warn(label, detail) {
  warnings.push({ label, detail })
  console.warn(`! ${label}`)
  if (detail) console.warn(`  ${detail}`)
}

console.log('Garage predeploy checks\n')

try {
  execSync('npx tsc --noEmit', { cwd: root, stdio: 'pipe' })
  pass('TypeScript (tsc --noEmit)')
} catch (e) {
  fail('TypeScript (tsc --noEmit)', String(e.stderr ?? e.stdout ?? e.message))
}

const wranglerPath = resolve(root, 'wrangler.jsonc')
if (!existsSync(wranglerPath)) {
  fail('wrangler.jsonc exists')
} else {
  pass('wrangler.jsonc present')
  const raw = readFileSync(wranglerPath, 'utf8')
  if (!raw.includes('garage.bartonhome.dev')) {
    warn('Custom route', 'garage.bartonhome.dev not found in wrangler.jsonc')
  } else {
    pass('Custom route garage.bartonhome.dev configured')
  }
  if (!raw.includes('nodejs_compat')) {
    fail('Worker compatibility', 'nodejs_compat flag missing')
  } else {
    pass('nodejs_compat enabled')
  }
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
if (!pkg.dependencies?.['@clerk/react']) {
  fail('@clerk/react dependency', 'Required for production client build')
} else {
  pass('@clerk/react declared (client build)')
}

for (const migration of ['0000_initial.sql', '0001_vehicle_assets.sql']) {
  const path = resolve(root, 'drizzle', migration)
  if (existsSync(path)) pass(`Migration file ${migration}`)
  else fail(`Migration file ${migration}`, 'Missing from drizzle/')
}

if (!process.env.DATABASE_URL?.trim()) {
  warn(
    'DATABASE_URL',
    'Not set in this shell — run pnpm db:migrate against prod Neon before first deploy',
  )
} else {
  try {
    execSync('pnpm db:migrate', { cwd: root, stdio: 'pipe' })
    pass('Database migrations (pnpm db:migrate)')
  } catch (e) {
    fail('Database migrations', String(e.stderr ?? e.stdout ?? e.message))
  }
}

for (const secret of ['CLOUDFLARE_API_TOKEN', 'VITE_CLERK_PUBLISHABLE_KEY']) {
  if (process.env[secret]?.trim()) pass(`Env ${secret} set (CI/local deploy)`)
  else
    warn(
      `Env ${secret}`,
      'Unset — required for GitHub Actions deploy or local wrangler deploy',
    )
}

console.log('')
if (warnings.length) {
  console.log(`Warnings: ${warnings.length}`)
}
if (failures.length) {
  console.error(`\nFailed: ${failures.length} blocking check(s)`)
  process.exit(1)
}
console.log('\nAll blocking checks passed.')
if (warnings.length) {
  console.log('Resolve warnings before production deploy (secrets, Neon, Clerk dashboard).')
}
