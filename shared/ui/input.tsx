"use client"

import {
  forwardRef,
  type InputHTMLAttributes,
  useId,
} from "react"
import { cn } from "@/shared/lib/utils"
import styles from "./input.module.scss"

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string
  error?: boolean | string
  hint?: string
  wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    error,
    hint,
    className,
    wrapperClassName,
    placeholder,
    ...inputProps
  },
  ref
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const message = typeof error === "string" ? error : hint

  return (
    <div className={cn(styles.root, wrapperClassName)}>
      <div className={cn(styles.field, error && styles.fieldError)}>
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          placeholder={placeholder ?? " "}
          className={cn(styles.input, className)}
        />
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      </div>

      {message ? (
        <p className={cn(styles.message, error && styles.messageError)}>{message}</p>
      ) : null}
    </div>
  )
})
