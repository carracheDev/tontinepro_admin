import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://difficult-marley-carrachedevpro-a2bb029d.koyeb.app'

export async function GET(req: NextRequest, { params }: { params: { proxy: string[] } }) {
  return proxy(req, params.proxy)
}
export async function POST(req: NextRequest, { params }: { params: { proxy: string[] } }) {
  return proxy(req, params.proxy)
}
export async function PUT(req: NextRequest, { params }: { params: { proxy: string[] } }) {
  return proxy(req, params.proxy)
}
export async function DELETE(req: NextRequest, { params }: { params: { proxy: string[] } }) {
  return proxy(req, params.proxy)
}
export async function PATCH(req: NextRequest, { params }: { params: { proxy: string[] } }) {
  return proxy(req, params.proxy)
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
