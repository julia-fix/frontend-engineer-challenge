import { ApiError, getErrorMessageFromPayload } from "./api-error"

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

type RequestJsonOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: JsonValue | Record<string, unknown>
  headers?: HeadersInit
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  const text = await response.text()
  return text.length > 0 ? text : null
}

export async function requestJson<T>(
  input: string,
  options: RequestJsonOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  let body: string | undefined

  if (options.body !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    body = JSON.stringify(options.body)
  }

  let response: Response

  try {
    response = await fetch(input, {
      ...options,
      body,
      headers,
      credentials: options.credentials ?? "include",
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }

    throw new ApiError({
      kind: "network",
      message: "Network request failed.",
      cause: error,
    })
  }

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError({
      kind: "http",
      status: response.status,
      message:
        getErrorMessageFromPayload(payload) ??
        `Request failed with status ${response.status}.`,
      details: payload,
    })
  }

  return payload as T
}

export function withQuery(
  url: string,
  params: Record<string, string | null | undefined>
): string {
  const parsedUrl = new URL(url, "http://local.invalid")

  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      parsedUrl.searchParams.delete(key)
      continue
    }

    parsedUrl.searchParams.set(key, value)
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return parsedUrl.toString()
  }

  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
}
