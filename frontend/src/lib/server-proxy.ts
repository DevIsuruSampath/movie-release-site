const BACKEND_URL =
  process.env.API_URL ||
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://backend:8000'

function buildProxyUrl(pathname: string, search: string) {
  return new URL(`${pathname}${search}`, BACKEND_URL)
}

function copyRequestHeaders(headers: Headers) {
  const nextHeaders = new Headers()
  headers.forEach((value, key) => {
    if (['host', 'content-length', 'connection'].includes(key.toLowerCase())) {
      return
    }
    nextHeaders.set(key, value)
  })
  return nextHeaders
}

function copyResponseHeaders(headers: Headers) {
  const nextHeaders = new Headers()
  headers.forEach((value, key) => {
    if (['content-length', 'content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
      return
    }
    nextHeaders.set(key, value)
  })
  return nextHeaders
}

export async function proxyToBackend(request: Request, pathname: string) {
  const targetUrl = buildProxyUrl(pathname, new URL(request.url).search)
  const requestInit: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers: copyRequestHeaders(request.headers),
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    duplex: request.method === 'GET' || request.method === 'HEAD' ? undefined : 'half',
    redirect: 'manual',
    cache: 'no-store',
  }
  const response = await fetch(targetUrl, requestInit)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: copyResponseHeaders(response.headers),
  })
}
