"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { authApi } from "../api/auth.api"
import { useAuth } from "../context/auth-context"
import { getAuthErrorMessage, getAuthMessageText } from "../model/auth.errors"
import {
  getFlowNodeMessages,
  isAuthFlow,
  type SettingsFlow,
} from "../model/auth.types"
import { getPasswordLengthError } from "../model/auth.validation"

export function SettingsPasswordForm() {
  const auth = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [flow, setFlow] = useState<SettingsFlow | null>(null)
  const [flowError, setFlowError] = useState<string | null>(null)
  const [isLoadingFlow, setIsLoadingFlow] = useState(true)
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [confirmationError, setConfirmationError] = useState<string | undefined>()
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const updatePasswordMutation = useMutation({
    mutationFn: async (nextPassword: string) => {
      if (!flow) {
        throw new Error("Settings flow is not initialized.")
      }

      return authApi.updatePassword(flow, { password: nextPassword })
    },
    onSuccess: async (nextFlow) => {
      if (isAuthFlow(nextFlow)) {
        setFlow(nextFlow as SettingsFlow)
      }

      await auth.refreshSession()
      router.push("/dashboard")
    },
  })

  useEffect(() => {
    let isActive = true

    async function loadFlow() {
      setIsLoadingFlow(true)
      setFlowError(null)

      try {
        const flowId = searchParams.get("flow")
        const nextFlow = flowId
          ? await authApi.getSettingsFlow(flowId)
          : await authApi.createSettingsFlow()

        if (!isActive) {
          return
        }

        setFlow(nextFlow)
      } catch (error) {
        if (!isActive) {
          return
        }

        setFlowError(getAuthErrorMessage(error))
      } finally {
        if (isActive) {
          setIsLoadingFlow(false)
        }
      }
    }

    void loadFlow()

    return () => {
      isActive = false
    }
  }, [searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)

    const passwordError = getPasswordLengthError(password)
    const passwordConfirmationError = getPasswordLengthError(passwordConfirmation)

    if (passwordError || passwordConfirmationError) {
      setConfirmationError(passwordConfirmationError)
      return
    }

    if (password !== passwordConfirmation) {
      setConfirmationError("Пароли должны совпадать")
      return
    }

    setConfirmationError(undefined)

    try {
      await updatePasswordMutation.mutateAsync(password)
    } catch {}
  }

  const passwordLengthError = hasSubmitted ? getPasswordLengthError(password) : undefined
  const passwordConfirmationLengthError = hasSubmitted
    ? getPasswordLengthError(passwordConfirmation)
    : undefined
  const serverPasswordError =
    updatePasswordMutation.isError &&
    updatePasswordMutation.error instanceof ApiError &&
    isAuthFlow(updatePasswordMutation.error.details)
      ? getFlowNodeMessages(updatePasswordMutation.error.details, "password", "error")[0]
      : undefined

  if (isLoadingFlow) {
    return <div className="flex min-h-[320px] items-center justify-center" />
  }

  if (flowError) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-medium tracking-[-0.03em] text-[var(--foreground)]">
          Новый пароль
        </h1>
        <p className="text-body-md text-secondary">{flowError}</p>
        <Button variant="secondary" type="button" onClick={() => router.push("/auth/login")}>
          Назад ко входу
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-medium tracking-[-0.03em] text-[var(--foreground)]">
          Новый пароль
        </h1>
        <p className="text-body-md text-secondary">
          Придумайте новый пароль для входа в аккаунт.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Input
          id="password"
          label="Введите пароль"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)

            if (updatePasswordMutation.isError) {
              updatePasswordMutation.reset()
            }

            if (confirmationError) {
              setConfirmationError(undefined)
            }
          }}
          error={
            passwordLengthError ??
            (serverPasswordError
              ? getAuthMessageText(serverPasswordError)
              : updatePasswordMutation.isError
                ? getAuthErrorMessage(updatePasswordMutation.error)
                : undefined)
          }
          required
        />

        <Input
          id="password-confirmation"
          label="Повторите пароль"
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => {
            setPasswordConfirmation(event.target.value)

            if (updatePasswordMutation.isError) {
              updatePasswordMutation.reset()
            }

            if (confirmationError) {
              setConfirmationError(undefined)
            }
          }}
          error={passwordConfirmationLengthError ?? confirmationError}
          required
        />

        <Button variant="secondary" type="submit" disabled={updatePasswordMutation.isPending}>
          {updatePasswordMutation.isPending ? "Сохраняем..." : "Сохранить"}
        </Button>
      </form>
    </div>
  )
}
