import { AuthCenteredShell } from "@/features/auth/ui/auth-centered-shell"
import { RecoveryForm } from "@/features/auth/ui/recovery-form"

export default function RecoveryPage() {
  return (
    <AuthCenteredShell>
      <RecoveryForm />
    </AuthCenteredShell>
  )
}
