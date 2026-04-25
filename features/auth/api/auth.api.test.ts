import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { authApi } from "./auth.api"
import type { RegistrationFlow } from "../model/auth.types"

function createRegistrationFlow({
  id,
  csrfToken,
  email,
  messages = [],
}: {
  id: string
  csrfToken: string
  email?: string
  messages?: RegistrationFlow["ui"]["messages"]
}): RegistrationFlow {
  return {
    id,
    type: "browser",
    expires_at: "2026-01-01T00:00:00.000Z",
    issued_at: "2026-01-01T00:00:00.000Z",
    request_url: "http://orbitto.localhost/auth/registration",
    ui: {
      action: "/self-service/registration",
      method: "POST",
      messages,
      nodes: [
        {
          type: "input",
          group: "default",
          attributes: {
            name: "csrf_token",
            type: "hidden",
            value: csrfToken,
          },
          messages: [],
          meta: {},
        },
        ...(email
          ? [
              {
                type: "input",
                group: "default",
                attributes: {
                  name: "traits.email",
                  type: "email",
                  value: email,
                },
                messages: [],
                meta: {},
              },
            ]
          : []),
      ],
    },
  }
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  })
}

describe("authApi.register", () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("submits profile and password steps before returning the redirect target", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          createRegistrationFlow({
            id: "registration-flow",
            csrfToken: "csrf-step-1",
          })
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          createRegistrationFlow({
            id: "password-flow",
            csrfToken: "csrf-step-2",
            email: "person@example.com",
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 303,
          headers: {
            location: "http://orbitto.localhost/dashboard",
          },
        })
      )

    await expect(
      authApi.register({
        email: "person@example.com",
        password: "strongPass1",
      })
    ).resolves.toEqual({
      redirectTo: "/dashboard",
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/self-service/registration/browser",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: expect.any(Headers),
      })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/self-service/registration?flow=registration-flow",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          method: "profile",
          "traits.email": "person@example.com",
          csrf_token: "csrf-step-1",
        }),
      })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/self-service/registration?flow=password-flow",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        redirect: "manual",
        body: JSON.stringify({
          method: "password",
          password: "strongPass1",
          "traits.email": "person@example.com",
          csrf_token: "csrf-step-2",
        }),
      })
    )
  })

  it("throws an auth error when the profile step returns flow errors", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          createRegistrationFlow({
            id: "registration-flow",
            csrfToken: "csrf-step-1",
          })
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          createRegistrationFlow({
            id: "password-flow",
            csrfToken: "csrf-step-2",
            email: "person@example.com",
            messages: [
              {
                id: 4000007,
                text: "This email is already taken",
                type: "error",
              },
            ],
          })
        )
      )

    await expect(
      authApi.register({
        email: "person@example.com",
        password: "strongPass1",
      })
    ).rejects.toMatchObject({
      name: "ApiError",
      kind: "auth",
      message: "This email is already taken",
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
