"use client"

import {
  forwardRef,
  type ButtonHTMLAttributes,
} from "react"
import { cn } from "@/shared/lib/utils"
import styles from "./button.module.scss"

type ButtonVariant = "primary" | "secondary" | "tertiary"

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    className,
    type = "button",
    ...buttonProps
  },
  ref
) {
  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      className={cn(styles.button, styles[variant], className)}
    />
  )
})
