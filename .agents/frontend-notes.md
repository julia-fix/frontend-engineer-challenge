# Frontend Notes For AI Agents

## Goal

Build the frontend for the auth challenge in this repo. The required user flows are:

- registration
- login
- password recovery

The evaluation is about engineering quality, not just markup fidelity.

## Current Repo State

- The project is a fresh Next.js 16 App Router app with Tailwind 4 and TypeScript strict mode.
- `app/page.tsx` still contains starter content.
- `app/(auth)/login/page.tsx`, `app/(auth)/registration/page.tsx`, and `app/(auth)/recovery/page.tsx` exist but are empty.
- `features/auth` already exists and contains placeholder API/model/UI files.
- `shared/api/graphql-client.ts`, `shared/api/api-error.ts`, `shared/config/env.ts`, and `app/providers.tsx` are empty placeholders.

## Backend Source Of Truth

The backend is not in this repo. It lives in `../backend` and is currently running in Docker.

Use these files as the main contract references:

- [backend README](/Volumes/Files/projects/tests/Atlantis/backend/README.md)
- [GraphQL schema](/Volumes/Files/projects/tests/Atlantis/backend/api/graphql/schema.graphql)
- [login route](/Volumes/Files/projects/tests/Atlantis/backend/web/src/routes/auth/login.tsx)
- [registration route](/Volumes/Files/projects/tests/Atlantis/backend/web/src/routes/auth/registration.tsx)
- [recovery route](/Volumes/Files/projects/tests/Atlantis/backend/web/src/routes/auth/recovery.tsx)
- [auth journey e2e](/Volumes/Files/projects/tests/Atlantis/backend/e2e/tests/auth-journey.spec.ts)
- [recovery e2e](/Volumes/Files/projects/tests/Atlantis/backend/e2e/tests/recovery.spec.ts)

## Important Contract Warning

- The current frontend placeholder code assumes GraphQL auth operations like `login`, `register`, `recoverPassword`, and `session`.
- The sibling backend schema does not currently expose those operations.
- The backend auth flow is implemented through Ory/Kratos browser self-service flows.
- Do not continue implementing against the placeholder GraphQL auth client without revalidating the contract.

## Local Environment Notes

- Backend default host: `http://orbitto.localhost`
- Auth routes expected by the backend: `/auth/login`, `/auth/registration`, `/auth/recovery`
- Mailpit search API used by backend tests: `http://localhost:8025/api/v1/search`
- Because auth is cookie/browser-flow based, same-origin behavior matters. A plain `localhost:3000` frontend may not share cookies with `orbitto.localhost`.

## Frontend Expectations

- Match the Figma auth UI, but prioritize correctness and state handling over pixel perfection.
- Cover loading, validation, backend failure, success, and retry states.
- Handle duplicate submits and stale async responses.
- Keep accessibility explicit: labels, focus states, route titles, keyboard flow, reduced-motion awareness where relevant.
- Keep architecture modular. Do not collapse everything into a generic shared bucket.
- Update README with assumptions and trade-offs as implementation decisions become concrete.

## Practical Build Order

1. Replace starter page content and define the real route structure.
2. Decide how the Next frontend will talk to the running backend without breaking cookie-based auth.
3. Replace placeholder auth API code with the real transport layer and env config.
4. Build the shared auth layout and reusable form primitives.
5. Implement registration, login, and recovery against the verified backend behavior.
6. Add tests for the critical happy paths and key failure states.

## Decision Heuristic

When task requirements, existing frontend placeholders, and sibling backend behavior conflict:

- trust the running backend contract first
- trust the challenge brief second
- trust placeholder frontend code last
