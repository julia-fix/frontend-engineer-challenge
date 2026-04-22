"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { authApi } from "../api/auth.api"
import { getAuthErrorMessage, getAuthMessageText } from "../model/auth.errors"
import {
  getFlowMessages,
  getFlowNodeMessages,
  isAuthFlow,
  type RecoveryFlow,
  type RecoveryInput,
} from "../model/auth.types"
import { getEmailValidationError } from "../model/auth.validation"

export function RecoveryForm() {
  const router = useRouter()
  const recoveryMutation = useMutation({
    mutationFn: (input: RecoveryInput) => authApi.recoverPassword(input),
  })
  const submitCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!recoveryFlow) {
        throw new Error("Recovery flow is not initialized.")
      }

      return authApi.submitRecoveryCode(recoveryFlow, { code })
    },
  })

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [recoveryFlow, setRecoveryFlow] = useState<RecoveryFlow | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [hasCodeSubmitted, setHasCodeSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)

    if (getEmailValidationError(email)) {
      return
    }

    try {
      const nextFlow = await recoveryMutation.mutateAsync({ email })
      setRecoveryFlow(nextFlow)
    } catch {}
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasCodeSubmitted(true)

    if (code.trim().length === 0) {
      return
    }

    try {
      const result = await submitCodeMutation.mutateAsync(code.trim())

      if (result.redirectTo) {
        router.push(result.redirectTo)
      } else if (result.flow) {
        setRecoveryFlow(result.flow)
      }
    } catch {}
  }

  const emailValidationError = hasSubmitted ? getEmailValidationError(email) : undefined
  const recoveryInfoMessage = recoveryFlow
    ? getFlowMessages(recoveryFlow, "info")[0]?.text
    : undefined
  const recoveryCodeServerError =
    submitCodeMutation.isError &&
    submitCodeMutation.error instanceof ApiError &&
    isAuthFlow(submitCodeMutation.error.details)
      ? getFlowNodeMessages(submitCodeMutation.error.details, "code", "error")[0]
      : undefined
  const codeValidationError = hasCodeSubmitted && code.trim().length === 0
    ? "Введите код из письма"
    : undefined

  if (recoveryFlow) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-medium tracking-[-0.03em] text-[var(--foreground)]">
            Проверьте свою почту
          </h1>
          <p className="text-body-md text-secondary">
            {recoveryInfoMessage ??
              "Мы отправили на почту письмо с кодом для восстановления пароля."}
          </p>
        </div>

        <form onSubmit={handleCodeSubmit} className="flex flex-col gap-6">
          <Input
            id="code"
            label="Введите код"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value)

              if (submitCodeMutation.isError) {
                submitCodeMutation.reset()
              }
            }}
            error={
              codeValidationError ??
              (recoveryCodeServerError
                ? getAuthMessageText(recoveryCodeServerError)
                : submitCodeMutation.isError
                  ? getAuthErrorMessage(submitCodeMutation.error)
                  : undefined)
            }
            required
          />

          <Button variant="secondary" type="submit" disabled={submitCodeMutation.isPending}>
            {submitCodeMutation.isPending ? "Проверяем..." : "Продолжить"}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-2">
        <Link
          href="/auth/registration"
          aria-label="Вернуться к регистрации"
          className="mt-2 inline-flex h-6 w-6 shrink-0 items-center justify-center text-[var(--foreground)] transition hover:text-[var(--auth-accent)]"
        >
          <svg width="14" height="24" viewBox="0 0 14 24" fill="none" aria-hidden="true">
            <path
              d="M12 1.5 2 12l10 10.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="text-4xl font-medium tracking-[-0.03em] text-[var(--foreground)]">
            Восстановление пароля
          </h1>
        </div>
      </div>

      <p className="text-body-md text-secondary">
        Укажите адрес почты на который был зарегистрирован аккаунт
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Input
          id="email"
          label="Введите e-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={
            emailValidationError ??
            (recoveryMutation.isError ? getAuthErrorMessage(recoveryMutation.error) : undefined)
          }
          required
        />

        <Button
          variant="secondary"
          type="submit"
          disabled={recoveryMutation.isPending}
        >
          {recoveryMutation.isPending ? "Отправляем..." : "Восстановить пароль"}
        </Button>
      </form>
    </div>
  )
}
