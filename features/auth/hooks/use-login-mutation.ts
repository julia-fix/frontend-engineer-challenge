"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authApi } from "../api/auth.api"
import type { LoginInput } from "../model/auth.types"
import { authQueryKeys } from "./use-session-query"

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: authQueryKeys.session(),
      })
    },
  })
}
