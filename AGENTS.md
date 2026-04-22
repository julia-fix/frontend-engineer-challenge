<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Agent Notes

- Read [task.md](/Volumes/Files/projects/tests/Atlantis/frontend2/task.md) before major product work. This repo is the frontend implementation for the auth challenge: registration, login, and password recovery.
- The backend lives in the sibling folder `../backend` and is expected to be running in Docker already. Do not invent the backend contract from memory.
- Source of truth for backend auth behavior is the sibling backend repo, especially:
  [schema.graphql](/Volumes/Files/projects/tests/Atlantis/backend/api/graphql/schema.graphql),
  [auth/login.tsx](/Volumes/Files/projects/tests/Atlantis/backend/web/src/routes/auth/login.tsx),
  [auth/registration.tsx](/Volumes/Files/projects/tests/Atlantis/backend/web/src/routes/auth/registration.tsx),
  [auth/recovery.tsx](/Volumes/Files/projects/tests/Atlantis/backend/web/src/routes/auth/recovery.tsx),
  [auth-journey.spec.ts](/Volumes/Files/projects/tests/Atlantis/backend/e2e/tests/auth-journey.spec.ts),
  [recovery.spec.ts](/Volumes/Files/projects/tests/Atlantis/backend/e2e/tests/recovery.spec.ts).

# Backend Reality

- The running backend uses Ory/Kratos browser self-service flows behind Traefik.
- Default local host is `http://orbitto.localhost`.
- Auth UI routes in the backend are `/auth/login`, `/auth/registration`, and `/auth/recovery`.
- Recovery mail is exposed through Mailpit; backend tests read it from `http://localhost:8025/api/v1/search`.
- The backend GraphQL schema currently exposes authenticated app data like `me` and `updateProfile`. It does not expose `login`, `register`, `recoverPassword`, or `session` mutations/queries.
- The current frontend files in `features/auth/api/*` assume GraphQL auth operations that do not exist in the sibling backend. Treat them as placeholder scaffolding, not as a trusted contract.

# Frontend Reality

- Stack: Next.js `16.2.4` App Router, React `19.2.4`, TypeScript strict mode, Tailwind CSS `4`, TanStack Query installed.
- `app/page.tsx` is still starter content.
- `app/(auth)/*` route files are present but currently empty.
- `shared/api/graphql-client.ts`, `shared/api/api-error.ts`, `shared/config/env.ts`, and `app/providers.tsx` are currently empty and will need real implementations before integration works.
- `CLAUDE.md` points at this file; keep agent-facing guidance here or in `.agents/`.

# Implementation Expectations

- Build for the challenge requirements, not just the Figma mock: desktop and mobile, loading/error/success states, a11y, and resilient async behavior.
- Avoid dumping everything into generic `components/` and `services/`. Keep clear boundaries such as `features/auth`, `shared`, and additional layers only when they earn their keep.
- Prevent duplicate submits and request races. Treat stale responses and retried submissions as first-class cases.
- Keep README updated with backend assumptions, trade-offs, run instructions, and testing notes.
- Use the backend E2E flows as behavioral acceptance criteria when Figma and code disagree.

# Integration Guidance

- Auth here is cookie- and browser-flow-based, not a simple JSON token exchange.
- Be careful with origin/cookie behavior. Running the Next frontend on `localhost:3000` while the backend expects `orbitto.localhost` can break session cookies and redirects.
- Prefer a same-origin or proxied local setup for auth pages instead of cross-origin fetch hacks.
- If you need the current backend architecture rationale, read [ADR-004](/Volumes/Files/projects/tests/Atlantis/backend/docs/adr/ADR-004-frontend-stack.md) and [backend README](/Volumes/Files/projects/tests/Atlantis/backend/README.md), but follow the actual running contract over older ADR preferences.

# Working Rule

- Before changing auth integration code, verify the contract in `../backend`. This repo already contains misleading placeholder auth API code, so assumptions are likely to be wrong unless checked.
- Keep durable agent notes in [.agents/frontend-notes.md](/Volumes/Files/projects/tests/Atlantis/frontend2/.agents/frontend-notes.md).
