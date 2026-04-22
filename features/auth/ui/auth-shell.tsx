import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  sideTitle: string
  sideDescription: string
  highlights: string[]
  footer: ReactNode
  children: ReactNode
}

export function AuthShell({
  eyebrow,
  title,
  description,
  sideTitle,
  sideDescription,
  highlights,
  footer,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[32px] border border-[var(--auth-line)] bg-[var(--auth-surface)] shadow-[0_24px_80px_rgba(18,24,31,0.08)] lg:grid-cols-[minmax(0,1.15fr)_minmax(440px,520px)]">
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0f1724_0%,#14345f_54%,#0f5dca_100%)] px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute left-[-10%] top-[-12%] h-64 w-64 rounded-full bg-[rgba(255,255,255,0.16)] blur-3xl" />
            <div className="absolute bottom-[-14%] right-[-6%] h-72 w-72 rounded-full bg-[rgba(255,209,102,0.22)] blur-3xl" />
            <div className="absolute inset-x-8 inset-y-8 rounded-[28px] border border-[rgba(255,255,255,0.16)]" />
          </div>

          <div className="relative flex h-full flex-col">
            <AuthLogo />

            <div className="mt-12 max-w-xl lg:mt-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.72)]">
                {eyebrow}
              </p>
              <h1 className="mt-5 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl">
                {sideTitle}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[rgba(255,255,255,0.78)] sm:text-lg">
                {sideDescription}
              </p>

              <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                {highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="rounded-2xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-sm leading-6 text-[rgba(255,255,255,0.92)] backdrop-blur"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="flex items-center bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,247,250,0.94)_100%)] px-4 py-6 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[28px] border border-[var(--auth-line)] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,36,0.08)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--auth-accent)]">
                {eyebrow}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--auth-muted)]">
                {description}
              </p>

              <div className="mt-8">{children}</div>
            </div>

            <div className="mt-5 text-center text-sm text-[var(--auth-muted)]">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  )
}

export function AuthLogo() {
  return (
    <Link
      href="/"
      className="inline-flex w-fit items-center gap-3 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold tracking-[0.12em] text-white uppercase backdrop-blur"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-[#0f1724]">
        O
      </span>
      Orbitto
    </Link>
  )
}

type AuthStatusProps = {
  tone: "error" | "info" | "success"
  children: ReactNode
}

export function AuthStatus({ tone, children }: AuthStatusProps) {
  const toneClasses = {
    error:
      "border-[rgba(218,63,63,0.22)] bg-[rgba(218,63,63,0.08)] text-[var(--auth-danger)]",
    info: "border-[rgba(14,95,255,0.18)] bg-[rgba(14,95,255,0.08)] text-[var(--auth-accent-strong)]",
    success:
      "border-[rgba(18,148,92,0.18)] bg-[rgba(18,148,92,0.08)] text-[var(--auth-success)]",
  }

  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm leading-6", toneClasses[tone])}>
      {children}
    </div>
  )
}
