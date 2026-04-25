"use client"

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RegistrationForm } from "./registration-form"

const { replaceMock, registerMock, refreshSessionMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  registerMock: vi.fn(),
  refreshSessionMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}))

vi.mock("../api/auth.api", () => ({
  authApi: {
    register: registerMock,
  },
}))

vi.mock("../context/auth-context", () => ({
  useAuth: () => ({
    refreshSession: refreshSessionMock,
  }),
}))

describe("RegistrationForm", () => {
  function renderRegistrationForm() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })

    return render(
      <QueryClientProvider client={queryClient}>
        <RegistrationForm />
      </QueryClientProvider>
    )
  }

  beforeEach(() => {
    replaceMock.mockReset()
    registerMock.mockReset()
    refreshSessionMock.mockReset()
  })

  it("redirects only after registration completes with an active session", async () => {
    registerMock.mockResolvedValueOnce({
      redirectTo: "/profile",
    })
    refreshSessionMock.mockResolvedValueOnce({
      active: true,
      identity: {
        traits: {
          email: "person@example.com",
        },
      },
    })

    renderRegistrationForm()

    fireEvent.change(screen.getByLabelText("Введите e-mail"), {
      target: { value: "person@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Введите пароль"), {
      target: { value: "strongPass1" },
    })
    fireEvent.change(screen.getByLabelText("Повторите пароль"), {
      target: { value: "strongPass1" },
    })
    fireEvent.submit(screen.getByRole("button", { name: "Зарегистрироваться" }).closest("form")!)

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        email: "person@example.com",
        password: "strongPass1",
      })
    })

    expect(refreshSessionMock).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledWith("/profile")
  })

  it("shows an error and blocks redirect when session is still missing", async () => {
    registerMock.mockResolvedValueOnce({
      redirectTo: "/profile",
    })
    refreshSessionMock.mockResolvedValueOnce(null)

    renderRegistrationForm()

    fireEvent.change(screen.getByLabelText("Введите e-mail"), {
      target: { value: "person@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Введите пароль"), {
      target: { value: "strongPass1" },
    })
    fireEvent.change(screen.getByLabelText("Повторите пароль"), {
      target: { value: "strongPass1" },
    })
    fireEvent.submit(screen.getByRole("button", { name: "Зарегистрироваться" }).closest("form")!)

    expect(
      await screen.findByText("Регистрация не завершилась активной сессией. Повторите попытку.")
    ).toBeInTheDocument()
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
