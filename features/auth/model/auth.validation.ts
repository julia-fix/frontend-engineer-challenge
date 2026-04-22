export const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getPasswordLengthError(value: string): string | undefined {
  if (value.length === 0) {
    return undefined
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return "Минимум 8 символов"
  }

  return undefined
}

export function getEmailValidationError(value: string): string | undefined {
  if (value.length === 0) {
    return undefined
  }

  if (!EMAIL_PATTERN.test(value)) {
    return "Недопустимый адрес почты"
  }

  return undefined
}
