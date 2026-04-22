import { ApiError } from "./api-error"
import { requestJson } from "./http-client"
import { env } from "@/shared/config/env"

type GraphqlError = {
  message: string
  path?: Array<string | number>
  extensions?: Record<string, unknown>
}

type GraphqlResponse<TData> = {
  data?: TData
  errors?: GraphqlError[]
}

export async function graphqlRequest<
  TData,
  TVariables extends Record<string, unknown> | undefined = undefined,
>(
  query: string,
  variables?: TVariables,
  signal?: AbortSignal
): Promise<TData> {
  const response = await requestJson<GraphqlResponse<TData>>(env.graphqlEndpoint, {
    method: "POST",
    body: variables === undefined ? { query } : { query, variables },
    signal,
  })

  if (response.errors && response.errors.length > 0) {
    throw new ApiError({
      kind: "graphql",
      message: response.errors[0]?.message ?? "GraphQL request failed.",
      details: response.errors,
    })
  }

  if (response.data === undefined) {
    throw new ApiError({
      kind: "graphql",
      message: "GraphQL response did not include data.",
      details: response,
    })
  }

  return response.data
}
