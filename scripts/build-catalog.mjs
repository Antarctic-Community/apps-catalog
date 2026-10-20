// Собирает apps/*/app.json в public/data/catalog.json и копирует картинки.
// Валидирует всё, что приходит в PR. `--check` — только валидация, без записи.
import { readdir, readFile, writeFile, mkdir, cp, rm, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { imageSize } from 'image-size'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appsDir = join(root, 'apps')
const outDir = join(root, 'public', 'data')
const checkOnly = process.argv.includes('--check')

const LIMITS = { icon: { bytes: 600_000, min: 200 }, shot: { bytes: 1_500_000, min: 600 } }

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'))
const errors = []
const fail = (scope, msg) => errors.push(`${scope}: ${msg}`)

const categories = await readJson(join(root, 'categories.json'))
const collections = await readJson(join(root, 'collections.json'))
const categoryIds = new Set(categories.map((c) => c.id))

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const validate = ajv.compile(await readJson(join(root, 'schema', 'app.schema.json')))

async function checkImage(scope, file, limit, { square = false } = {}) {
  let size
  try {
    size = (await stat(file)).size
  } catch {
    return fail(scope, `файл не найден`)
  }
  if (size > limit.bytes) fail(scope, `${Math.round(size / 1024)} КБ > ${Math.round(limit.bytes / 1024)} КБ`)
  if (file.endsWith('.svg')) return
  const { width, height } = imageSize(await readFile(file))
  if (Math.min(width, height) < limit.min) fail(scope, `${width}×${height}: сторона меньше ${limit.min}px`)
  if (square && width !== height) fail(scope, `иконка должна быть квадратной, сейчас ${width}×${height}`)
}

// Запасная дата, если публичный эндпоинт ещё не отдаёт createdAt.
function addedAtFromGit(id, fallback) {
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%aI', '--', `apps/${id}/app.json`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const last = out.trim().split('\n').filter(Boolean).pop()
    if (last) return last.slice(0, 10)
  } catch {}
  return fallback ?? new Date().toISOString().slice(0, 10) // ещё не закоммичено
}

const apps = []
const dirs = (await readdir(appsDir, { withFileTypes: true })).filter((d) => d.isDirectory())

for (const dir of dirs) {
  const id = dir.name
  const base = join(appsDir, id)
  let app
  try {
    app = await readJson(join(base, 'app.json'))
  } catch (e) {
    fail(`apps/${id}`, `app.json не читается: ${e.message}`)
    continue
  }
  if (!validate(app)) {
    for (const e of validate.errors) fail(`apps/${id}/app.json`, `${e.instancePath || '/'} ${e.message}`)
    continue
  }
  if (app.id !== id) fail(`apps/${id}/app.json`, `id «${app.id}» не совпадает с именем папки`)
  if (!categoryIds.has(app.category)) fail(`apps/${id}/app.json`, `неизвестная категория «${app.category}»`)
  if (app.developer?.support && !/^https:\/\/|^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(app.developer.support))
    fail(`apps/${id}/app.json`, 'developer.support: нужен email или https-ссылка')

  await checkImage(`apps/${id}/${app.icon}`, join(base, app.icon), LIMITS.icon, { square: true })
  for (const s of app.screenshots ?? []) await checkImage(`apps/${id}/${s}`, join(base, s), LIMITS.shot)

  apps.push(app)
}

const ids = new Set(apps.map((a) => a.id))
for (const [name, list] of Object.entries(collections))
  for (const id of list) if (!ids.has(id)) fail(`collections.json/${name}`, `приложения «${id}» нет в apps/`)

if (errors.length) {
  console.error(`\n✖ Найдено ошибок: ${errors.length}\n`)
  for (const e of errors) console.error(`  • ${e}`)
  process.exit(1)
}

if (checkOnly) {
  console.log(`✔ ${apps.length} приложений, ошибок нет`)
  process.exit(0)
}

// MAU, дата создания и флаг проверки — публичный GET /api/v2/apps/:awAppId.
const API_BASE = (process.env.AW_API_BASE ?? 'https://api.antarcticwallet.com/api').replace(/\/$/, '')

async function fetchPublic(awAppId) {
  const url = `${API_BASE}/v2/apps/${encodeURIComponent(awAppId)}`
  let res
  try {
    res = await fetch(url)
  } catch (e) {
    throw new Error(`${url}: ${e.message}`)
  }
  if (res.status === 404) {
    console.warn(`  • ${awAppId}: нет в публичном каталоге, MAU = 0`)
    return { mau: 0, addedAt: null, dated: true, verified: false }
  }
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const data = (await res.json())?.data
  const mau = data?.mau
  if (!Number.isInteger(mau) || mau < 0) throw new Error(`${url}: нет целого поля mau`)
  if (typeof data?.isVerified !== 'boolean') throw new Error(`${url}: нет поля isVerified`)
  const createdAt = typeof data?.createdAt === 'string' ? data.createdAt.slice(0, 10) : null
  if (createdAt && !/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) throw new Error(`${url}: createdAt не дата`)
  return { mau, addedAt: createdAt, dated: Boolean(createdAt), verified: data.isVerified }
}

let withMau
try {
  const pubs = await Promise.all(apps.map(async (app) => ({ app, pub: await fetchPublic(app.awAppId) })))
  if (pubs.some(({ pub }) => !pub.dated)) console.warn('  • эндпоинт не отдал createdAt, дата «Новых» взята из git')
  withMau = pubs.map(({ app, pub }) => ({
    ...app,
    mau: pub.mau,
    verified: pub.verified,
    addedAt: pub.addedAt ?? addedAtFromGit(app.id, app.releasedAt),
  }))
} catch (e) {
  console.error(`\n✖ Не удалось получить данные приложения: ${e.message}`)
  process.exit(1)
}

withMau.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
const enriched = withMau
const newest = [...enriched].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).map((a) => a.id)
const top = [...enriched].sort((a, b) => b.mau - a.mau || a.name.localeCompare(b.name, 'ru')).slice(0, 5)

await rm(outDir, { recursive: true, force: true })
await mkdir(join(outDir, 'apps'), { recursive: true })
for (const a of enriched) await cp(join(appsDir, a.id), join(outDir, 'apps', a.id), { recursive: true, filter: (p) => !p.endsWith('app.json') })

const catalog = {
  generatedAt: new Date().toISOString(),
  categories,
  collections: {
    ...collections,
    verified: enriched.filter((a) => a.verified).map((a) => a.id),
    new: newest.slice(0, 20),
    top: top.map((a) => a.id),
  },
  apps: enriched.map((a) => ({
    ...a,
    icon: `data/apps/${a.id}/${a.icon}`,
    screenshots: (a.screenshots ?? []).map((s) => `data/apps/${a.id}/${s}`),
  })),
}
await writeFile(join(outDir, 'catalog.json'), JSON.stringify(catalog, null, 2))
console.log(`✔ catalog.json: ${enriched.length} приложений`)
console.log(`  топ: ${top.map((a) => `${a.name} (${a.mau})`).join(', ')}`)
console.log(`  проверенные: ${enriched.filter((a) => a.verified).map((a) => a.name).join(', ') || '—'}`)
