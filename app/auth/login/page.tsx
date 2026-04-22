import Link from "next/link"
import { AuthAsideShell } from "@/features/auth/ui/auth-aside-shell"
import { LoginForm } from "@/features/auth/ui/login-form"

export default function LoginPage() {
  return (
    <AuthAsideShell
      footer={
        <>
          <span className="mr-1">Еще не зарегистрированы?</span>
          <Link className="link-default font-medium" href="/auth/registration">
            Регистрация
          </Link>
        </>
      }
    >
      <div className="mx-auto w-full max-w-[400px]">
        <h1 className="mb-8 text-4xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
          Войти в систему
        </h1>
        <LoginForm />
      </div>
    </AuthAsideShell>
  )
}
