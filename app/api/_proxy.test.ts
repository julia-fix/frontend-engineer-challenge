import { afterEach, describe, expect, it, vi } from "vitest"
import { resolveBackendHost } from "./_proxy"

describe("resolveBackendHost", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("prefers the configured backend host", () => {
    vi.stubEnv("BACKEND_PROXY_HOST", "custom.localhost")

    expect(resolveBackendHost(new URL("http://127.0.0.1"))).toBe("custom.localhost")
  })

  it("falls back to orbitto.localhost for loopback upstreams", () => {
    expect(resolveBackendHost(new URL("http://127.0.0.1"))).toBe("orbitto.localhost")
    expect(resolveBackendHost(new URL("http://localhost"))).toBe("orbitto.localhost")
    expect(resolveBackendHost(new URL("http://[::1]"))).toBe("orbitto.localhost")
  })

  it("keeps the upstream host for non-loopback origins", () => {
    expect(resolveBackendHost(new URL("https://api.example.com:8443"))).toBe(
      "api.example.com:8443"
    )
  })
})
