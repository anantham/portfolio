import { appendFile, mkdir, readFile, stat } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LOG_DIR = path.join(process.cwd(), 'logs')
const LOG_PATH = path.join(LOG_DIR, 'wheel-trace.ndjson')
const MAX_READ_BYTES = 256 * 1024

async function ensureLogDir() {
  await mkdir(LOG_DIR, { recursive: true })
}

async function readTail() {
  await ensureLogDir()
  try {
    const info = await stat(LOG_PATH)
    const bytesToRead = Math.min(info.size, MAX_READ_BYTES)
    const content = await readFile(LOG_PATH, 'utf8')
    if (bytesToRead === info.size) return content
    return content.slice(-bytesToRead)
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, error: 'diagnostics-disabled' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, error: 'invalid-payload' }, { status: 400 })
  }

  const entry = {
    serverTs: new Date().toISOString(),
    ...body,
  }

  await ensureLogDir()
  await appendFile(LOG_PATH, `${JSON.stringify(entry)}\n`, 'utf8')

  return NextResponse.json({ ok: true })
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, error: 'diagnostics-disabled' }, { status: 403 })
  }

  const tail = await readTail()
  return new NextResponse(tail, {
    status: 200,
    headers: { 'content-type': 'application/x-ndjson; charset=utf-8' },
  })
}
