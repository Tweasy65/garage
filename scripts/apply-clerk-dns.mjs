/**
 * Create Clerk production CNAMEs on bartonhome.dev as DNS-only (not proxied).
 * Proxied records fail Clerk's DNS check.
 *
 * Requires CLOUDFLARE_API_TOKEN with Zone DNS Write on bartonhome.dev.
 */
const ZONE_NAME = 'bartonhome.dev'

const RECORDS = [
  {
    name: 'clerk.garage.bartonhome.dev',
    content: 'frontend-api.clerk.services',
  },
  {
    name: 'accounts.garage.bartonhome.dev',
    content: 'accounts.clerk.services',
  },
  {
    name: 'clkmail.garage.bartonhome.dev',
    content: 'mail.yhr5sm7qnye1.clerk.services',
  },
  {
    name: 'clk._domainkey.garage.bartonhome.dev',
    content: 'dkim1.yhr5sm7qnye1.clerk.services',
  },
  {
    name: 'clk2._domainkey.garage.bartonhome.dev',
    content: 'dkim2.yhr5sm7qnye1.clerk.services',
  },
]

const token = process.env.CLOUDFLARE_API_TOKEN?.trim()
if (!token) {
  console.error('CLOUDFLARE_API_TOKEN is required')
  process.exit(1)
}

function fqdn(name) {
  return name.replace(/\.$/, '').toLowerCase()
}

async function cf(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.success) {
    const err = json.errors?.[0]
    const message = err
      ? `${err.code} ${err.message}`
      : `${res.status} ${res.statusText}`
    throw new Error(`${method} ${path}: ${message}`)
  }
  return json
}

async function listCnameRecords(zoneId) {
  const records = []
  let page = 1
  for (;;) {
    const json = await cf(
      `/zones/${zoneId}/dns_records?type=CNAME&per_page=100&page=${page}`,
    )
    records.push(...(json.result ?? []))
    const info = json.result_info
    if (!info || page >= (info.total_pages ?? 1)) break
    page += 1
  }
  return records
}

const zones = await cf(`/zones?name=${encodeURIComponent(ZONE_NAME)}`)
const zone = zones.result?.[0]
if (!zone) {
  throw new Error(`Zone ${ZONE_NAME} not found for this API token`)
}

console.log(`Zone ${ZONE_NAME} (${zone.id})`)

const existing = await listCnameRecords(zone.id)

for (const rec of RECORDS) {
  const payload = {
    type: 'CNAME',
    name: rec.name,
    content: rec.content,
    proxied: false,
    ttl: 1,
    comment: 'Clerk production for garage',
  }
  const found = existing.find((r) => fqdn(r.name) === fqdn(rec.name))
  if (!found) {
    await cf(`/zones/${zone.id}/dns_records`, { method: 'POST', body: payload })
    console.log(`${rec.name} created DNS-only -> ${rec.content}`)
    continue
  }
  const sameTarget = found.content === rec.content
  const dnsOnly = found.proxied === false
  if (sameTarget && dnsOnly) {
    console.log(`${rec.name} already DNS-only -> ${rec.content}`)
    continue
  }
  await cf(`/zones/${zone.id}/dns_records/${found.id}`, {
    method: 'PATCH',
    body: payload,
  })
  console.log(`${rec.name} updated DNS-only -> ${rec.content}`)
}

console.log('Clerk DNS records applied.')
