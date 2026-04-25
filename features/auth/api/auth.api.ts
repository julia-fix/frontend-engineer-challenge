import { ApiError } from "@/shared/api/api-error"
import { requestJson, withQuery } from "@/shared/api/http-client"
import { env } from "@/shared/config/env"
import type {
  AuthFlow,
  AuthSession,
  LoginInput,
  LoginFlow,
  LogoutFlow,
  RecoveryCodeInput,
  RecoveryInput,
  RecoveryFlow,
  RegisterInput,
  RegistrationFlow,
  SettingsFlow,
  SettingsPasswordInput,
} from "../model/auth.types"
import {
  getFlowMessages,
  getFlowNodeValue,
  isAuthFlow,
} from "../model/auth.types"

type RequestOptions = {
  signal?: AbortSignal
}

type RegistrationResult = {
  redirectTo: string | null
}

function authHeaders(): HeadersInit {
  return {
    Accept: "application/json",
  }
}

function createFlowUrl(
  path: "/login" | "/logout" | "/recovery" | "/registration" | "/settings"
) {
  return `${env.kratosSelfServiceBasePath}${path}/browser`
}

function getFlowUrl(
  path: "/login" | "/recovery" | "/registration" | "/settings",
  flowId: string
) {
  return withQuery(`${env.kratosSelfServiceBasePath}${path}/flows`, { id: flowId })
}

function submitFlowUrl(
  path: "/login" | "/recovery" | "/registration" | "/settings",
  flowId: string
) {
  return withQuery(`${env.kratosSelfServiceBasePath}${path}`, { flow: flowId })
}

export function toAppRelativeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return url
  }
}

function getRequiredFlowValue(flow: AuthFlow, fieldName: string): string {
  const value = getFlowNodeValue(flow, fieldName)

  if (value) {
    return value
  }

  throw new ApiError({
    kind: "auth",
    message: `Auth flow is missing required field: ${fieldName}.`,
    details: flow,
  })
}

function throwIfFlowHasErrors(flow: AuthFlow): void {
  const flowError = getFlowMessages(flow, "error")[0]

  if (flowError) {
    throw new ApiError({
      kind: "auth",
      message: flowError.text,
      details: flow,
    })
  }
}

