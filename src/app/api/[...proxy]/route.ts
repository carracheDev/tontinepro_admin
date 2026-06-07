import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type Context = { params: Promise<{ proxy: string[] }> }

export async function GET(req: NextRequest, ctx: Context) {
  return proxy(req, (await ctx.params).proxy)
}
export async function POST(req: NextRequest, ctx: Context) {
  return proxy(req, (await ctx.params).proxy)
}
export async function PUT(req: NextRequest, ctx: Context) {
  return proxy(req, (await ctx.params).proxy)
}
export async function DELETE(req: NextRequest, ctx: Context) {
  return proxy(req, (await ctx.params).proxy)
}
export async function PATCH(req: NextRequest, ctx: Context) {
  return proxy(req, (await ctx.params).proxy)
}

async function proxy(req: NextRequest, segments: string[]) {
  const path = '/' + segments.join('/')
  const url = BACKEND + path + (req.nextUrl.search || '')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  }
  const auth = req.headers.get('authorization')
  if (auth) headers['Authorization'] = auth

  let body: string | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try { body = await req.text() } catch { /* empty body */ }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(url, { method: req.method, headers, body, signal: controller.signal })
    const contentType = res.headers.get('content-type') ?? 'application/json'

    // Données binaires (PDF, images…) → transmettre tel quel sans corrompre
    if (!contentType.includes('application/json') && !contentType.includes('text/')) {
      const buffer = await res.arrayBuffer()
      return new NextResponse(buffer, {
        status: res.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': res.headers.get('content-disposition') ?? '',
        },
      })
    }

    const data = await res.text()
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'AbortError'
    return new NextResponse(
      JSON.stringify({ succes: false, message: timedOut ? 'Délai dépassé (backend lent)' : 'Backend inaccessible' }),
      { status: timedOut ? 504 : 502, headers: { 'Content-Type': 'application/json' } },
    )
  } finally {
    clearTimeout(timer)
  }
}
