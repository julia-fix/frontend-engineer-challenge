"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useAuth } from "../context/auth-context"
import { useLoginMutation } from "../hooks/use-login-mutation"
import { getAuthErrorMessage } from "../model/auth.errors"
import { isAuthFlow } from "../model/auth.types"
import {
  getEmailValidationError,
  getPasswordLengthError,
} from "../model/auth.validation"

function hasInvalidCredentialsError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false
  }

  if (!isAuthFlow(error.details)) {
    return false
  }

  return true
}

export function LoginForm() {
  const router = useRouter()
  const auth = useAuth()
  const loginMutation = useLoginMutation()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [hasSubmitted, setHasSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)

    if (getEmailValidationError(identifier) || getPasswordLengthError(password)) {
      return
    }

    try {
      await loginMutation.mutateAsync({ identifier, password })
      await auth.refreshSession()
      router.push("/dashboard")
    } catch {}
  }

  const sharedLoginError = loginMutation.isError
    ? hasInvalidCredentialsError(loginMutation.error)
      ? "Введены неверные данные"
      : getAuthErrorMessage(loginMutation.error)
    : undefined
  const emailValidationError = hasSubmitted ? getEmailValidationError(identifier) : undefined
  const passwordLengthError = hasSubmitted ? getPasswordLengthError(password) : undefined

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="email"
        label="Введите e-mail"
        type="email"
        autoComplete="email"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        error={emailValidationError ?? (Boolean(sharedLoginError) && !passwordLengthError)}
        required
      />

      <Input
        id="password"
        label="Введите пароль"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={passwordLengthError ?? (emailValidationError ? undefined : sharedLoginError)}
        required
      />

      <Button
        variant="primary"
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Входим..." : "Войти"}
      </Button>

      <Button
        variant="tertiary"
        className="mx-auto w-fit"
        onClick={() => router.push("/auth/recovery")}
      >
        Забыли пароль?
      </Button>
    </form>
  )
}