function getFlowFromApiError(error: unknown): AuthFlow | null {
  if (error instanceof ApiError && isAuthFlow(error.details)) {
    return error.details
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getRedirectBrowserTo(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null
  }

  const redirectTo = payload.redirect_browser_to

  if (typeof redirectTo === "string" && redirectTo.length > 0) {
    return toAppRelativeUrl(redirectTo)
  }

  const continueWith = payload.continue_with

  if (!Array.isArray(continueWith)) {
    return null
  }

  for (const item of continueWith) {
    if (!isRecord(item) || item.action !== "redirect_browser_to") {
      continue
    }

    const continueWithRedirect = item.redirect_browser_to

    if (typeof continueWithRedirect === "string" && continueWithRedirect.length > 0) {
      return toAppRelativeUrl(continueWithRedirect)
    }
  }

  return null
}

async function createBrowserFlow<T>(
  url: string,
  { signal }: RequestOptions = {}
): Promise<T> {
  return requestJson<T>(url, {
    method: "GET",
    headers: authHeaders(),
    signal,
  })
}

async function submitBrowserFlow<T>(
  url: string,
  body: Record<string, unknown>,
  { signal }: RequestOptions = {}
): Promise<T> {
  try {
    return await requestJson<T>(url, {
      method: "POST",
      headers: authHeaders(),
      body,
      signal,
    })
  } catch (error) {
    const flow = getFlowFromApiError(error)

    if (flow) {
      return flow as T
    }

    throw error
  }
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

async function submitBrowserFlowWithRedirect(
  url: string,
  body: Record<string, unknown>,
  { signal }: RequestOptions = {}
): Promise<{ payload: unknown; redirectTo: string | null }> {
  const headers = new Headers(authHeaders())
  headers.set("Content-Type", "application/json")

  let response: Response

  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include",
      signal,
      redirect: "manual",
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

  const redirectTo = response.headers.get("location")

  if (response.status >= 300 && response.status < 400 && redirectTo) {
    return {
      payload: null,
      redirectTo: toAppRelativeUrl(redirectTo),
    }
  }

  const payload = await parseResponse(response)

  const payloadRedirectTo = getRedirectBrowserTo(payload)

  if (payloadRedirectTo) {
    return {
      payload,
      redirectTo: payloadRedirectTo,
    }
  }

  if (!response.ok) {
    throw new ApiError({
      kind: "http",
      status: response.status,
      message: `Request failed with status ${response.status}.`,
      details: payload,
    })
  }

  return {
    payload,
    redirectTo: null,
  }
}

export const authApi = {
  getSession({ signal }: RequestOptions = {}) {
    return requestJson<AuthSession>(env.kratosSessionEndpoint, {
      headers: authHeaders(),
      signal,
    })
  },

  createLoginFlow(options: RequestOptions = {}) {
    return createBrowserFlow<LoginFlow>(createFlowUrl("/login"), options)
  },

  getLoginFlow(flowId: string, options: RequestOptions = {}) {
    return createBrowserFlow<LoginFlow>(getFlowUrl("/login", flowId), options)
  },

  async login(input: LoginInput, options: RequestOptions = {}) {
    const flow = await authApi.createLoginFlow(options)

    const result = await submitBrowserFlow<unknown>(
      submitFlowUrl("/login", flow.id),
      {
        method: "password",
        identifier: input.identifier,
        password: input.password,
        csrf_token: getRequiredFlowValue(flow, "csrf_token"),
      },
      options
    )

    if (isAuthFlow(result)) {
      throw new ApiError({
        kind: "auth",
        message: getFlowMessages(result, "error")[0]?.text ?? "Не удалось выполнить вход.",
        details: result,
      })
    }
  },

  createRegistrationFlow(options: RequestOptions = {}) {
    return createBrowserFlow<RegistrationFlow>(createFlowUrl("/registration"), options)
  },

  getRegistrationFlow(flowId: string, options: RequestOptions = {}) {
    return createBrowserFlow<RegistrationFlow>(
      getFlowUrl("/registration", flowId),
      options
    )
  },

  async register(
    input: RegisterInput,
    options: RequestOptions = {}
  ): Promise<RegistrationResult> {
    const registrationFlow = await authApi.createRegistrationFlow(options)

    const passwordFlow = await submitBrowserFlow<RegistrationFlow>(
      submitFlowUrl("/registration", registrationFlow.id),
      {
        method: "profile",
        "traits.email": input.email,
        csrf_token: getRequiredFlowValue(registrationFlow, "csrf_token"),
      },
      options
    )

    throwIfFlowHasErrors(passwordFlow)

    const result = await submitBrowserFlowWithRedirect(
      submitFlowUrl("/registration", passwordFlow.id),
      {
        method: "password",
        password: input.password,
        "traits.email": getRequiredFlowValue(passwordFlow, "traits.email"),
        csrf_token: getRequiredFlowValue(passwordFlow, "csrf_token"),
      },
      options
    )

    if (result.redirectTo) {
      return {
        redirectTo: result.redirectTo,
      }
    }

    if (isAuthFlow(result.payload)) {
      throwIfFlowHasErrors(result.payload)

      throw new ApiError({
        kind: "auth",
        message: "Не удалось завершить регистрацию.",
        details: result.payload,
      })
    }

    return {
      redirectTo: getRedirectBrowserTo(result.payload),
    }
  },

  createRecoveryFlow(options: RequestOptions = {}) {
    return createBrowserFlow<RecoveryFlow>(createFlowUrl("/recovery"), options)
  },

  getRecoveryFlow(flowId: string, options: RequestOptions = {}) {
    return createBrowserFlow<RecoveryFlow>(getFlowUrl("/recovery", flowId), options)
  },

  async recoverPassword(input: RecoveryInput, options: RequestOptions = {}) {
    const recoveryFlow = await authApi.createRecoveryFlow(options)

    const result = await submitBrowserFlow<RecoveryFlow>(
      submitFlowUrl("/recovery", recoveryFlow.id),
      {
        method: "code",
        email: input.email,
        csrf_token: getRequiredFlowValue(recoveryFlow, "csrf_token"),
      },
      options
    )

    if (isAuthFlow(result)) {
      throwIfFlowHasErrors(result)
      return result
    }

    return result
  },

  async submitRecoveryCode(
    flow: RecoveryFlow,
    input: RecoveryCodeInput,
    options: RequestOptions = {}
  ) {
    const result = await submitBrowserFlowWithRedirect(
      submitFlowUrl("/recovery", flow.id),
      {
        method: "code",
        code: input.code,
        csrf_token: getRequiredFlowValue(flow, "csrf_token"),
      },
      options
    )

    if (result.redirectTo) {
      return {
        redirectTo: result.redirectTo,
        flow: null,
      }
    }

    if (isAuthFlow(result.payload)) {
      throwIfFlowHasErrors(result.payload)

      return {
        redirectTo: null,
        flow: result.payload as RecoveryFlow,
      }
    }

    throw new ApiError({
      kind: "auth",
      message: "Не удалось подтвердить код восстановления.",
      details: result.payload,
    })
  },

  createSettingsFlow(options: RequestOptions = {}) {
    return createBrowserFlow<SettingsFlow>(createFlowUrl("/settings"), options)
  },

  getSettingsFlow(flowId: string, options: RequestOptions = {}) {
    return createBrowserFlow<SettingsFlow>(getFlowUrl("/settings", flowId), options)
  },

  async updatePassword(
    flow: SettingsFlow,
    input: SettingsPasswordInput,
    options: RequestOptions = {}
  ) {
    const result = await submitBrowserFlow<unknown>(
      submitFlowUrl("/settings", flow.id),
      {
        method: "password",
        password: input.password,
        csrf_token: getRequiredFlowValue(flow, "csrf_token"),
      },
      options
    )

    if (isAuthFlow(result)) {
      throwIfFlowHasErrors(result)
      return result as SettingsFlow
    }

    return result
  },

  createLogoutFlow(options: RequestOptions = {}) {
    return createBrowserFlow<LogoutFlow>(createFlowUrl("/logout"), options)
  },
}
