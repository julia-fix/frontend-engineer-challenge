export type ApiErrorKind = "auth" | "graphql" | "http" | "network"

type ApiErrorOptions = {
  kind: ApiErrorKind
  message: string
  status?: number
  details?: unknown
  cause?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly details?: unknown
  override readonly cause?: unknown

  constructor({ kind, message, status, details, cause }: ApiErrorOptions) {
    super(message)

    this.name = "ApiError"
    this.kind = kind
    this.status = status
    this.details = details
    this.cause = cause
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getErrorMessageFromPayload(payload: unknown): string | null {
  if (typeof payload === "string") {
    const trimmedPayload = payload.trim()
    return trimmedPayload.length > 0 ? trimmedPayload : null
  }

  if (!isRecord(payload)) {
    return null
  }

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message
  }

  if (isRecord(payload.error)) {
    const nestedMessage = getErrorMessageFromPayload(payload.error)

    if (nestedMessage) {
      return nestedMessage
    }
  }

  if (Array.isArray(payload.errors)) {
    for (const error of payload.errors) {
      const nestedMessage = getErrorMessageFromPayload(error)

      if (nestedMessage) {
        return nestedMessage
      }
    }
  }

  return null
}
