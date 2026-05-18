import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tontinepro-api-production.up.railway.app'

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

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const auth = req.headers.get('authorization')
  if (auth) headers['Authorization'] = auth

  let body: string | undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try { body = await req.text() } catch { /* empty body */ }
  }

  const res = await fetch(url, { method: req.method, headers, body })
  const data = await res.text()

  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
