"use client"

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RecoveryForm } from "./recovery-form"

const { pushMock, recoverPasswordMock, submitRecoveryCodeMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  recoverPasswordMock: vi.fn(),
  submitRecoveryCodeMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock("../api/auth.api", () => ({
  authApi: {
    recoverPassword: recoverPasswordMock,
    submitRecoveryCode: submitRecoveryCodeMock,
  },
}))

describe("RecoveryForm", () => {
  function renderRecoveryForm() {
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
        <RecoveryForm />
      </QueryClientProvider>
    )
  }

  beforeEach(() => {
    pushMock.mockReset()
    recoverPasswordMock.mockReset()
    submitRecoveryCodeMock.mockReset()
  })

  it("moves to the code step after a successful email submission", async () => {
    recoverPasswordMock.mockResolvedValueOnce({
      id: "recovery-flow",
      type: "browser",
      expires_at: "2026-01-01T00:00:00.000Z",
      issued_at: "2026-01-01T00:00:00.000Z",
      request_url: "http://orbitto.localhost/auth/recovery",
      ui: {
        action: "/self-service/recovery",
        method: "POST",
        nodes: [],
        messages: [
          {
            id: 101,
            text: "Код отправлен",
            type: "info",
          },
        ],
      },
    })

    renderRecoveryForm()

    fireEvent.change(screen.getByLabelText("Введите e-mail"), {
      target: { value: "person@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Восстановить пароль" }))

    await waitFor(() => {
      expect(recoverPasswordMock).toHaveBeenCalledWith({ email: "person@example.com" })
    })

    expect(await screen.findByText("Проверьте свою почту")).toBeInTheDocument()
    expect(screen.getByText("Код отправлен")).toBeInTheDocument()
  })

  it("requires a code before attempting the second recovery step", async () => {
    recoverPasswordMock.mockResolvedValueOnce({
      id: "recovery-flow",
      type: "browser",
      expires_at: "2026-01-01T00:00:00.000Z",
      issued_at: "2026-01-01T00:00:00.000Z",
      request_url: "http://orbitto.localhost/auth/recovery",
      ui: {
        action: "/self-service/recovery",
        method: "POST",
        nodes: [],
        messages: [],
      },
    })

    renderRecoveryForm()

    fireEvent.change(screen.getByLabelText("Введите e-mail"), {
      target: { value: "person@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Восстановить пароль" }))
    await screen.findByText("Проверьте свою почту")

    fireEvent.submit(screen.getByRole("button", { name: "Продолжить" }).closest("form")!)

    expect(await screen.findByText("Введите код из письма")).toBeInTheDocument()
    expect(submitRecoveryCodeMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })
})
