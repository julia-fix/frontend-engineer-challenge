import type { NextRequest } from "next/server"
import { proxyRequest } from "@/app/api/_proxy"

export const dynamic = "force-dynamic"

export function GET(request: NextRequest) {
  return proxyRequest(request, "/self-service")
}

export function POST(request: NextRequest) {
  return proxyRequest(request, "/self-service")
}

export function PUT(request: NextRequest) {
  return proxyRequest(request, "/self-service")
}

export function PATCH(request: NextRequest) {
  return proxyRequest(request, "/self-service")
}

export function DELETE(request: NextRequest) {
  return proxyRequest(request, "/self-service")
}
