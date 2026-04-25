import type { NextRequest } from "next/server"

function getRequiredBackendOrigin(): URL {
  const configuredOrigin = process.env.BACKEND_PROXY_ORIGIN?.trim()

  if (!configuredOrigin) {
    throw new Error(
      "BACKEND_PROXY_ORIGIN must be configured for proxy routes."
    )
  }

  try {
    return new URL(configuredOrigin)
  } catch {
    throw new Error("BACKEND_PROXY_ORIGIN must be a valid absolute URL.")
  }
}

function getProxyConfig() {
  const backendOrigin = getRequiredBackendOrigin()
  const backendHost =
    process.env.BACKEND_PROXY_HOST?.trim() || backendOrigin.host
  const forwardedProto =
    process.env.BACKEND_PROXY_PROTO?.trim() || backendOrigin.protocol.slice(0, -1)

  return {
    backendOrigin: backendOrigin.origin,
    backendHost,
    forwardedProto,
  }
}

function buildTargetUrl(request: NextRequest, prefix: `/${string}`) {
  const { backendOrigin } = getProxyConfig()
  const targetUrl = new URL(`${backendOrigin}${prefix}`)

  targetUrl.pathname = `${prefix}${request.nextUrl.pathname.slice(prefix.length)}`
  targetUrl.search = request.nextUrl.search

  return targetUrl
}

function copyRequestHeaders(request: NextRequest) {
  const { backendHost, forwardedProto } = getProxyConfig()
  const headers = new Headers(request.headers)

  headers.set("host", backendHost)
  headers.set("x-forwarded-host", backendHost)
  headers.set("x-forwarded-proto", forwardedProto)

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
