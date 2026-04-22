import Link from "next/link"
import { AuthAsideShell } from "@/features/auth/ui/auth-aside-shell"
import { RegistrationForm } from "@/features/auth/ui/registration-form"

export default function RegistrationPage() {
  return (
    <AuthAsideShell
      footer={
        <>
          <span className="mr-1">Уже есть аккаунт?</span>
          <Link className="link-default font-medium" href="/auth/login">
            Войти
          </Link>
        </>
      }
    >
      <div className="mx-auto w-full max-w-[400px]">
        <h1 className="mb-8 text-4xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
          Регистрация в системе
        </h1>
        <RegistrationForm />
      </div>
    </AuthAsideShell>
  )
}
