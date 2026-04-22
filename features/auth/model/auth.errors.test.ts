import { describe, expect, it } from "vitest"
import { ApiError } from "@/shared/api/api-error"
import { getAuthErrorMessage, getAuthMessageText } from "./auth.errors"
import type { LoginFlow } from "./auth.types"

function createFlow(messageId: number, text: string): LoginFlow {
  return {
    id: "flow-id",
    type: "browser",
    expires_at: "2026-01-01T00:00:00.000Z",
    issued_at: "2026-01-01T00:00:00.000Z",
    request_url: "http://orbitto.localhost/auth/login",
    ui: {
      action: "/self-service/login",
      method: "POST",
      nodes: [],
      messages: [
        {
          id: messageId,
          text,
          type: "error",
        },
      ],
    },
  }
}

describe("auth.errors", () => {
  it("translates known Ory message ids", () => {
    expect(
      getAuthMessageText({
        id: 4000007,
        text: "original",
        type: "error",
      })
    ).toBe("Данный адрес уже занят")
  })

  it("prefers flow-aware API errors over generic messages", () => {
    const error = new ApiError({
      kind: "auth",
      message: "Request failed",
      details: createFlow(4000007, "This email is already taken"),
    })

    expect(getAuthErrorMessage(error)).toBe("Данный адрес уже занят")
  })
})
