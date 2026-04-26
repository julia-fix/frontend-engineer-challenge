import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)
const authBaseUrl = process.env.AUTH_INTEGRATION_BASE_URL ?? "http://localhost:3000"
const requestTimeoutSeconds = 10
const sessionRetryWindowMs = 3000
const sessionRetryIntervalMs = 200

type FlowNode = {
  attributes: {
    name?: string
    value?: string
  }
}

type RegistrationFlowResponse = {
  id: string
  ui: {
    nodes: FlowNode[]
  }
}

type SessionResponse = {
  active: boolean
  identity: {
    traits: {
      email?: string
    }
  }
}

type CurlJsonResponse = {
  status: number
  payload: unknown
  setCookieHeaders: string[]
}

class CookieJar {
  private readonly cookies = new Map<string, string>()

  absorb(setCookieHeaders: string[]) {
    for (const header of setCookieHeaders) {
      const cookiePair = header.split(";", 1)[0]
      const separatorIndex = cookiePair.indexOf("=")

      if (separatorIndex <= 0) {
        continue
      }

      this.cookies.set(cookiePair.slice(0, separatorIndex), cookiePair)
    }
  }

  toHeader(): string | undefined {
    if (this.cookies.size === 0) {
      return undefined
    }

    return [...this.cookies.values()].join("; ")
  }

  has(name: string): boolean {
    return this.cookies.has(name)
  }
}

function parseCurlResponse(stdout: string) {
  const statusMarker = "\n__STATUS__:"
  const statusMarkerIndex = stdout.lastIndexOf(statusMarker)

  if (statusMarkerIndex === -1) {
    throw new Error("Could not parse curl status marker.")
  }

  const responseText = stdout.slice(0, statusMarkerIndex)
  const statusText = stdout.slice(statusMarkerIndex + statusMarker.length).trim()

  const separator = responseText.includes("\r\n\r\n") ? "\r\n\r\n" : "\n\n"
  const separatorIndex = responseText.lastIndexOf(separator)

  if (separatorIndex === -1) {
    throw new Error("Could not split curl headers from body.")
  }

  const headersText = responseText.slice(0, separatorIndex)
  const bodyText = responseText.slice(separatorIndex + separator.length)
  const headerLines = headersText.split(/\r?\n/)
  const setCookieHeaders = headerLines
    .filter((line) => line.toLowerCase().startsWith("set-cookie:"))
    .map((line) => line.slice("set-cookie:".length).trim())

  return {
    status: Number(statusText),
    payload: bodyText.length > 0 ? JSON.parse(bodyText) : null,
    setCookieHeaders,
  }
}

async function requestJson(
  path: string,
  jar: CookieJar,
  init: {
    method?: "GET" | "POST"
    body?: Record<string, unknown>
  } = {}
): Promise<CurlJsonResponse> {
  const args = [
    "--silent",
    "--show-error",
    "--max-time",
    String(requestTimeoutSeconds),
    "--dump-header",
    "-",
    "--header",
    "Accept: application/json",
    "--request",
    init.method ?? "GET",
  ]

  const cookieHeader = jar.toHeader()

  if (cookieHeader) {
    args.push("--header", `Cookie: ${cookieHeader}`)
  }

  if (init.body) {
    args.push(
      "--header",
      "Content-Type: application/json",
      "--data",
      JSON.stringify(init.body)
    )
  }

  args.push("--write-out", "\n__STATUS__:%{http_code}", `${authBaseUrl}${path}`)

  let stdout: string

  try {
    ;({ stdout } = await execFileAsync("curl", args, {
      timeout: requestTimeoutSeconds * 1000 + 1000,
      maxBuffer: 1024 * 1024,
    }))
  } catch (error) {
    throw new Error(
      `Auth integration test failed on ${path}. Check ${authBaseUrl}, the Next dev server, and the backend stack before running npm run test:auth-integration.`,
      { cause: error }
    )
  }

  const result = parseCurlResponse(stdout)
  jar.absorb(result.setCookieHeaders)

  return result
}

async function waitForActiveSession(jar: CookieJar) {
  const startedAt = Date.now()
  let lastResult: CurlJsonResponse | null = null

  while (Date.now() - startedAt < sessionRetryWindowMs) {
    lastResult = await requestJson("/sessions/whoami", jar)

    if (lastResult.status === 200) {
      return lastResult
    }

    await new Promise((resolve) => setTimeout(resolve, sessionRetryIntervalMs))
  }

  return lastResult
}

function getRequiredNodeValue(flow: RegistrationFlowResponse, fieldName: string): string {
  const value = flow.ui.nodes.find((node) => node.attributes.name === fieldName)?.attributes.value

  if (!value) {
    throw new Error(`Registration flow is missing required field ${fieldName}.`)
  }

  return value
}

describe("registration integration", () => {
  it("creates an active session through the live frontend proxy", async () => {
    const jar = new CookieJar()
    const email = `regcheck-${Date.now()}@example.com`
    const password = "aB3!k9Pq-journey"

    const initialFlowResult = await requestJson(
      "/self-service/registration/browser",
      jar
    )
    expect(initialFlowResult.status).toBe(200)

    const initialFlow = initialFlowResult.payload as RegistrationFlowResponse
    const initialCsrfToken = getRequiredNodeValue(initialFlow, "csrf_token")

    const profileStepResult = await requestJson(
      `/self-service/registration?flow=${initialFlow.id}`,
      jar,
      {
        method: "POST",
        body: {
          method: "profile",
          "traits.email": email,
          csrf_token: initialCsrfToken,
        },
      }
    )
    expect([200, 400]).toContain(profileStepResult.status)

    const passwordFlow = profileStepResult.payload as RegistrationFlowResponse
    const passwordCsrfToken = getRequiredNodeValue(passwordFlow, "csrf_token")

    const passwordStepResult = await requestJson(
      `/self-service/registration?flow=${passwordFlow.id}`,
      jar,
      {
        method: "POST",
        body: {
          method: "password",
          password,
          "traits.email": email,
          csrf_token: passwordCsrfToken,
        },
      }
    )

    expect(passwordStepResult.status).toBeLessThan(500)

    if (passwordStepResult.status === 200) {
      expect(passwordStepResult.payload).toMatchObject({
        continue_with: [
          expect.objectContaining({
            action: "redirect_browser_to",
          }),
        ],
      })
    }

    if (!jar.has("ory_kratos_session")) {
      throw new Error(
        `Registration password step did not produce a session cookie. status=${passwordStepResult.status}; setCookie=${JSON.stringify(passwordStepResult.setCookieHeaders)}; payload=${JSON.stringify(passwordStepResult.payload).slice(0, 800)}`
      )
    }

    const sessionResult = await waitForActiveSession(jar)
    expect(sessionResult?.status).toBe(200)
    expect(sessionResult?.payload).toMatchObject<SessionResponse>({
      active: true,
      identity: {
        traits: {
          email,
        },
      },
    })
  })
})
