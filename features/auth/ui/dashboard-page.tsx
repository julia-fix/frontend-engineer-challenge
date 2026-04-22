"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/auth-context"
import { Button } from "@/shared/ui/button"

export function DashboardPage() {
  const router = useRouter()
  const auth = useAuth()

  useEffect(() => {
    if (auth.status === "anonymous") {
      router.replace("/")
    }
  }, [auth.status, router])

  if (auth.status === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--background)]" />
  }

  if (auth.status === "anonymous") {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--background)]" />
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--auth-line)] bg-white">
        <div className="mx-auto flex min-h-18 w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--auth-accent)]">
              Orbitto
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[var(--auth-muted)] sm:inline">
              {String(auth.session?.identity.traits.email ?? "")}
            </span>
            <Button
              variant="tertiary"
              onClick={() => {
                void auth.logout()
              }}
              disabled={auth.isLoggingOut}
            >
              {auth.isLoggingOut ? "Выходим..." : "Выйти"}
            </Button>
          </div>
        </div>
      </header>
    </main>
  )
}
