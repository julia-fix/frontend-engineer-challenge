"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/features/auth/context/auth-context"
import { Button } from "@/shared/ui/button"

export default function Home() {
  const router = useRouter()
  const auth = useAuth()

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12">
      <div className="w-full max-w-xl rounded-[28px] border border-[var(--auth-line)] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,36,0.08)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--auth-accent)]">
          Orbitto
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
          Welcome
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--auth-muted)]">
          {auth.status === "authenticated"
            ? "Сессия активна. Можно перейти в dashboard или завершить сеанс."
            : "Войдите в систему или создайте аккаунт, чтобы продолжить."}
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          {auth.status === "authenticated" ? (
            <>
              <Button
                variant="primary"
                className="sm:flex-1"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant="secondary"
                className="sm:flex-1"
                onClick={() => {
                  void auth.logout()
                }}
                disabled={auth.isLoggingOut}
              >
                {auth.isLoggingOut ? "Выходим..." : "Logout"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                className="sm:flex-1"
                onClick={() => router.push("/auth/login")}
              >
                Login
              </Button>
              <Button
                variant="secondary"
                className="sm:flex-1"
                onClick={() => router.push("/auth/registration")}
              >
                Signup
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
