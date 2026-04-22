import type { NextRequest } from "next/server"

const backendOrigin = "http://127.0.0.1"
const backendHost = "orbitto.localhost"

function buildTargetUrl(request: NextRequest, prefix: `/${string}`) {
  const targetUrl = new URL(`${backendOrigin}${prefix}`)

  targetUrl.pathname = `${prefix}${request.nextUrl.pathname.slice(prefix.length)}`
  targetUrl.search = request.nextUrl.search

  return targetUrl
}

function copyRequestHeaders(request: NextRequest) {
  const headers = new Headers(request.headers)

  headers.set("host", backendHost)
  headers.set("x-forwarded-host", backendHost)
  headers.set("x-forwarded-proto", "http")

  return headers
}

function copyResponseHeaders(response: Response) {
  const headers = new Headers(response.headers)

  headers.delete("content-encoding")
  headers.delete("content-length")

  return headers
}

export async function proxyRequest(request: NextRequest, prefix: `/${string}`) {
  const upstreamResponse = await fetch(buildTargetUrl(request, prefix), {
    method: request.method,
    headers: copyRequestHeaders(request),
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    redirect: "manual",
  })

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: copyResponseHeaders(upstreamResponse),
  })
}
