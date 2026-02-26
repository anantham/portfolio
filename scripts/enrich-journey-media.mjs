#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import process from 'process'

const PLACEHOLDER_IMAGES = new Set([
  '/images/bio/goa.jpg',
  '/images/bio/tool.jpg',
  '/images/bio/speaker-events.jpg',
  '/images/bio/newspaper.jpg',
  '/images/bio/blackpool.jpg',
])

const IMAGE_DIR = path.join('public', 'images', 'journey')
const EVENTS_PATH = path.join('src', 'data', 'journeyEvents.json')
const ATTRIBUTION_PATH = path.join('src', 'data', 'journeyMediaAttribution.json')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const parseArgs = (argv) => {
  const args = { tag: null, force: false }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--tag') args.tag = argv[i + 1] ?? null
    if (token === '--force') args.force = true
  }
  return args
}

const sanitizeTitle = (value) => value.trim().replace(/\s+/g, '_')

const guessExt = (contentType, imageUrl) => {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }

  if (contentType && map[contentType.toLowerCase()]) return map[contentType.toLowerCase()]
  const clean = imageUrl.split('?')[0]
  const ext = path.extname(clean).replace('.', '').toLowerCase()
  if (ext === 'jpeg') return 'jpg'
  if (['jpg', 'png', 'webp'].includes(ext)) return ext
  return 'jpg'
}

const fetchSummary = async (title) => {
  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sanitizeTitle(title))}`
  let response = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    response = await fetch(endpoint, {
      headers: { 'user-agent': 'journey-media-enricher/1.0 (portfolio local script)' },
    })
    if (response.ok) break
    if (response.status !== 429) return null
    // eslint-disable-next-line no-await-in-loop
    await sleep(600 * (attempt + 1))
  }
  if (!response || !response.ok) return null
  const body = await response.json()
  if (body.type === 'disambiguation') return null
  const imageSource = body.originalimage?.source ?? body.thumbnail?.source ?? null
  if (!imageSource) return null
  return {
    wikipediaTitle: body.title ?? title,
    wikipediaPage: body.content_urls?.desktop?.page ?? null,
    imageSource,
  }
}

const downloadImage = async (url, outPath) => {
  let response = null
  for (let attempt = 0; attempt < 4; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    response = await fetch(url, {
      headers: { 'user-agent': 'journey-media-enricher/1.0 (portfolio local script)' },
    })
    if (response.ok) break
    if (response.status !== 429) break
    // eslint-disable-next-line no-await-in-loop
    await sleep(900 * (attempt + 1))
  }
  if (!response || !response.ok) throw new Error(`Image download failed (${response?.status ?? 'unknown'})`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  await fs.writeFile(outPath, bytes)
  return response.headers.get('content-type')
}

const readJson = async (filePath, fallback) => {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const main = async () => {
  const args = parseArgs(process.argv.slice(2))
  const events = await readJson(EVENTS_PATH, [])
  const attributions = await readJson(ATTRIBUTION_PATH, [])

  if (!Array.isArray(events)) {
    throw new Error(`Expected array in ${EVENTS_PATH}`)
  }

  await fs.mkdir(IMAGE_DIR, { recursive: true })

  const attributionById = new Map(attributions.map((item) => [item.id, item]))
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const event of events) {
    const tags = Array.isArray(event.tags) ? event.tags : []
    if (args.tag && !tags.includes(args.tag)) {
      skipped += 1
      continue
    }

    const currentImage = event.media?.image ?? null
    const shouldReplace = args.force || !currentImage || PLACEHOLDER_IMAGES.has(currentImage)
    if (!shouldReplace) {
      skipped += 1
      continue
    }

    const queries = [
      `${event.locationName}, ${event.country}`,
      event.locationName,
      event.country === 'United States' ? `${event.locationName}, United States` : null,
      event.title,
    ].filter(Boolean)

    let hit = null
    for (const query of queries) {
      // eslint-disable-next-line no-await-in-loop
      hit = await fetchSummary(query)
      if (hit) break
    }

    if (!hit) {
      console.warn(`No Wikipedia image found for ${event.id} (${event.locationName})`)
      failed += 1
      continue
    }

    try {
      const tempPath = path.join(IMAGE_DIR, `${event.id}.tmp`)
      // eslint-disable-next-line no-await-in-loop
      const contentType = await downloadImage(hit.imageSource, tempPath)
      const ext = guessExt(contentType, hit.imageSource)
      const finalName = `${event.id}.${ext}`
      const finalPath = path.join(IMAGE_DIR, finalName)
      await fs.rename(tempPath, finalPath)

      event.media = {
        image: `/images/journey/${finalName}`,
        alt: `${event.locationName}, ${event.country}`,
      }

      attributionById.set(event.id, {
        id: event.id,
        title: event.title,
        locationName: event.locationName,
        country: event.country,
        wikipediaTitle: hit.wikipediaTitle,
        wikipediaPage: hit.wikipediaPage,
        imageSource: hit.imageSource,
        fetchedAt: new Date().toISOString(),
      })

      updated += 1
      console.log(`Updated media for ${event.id} -> /images/journey/${finalName}`)
    } catch (error) {
      console.error(`Failed media update for ${event.id}:`, error.message)
      failed += 1
    }
  }

  await fs.writeFile(EVENTS_PATH, `${JSON.stringify(events, null, 2)}\n`, 'utf8')
  await fs.writeFile(
    ATTRIBUTION_PATH,
    `${JSON.stringify(Array.from(attributionById.values()), null, 2)}\n`,
    'utf8',
  )

  console.log(`Done. updated=${updated} skipped=${skipped} failed=${failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
