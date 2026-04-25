"use client"

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LoginForm } from "./login-form"

const pushMock = vi.fn()
const refreshSessionMock = vi.fn()
const {
  mutateAsyncMock,
  resetMock,
  loginMutationState,
} = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  resetMock: vi.fn(),
  loginMutationState: {
    isPending: false,
    isError: false,
    error: null as unknown,
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock("../context/auth-context", () => ({
  useAuth: () => ({
    refreshSession: refreshSessionMock,
  }),
}))

vi.mock("../hooks/use-login-mutation", () => ({
  useLoginMutation: () => ({
    mutateAsync: mutateAsyncMock,
    reset: resetMock,
    ...loginMutationState,
  }),
}))

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockReset()
    mutateAsyncMock.mockReset()
    resetMock.mockReset()
    refreshSessionMock.mockReset()
    loginMutationState.isPending = false
    loginMutationState.isError = false
    loginMutationState.error = null
  })

  it("shows validation errors and blocks submit for invalid credentials", async () => {
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText("Введите e-mail"), {
      target: { value: "wrong-email" },
    })
    fireEvent.change(screen.getByLabelText("Введите пароль"), {
      target: { value: "123" },
    })
    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!)

    expect(await screen.findByText("Недопустимый адрес почты")).toBeInTheDocument()
    expect(screen.getByText("Минимум 8 символов")).toBeInTheDocument()
    expect(mutateAsyncMock).not.toHaveBeenCalled()
    expect(refreshSessionMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("submits valid credentials and redirects to the dashboard", async () => {
    mutateAsyncMock.mockResolvedValueOnce(undefined)
    refreshSessionMock.mockResolvedValueOnce(null)

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText("Введите e-mail"), {
      target: { value: "person@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Введите пароль"), {
      target: { value: "strongPass1" },
    })
    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!)

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        identifier: "person@example.com",
        password: "strongPass1",
      })
    })
    expect(refreshSessionMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith("/dashboard")
  })
})
