import { describe, expect, it } from "vitest"
import {
  MIN_PASSWORD_LENGTH,
  getEmailValidationError,
  getPasswordLengthError,
} from "./auth.validation"

describe("auth.validation", () => {
  it("accepts blank values before submit and rejects malformed email", () => {
    expect(getEmailValidationError("")).toBeUndefined()
    expect(getEmailValidationError("invalid-email")).toBe("Недопустимый адрес почты")
    expect(getEmailValidationError("person@example.com")).toBeUndefined()
  })

  it("enforces the minimum password length", () => {
    expect(getPasswordLengthError("")).toBeUndefined()
    expect(getPasswordLengthError("x".repeat(MIN_PASSWORD_LENGTH - 1))).toBe(
      "Минимум 8 символов"
    )
    expect(getPasswordLengthError("x".repeat(MIN_PASSWORD_LENGTH))).toBeUndefined()
  })
})
