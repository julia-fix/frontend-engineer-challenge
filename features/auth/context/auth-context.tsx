"use client"

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { authApi, toAppRelativeUrl } from "../api/auth.api"
import { getSessionQueryOptions, authQueryKeys, useSessionQuery } from "../hooks/use-session-query"
import type { AuthSession } from "../model/auth.types"

type AuthStatus = "loading" | "authenticated" | "anonymous"

type AuthContextValue = {
  status: AuthStatus
  session: AuthSession | null
  isLoggingOut: boolean
  refreshSession: () => Promise<AuthSession | null>
  setSession: (session: AuthSession | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const sessionQuery = useSessionQuery()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const session = sessionQuery.data ?? null
  const status: AuthStatus = sessionQuery.isPending
    ? "loading"
    : session
      ? "authenticated"
      : "anonymous"

  async function refreshSession() {
    const nextSession = await queryClient.fetchQuery(getSessionQueryOptions())
    queryClient.setQueryData(authQueryKeys.session(), nextSession)
    return nextSession
  }

  function setSession(nextSession: AuthSession | null) {
    queryClient.setQueryData(authQueryKeys.session(), nextSession)
  }

  async function logout() {
    setIsLoggingOut(true)

    try {
      const flow = await authApi.createLogoutFlow()
      await fetch(toAppRelativeUrl(flow.logout_url), {
        method: "GET",
        credentials: "include",
        redirect: "manual",
      })
      setSession(null)
      window.location.assign("/")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const value: AuthContextValue = {
    status,
    session,
    isLoggingOut,
    refreshSession,
    setSession,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.")
  }

  return context
}
