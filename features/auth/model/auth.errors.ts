import { ApiError, getErrorMessageFromPayload } from "@/shared/api/api-error"
import { getFlowMessages, isAuthFlow, type AuthMessage } from "./auth.types"

const authMessageTranslations = new Map<number, string>([
  [4000007, "Данный адрес уже занят"],
  [
    4000034,
    "Этот пароль уже встречался в утечках данных. Используйте другой, более надежный пароль.",
  ],
])

export function getAuthMessageText(message: AuthMessage): string {
  return authMessageTranslations.get(message.id) ?? message.text
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (isAuthFlow(error.details)) {
      const flowError = getFlowMessages(error.details, "error")[0]

      if (flowError) {
        return getAuthMessageText(flowError)
      }
    }

    const payloadMessage = getErrorMessageFromPayload(error.details)

    if (payloadMessage) {
      return payloadMessage
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Что-то пошло не так."
}
