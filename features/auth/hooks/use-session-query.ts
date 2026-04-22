"use client"

import { queryOptions, useQuery } from "@tanstack/react-query"
import { isApiError } from "@/shared/api/api-error"
import { authApi } from "../api/auth.api"
import type { AuthSession } from "../model/auth.types"

export const authQueryKeys = {
  all: ["auth"] as const,
  session: () => [...authQueryKeys.all, "session"] as const,
}

export function getSessionQueryOptions() {
  return queryOptions<AuthSession | null>({
    queryKey: authQueryKeys.session(),
    queryFn: async ({ signal }) => {
      try {
        return await authApi.getSession({ signal })
      } catch (error) {
        if (isApiError(error) && (error.status === 401 || error.status === 403)) {
          return null
        }

        throw error
      }
    },
    staleTime: 60_000,
    retry(failureCount, error) {
      if (isApiError(error) && (error.status === 401 || error.status === 403)) {
        return false
      }

      return failureCount < 2
    },
  })
}

export function useSessionQuery() {
  return useQuery(getSessionQueryOptions())
}
