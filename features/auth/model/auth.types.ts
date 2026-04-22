export type AuthMessageType = "error" | "info" | "success" | "warning"

export type AuthMessage = {
  id: number
  text: string
  type: AuthMessageType
}

export type AuthUiNode = {
  type: string
  group: string
  attributes: {
    name?: string
    type: string
    value?: string | number | boolean
    required?: boolean
    disabled?: boolean
    autocomplete?: string
    pattern?: string
    maxlength?: number
    node_type?: string
  }
  messages: AuthMessage[]
  meta: {
    label?: {
      id: number
      text: string
      type: string
      context?: Record<string, unknown>
    }
  }
}

type AuthFlowBase = {
  id: string
  type: "browser"
  expires_at: string
  issued_at: string
  request_url: string
  state?: string
  ui: {
    action: string
    method: string
    nodes: AuthUiNode[]
    messages?: AuthMessage[]
  }
}

export type LoginFlow = AuthFlowBase & {
  refresh?: boolean
  requested_aal?: string
}

export type RegistrationFlow = AuthFlowBase & {
  transient_payload?: Record<string, unknown>
}

export type RecoveryFlow = AuthFlowBase & {
  active?: string
  transient_payload?: Record<string, unknown>
}

export type SettingsFlow = AuthFlowBase & {
  active?: string
}

export type AuthFlow = LoginFlow | RegistrationFlow | RecoveryFlow | SettingsFlow

export type AuthSession = {
  id: string
  active: boolean
  authenticated_at: string
  expires_at: string
  issued_at: string
  identity: {
    id: string
    traits: Record<string, unknown>
  }
}

export type LogoutFlow = {
  logout_token: string
  logout_url: string
}

export type LoginInput = {
  identifier: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
}

export type RecoveryInput = {
  email: string
}

export type RecoveryCodeInput = {
  code: string
}

export type SettingsPasswordInput = {
  password: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isAuthFlow(value: unknown): value is AuthFlow {
  if (!isRecord(value) || typeof value.id !== "string" || !isRecord(value.ui)) {
    return false
  }

  return Array.isArray(value.ui.nodes)
}

export function getFlowMessages(
  flow: AuthFlow,
  type?: AuthMessageType
): AuthMessage[] {
  const rootMessages = Array.isArray(flow.ui.messages) ? flow.ui.messages : []
  const nodeMessages = flow.ui.nodes.flatMap((node) => node.messages)
  const messages = [...rootMessages, ...nodeMessages]

  return type ? messages.filter((message) => message.type === type) : messages
}

export function getFlowNodeMessages(
  flow: AuthFlow,
  fieldName: string,
  type?: AuthMessageType
): AuthMessage[] {
  const node = flow.ui.nodes.find((candidate) => candidate.attributes.name === fieldName)
  const messages = Array.isArray(node?.messages) ? node.messages : []

  return type ? messages.filter((message) => message.type === type) : messages
}

export function getFlowNodeValue(
  flow: AuthFlow,
  fieldName: string
): string | undefined {
  const node = flow.ui.nodes.find((candidate) => candidate.attributes.name === fieldName)
  const value = node?.attributes.value

  return typeof value === "string" && value.length > 0 ? value : undefined
}
