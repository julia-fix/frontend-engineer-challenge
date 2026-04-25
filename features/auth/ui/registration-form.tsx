"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { authApi } from "../api/auth.api"
import { ApiError } from "@/shared/api/api-error"
import { useAuth } from "../context/auth-context"
import { getAuthErrorMessage, getAuthMessageText } from "../model/auth.errors"
import {
  getFlowMessages,
  getFlowNodeMessages,
  isAuthFlow,
  type RegisterInput,
} from "../model/auth.types"
import {
  getEmailValidationError,
  getPasswordLengthError,
} from "../model/auth.validation"

export function RegistrationForm() {
  const router = useRouter()
  const auth = useAuth()
  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
  })

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [confirmationError, setConfirmationError] = useState<string | undefined>()
  const [completionError, setCompletionError] = useState<string | undefined>()
  const [hasSubmitted, setHasSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)

    const emailError = getEmailValidationError(email)
    const passwordError = getPasswordLengthError(password)
    const passwordConfirmationError = getPasswordLengthError(passwordConfirmation)

    if (emailError || passwordError || passwordConfirmationError) {
      setConfirmationError(passwordConfirmationError)
      return
    }

    if (password !== passwordConfirmation) {
      setConfirmationError("Пароли должны совпадать")
      return
    }

    setConfirmationError(undefined)
    setCompletionError(undefined)

    try {
      const result = await registerMutation.mutateAsync({
        email,
        password,
      })

      const session = await auth.refreshSession()

      if (!session?.active) {
        setCompletionError("Регистрация не завершилась активной сессией. Повторите попытку.")
        return
      }

      router.replace(result.redirectTo ?? "/dashboard")
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setCompletionError("Не удалось подтвердить активную сессию после регистрации.")
      }
    }
  }

  const emailValidationError = hasSubmitted ? getEmailValidationError(email) : undefined
  const passwordLengthError = hasSubmitted ? getPasswordLengthError(password) : undefined
  const passwordConfirmationLengthError = hasSubmitted
    ? getPasswordLengthError(passwordConfirmation)
    : undefined
  const registrationEmailServerError =
    registerMutation.isError &&
    registerMutation.error instanceof ApiError &&
    isAuthFlow(registerMutation.error.details)
      ? getFlowNodeMessages(registerMutation.error.details, "traits.email", "error")[0]
      : undefined
  const registrationRootServerError =
    registerMutation.isError &&
    registerMutation.error instanceof ApiError &&
    isAuthFlow(registerMutation.error.details)
      ? getFlowMessages(registerMutation.error.details, "error")[0]
      : undefined
  const registrationEmailErrorMessage = registrationEmailServerError
    ? getAuthMessageText(registrationEmailServerError)
    : registrationRootServerError?.id === 4000007
      ? getAuthMessageText(registrationRootServerError)
      : undefined
  const registrationPasswordServerError =
    registerMutation.isError &&
    registerMutation.error instanceof ApiError &&
    isAuthFlow(registerMutation.error.details)
      ? getFlowNodeMessages(registerMutation.error.details, "password", "error")[0]
      : undefined

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="email"
        label="Введите e-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value)

          if (registerMutation.isError) {
            registerMutation.reset()
          }

          if (completionError) {
            setCompletionError(undefined)
          }
        }}
        error={
          emailValidationError ??
          registrationEmailErrorMessage
        }
        required
      />

      <Input
        id="password"
        label="Введите пароль"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value)

          if (registerMutation.isError) {
            registerMutation.reset()
          }

          if (confirmationError) {
            setConfirmationError(undefined)
          }

          if (completionError) {
            setCompletionError(undefined)
          }
        }}
        error={
          passwordLengthError ??
          (registrationEmailErrorMessage
            ? undefined
            : registrationPasswordServerError
              ? getAuthMessageText(registrationPasswordServerError)
              : registerMutation.isError
              ? getAuthErrorMessage(registerMutation.error)
              : completionError)
        }
        required
      />

      <Input
        id="password-confirmation"
        label="Повторите пароль "
        type="password"
        autoComplete="new-password"
        value={passwordConfirmation}
        onChange={(event) => {
          setPasswordConfirmation(event.target.value)

          if (registerMutation.isError) {
            registerMutation.reset()
          }

          if (confirmationError) {
            setConfirmationError(undefined)
          }

          if (completionError) {
            setCompletionError(undefined)
          }
        }}
        error={passwordConfirmationLengthError ?? confirmationError}
        required
      />

      <Button
        variant="primary"
        type="submit"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? "Регистрируем..." : "Зарегистрироваться"}
      </Button>

      <p className="text-center text-sm leading-6 text-[var(--auth-muted)]">
        Зарегистрировавшись пользователь принимает условия{" "}
        <a className="link-underlined" href="#">
          договора оферты
        </a>{" "}
        и{" "}
        <a className="link-underlined" href="#">
          политики конфиденциальности
        </a>
      </p>
    </form>
  )
}
