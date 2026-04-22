import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"

type AuthAsideShellProps = {
  children: ReactNode
  footer?: ReactNode
}

export function AuthAsideShell({
  children,
  footer,
}: AuthAsideShellProps) {
  return (
    <main className="flex min-h-screen bg-[#ebeef3]">
      <section className="flex min-h-screen w-full max-w-[560px] shrink-0 bg-white">
        <div className="flex min-h-screen w-full flex-col">
          <header className="shrink-0 px-5 py-4">
            <Link href="/" className="inline-flex">
              <Image src="/img/logo.svg" alt="Orbitto" width={200} height={48} priority />
            </Link>
          </header>

          <div className="flex flex-1 items-center px-6 py-8 sm:px-8 lg:px-10">
            <div className="w-full">{children}</div>
          </div>

          {footer ? (
            <footer
              className="mt-auto flex h-[78px] shrink-0 items-center justify-center border-t border-[var(--theme-border-subtle)] px-6 text-center text-[var(--theme-text-secondary)] sm:px-8 lg:px-10"
              style={{
                fontFamily: "var(--theme-font-family-body)",
                fontSize: "var(--theme-text-subtitle-size)",
                fontWeight: "var(--theme-text-subtitle-weight)",
                lineHeight: "var(--theme-text-subtitle-line-height)",
                letterSpacing: "var(--theme-text-subtitle-letter-spacing)",
                textTransform: "var(--theme-text-subtitle-transform)",
              }}
            >
              <span>{footer}</span>
            </footer>
          ) : null}
        </div>
      </section>

      <aside className="hidden min-h-screen flex-1 items-center justify-center bg-[linear-gradient(135deg,#EBEFF4_0%,#E4EBF3_100%)] p-8 lg:flex">
        <Image
          src="/img/signup_bg.svg"
          alt="Orbitto signup illustration"
          width={512}
          height={512}
          priority
          className="h-auto w-full max-w-[512px]"
        />
      </aside>
    </main>
  )
}
