import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

type AuthCenteredShellProps = {
  children: ReactNode
}

export function AuthCenteredShell({ children }: AuthCenteredShellProps) {
  return (
    <main className="min-h-screen bg-white">
      <header className="px-5 py-4">
        <Link href="/" className="inline-flex">
          <Image src="/img/logo.svg" alt="Orbitto" width={200} height={40} priority />
        </Link>
      </header>

      <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px]">{children}</div>
      </section>
    </main>
  )
}
