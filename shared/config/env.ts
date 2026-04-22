function normalizeOrigin(origin: string): string {
  try {
    return new URL(origin).origin
  } catch {
    throw new Error("NEXT_PUBLIC_BACKEND_ORIGIN must be a valid absolute URL.")
  }
}

const backendOriginValue = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim()

const backendOrigin =
  backendOriginValue && backendOriginValue.length > 0
    ? normalizeOrigin(backendOriginValue)
    : null

function buildBackendUrl(path: `/${string}`): string {
  return backendOrigin ? `${backendOrigin}${path}` : path
}

export const env = {
  backendOrigin,
  graphqlEndpoint: buildBackendUrl("/bff/query"),
  kratosSelfServiceBasePath: buildBackendUrl("/self-service"),
  kratosSessionEndpoint: buildBackendUrl("/sessions/whoami"),
} as const
