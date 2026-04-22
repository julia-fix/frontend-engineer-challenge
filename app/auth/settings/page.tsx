import { Suspense } from "react"
import { AuthCenteredShell } from "@/features/auth/ui/auth-centered-shell"
import { SettingsPasswordForm } from "@/features/auth/ui/settings-password-form"

export default function SettingsPage() {
  return (
    <AuthCenteredShell>
      <Suspense fallback={<div className="min-h-[320px]" />}>
        <SettingsPasswordForm />
      </Suspense>
    </AuthCenteredShell>
  )
}
