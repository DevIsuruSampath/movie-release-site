import { proxyToBackend } from '@/lib/server-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function buildPath(path: string[]) {
  return `/api/${path.join('/')}`
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyToBackend(request, buildPath(path))
}

export async function HEAD(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyToBackend(request, buildPath(path))
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyToBackend(request, buildPath(path))
}

export async function PUT(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyToBackend(request, buildPath(path))
}

export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyToBackend(request, buildPath(path))
}

export async function DELETE(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyToBackend(request, buildPath(path))
}

export async function OPTIONS(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxyToBackend(request, buildPath(path))
}
