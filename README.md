# Orbitto Auth Frontend

Frontend-реализация тестового задания для auth-сценариев: регистрация, вход и восстановление пароля.

Backend, с которым выполнена интеграция: https://github.com/kfreiman/engineer-challenge

## Что реализовано

- Сценарий регистрации
- Сценарий входа
- Сценарий восстановления пароля с шагом ввода кода и установкой нового пароля
- Базовый shell для авторизованного dashboard
- Same-origin proxy из Next.js к backend self-service endpoint'ам
- Loading, validation, error и success состояния в основных auth-формах
- Unit-тесты для критичной валидации и поведения auth-форм
- Отдельная browser-flow integration-проверка регистрации через live Next proxy

## Стек

- Next.js 16.2.4 App Router
- React 19.2.4
- TypeScript strict mode
- Tailwind CSS 4
- Sass modules для переиспользуемых UI-стилей
- TanStack Query для async state и кеширования сессии
- Vitest + Testing Library для unit-тестов

## Контракт backend

Эта frontend-реализация опирается на реальное поведение backend.

Ключевые предположения:

- Backend использует Ory/Kratos browser self-service flows.
- Основные backend-маршруты для frontend: `/self-service/*`, `/sessions/*` и `/bff/*`.
- Для корректной работы auth важны browser cookies и same-origin поведение, поэтому proxy здесь обязателен.
- Адрес upstream для proxy задается через переменные окружения. Если upstream указывает на loopback (`127.0.0.1`, `localhost`, `::1`) и `BACKEND_PROXY_HOST` не задан, proxy по умолчанию пробрасывает `orbitto.localhost`, потому что текущий backend auth-flow ожидает именно этот browser host.
- В текущем backend запрос проверки сессии на `/sessions/whoami` может возвращать `401` или `403`, если активной browser session нет.
- Письма для recovery в backend-сетапе отправляются через Mailpit.
- Регистрация в текущем backend двухшаговая: сначала submit `method=profile` с email, затем submit `method=password`. Успешной она считается только после появления активной сессии на `/sessions/whoami`.
- В этом flow промежуточный шаг может вернуть `400` с новым/обновлённым flow body вместо "чистого" `200`. Это нормальная часть текущего Kratos-контракта, а не обязательно признак поломки.

Текущая backend GraphQL schema отдает данные уже авторизованного приложения, например `me` и `updateProfile`, но не содержит `login`, `register`, `recoverPassword` или `session`. Поэтому auth-интеграция во frontend построена через self-service endpoints.

## Запуск

### Требования

- Node.js 20+
- npm
- Локально запущенный backend из `kfreiman/engineer-challenge`

### Установка

```bash
npm install
```

### Запуск dev-сервера

Перед запуском настрой переменные окружения для proxy. Пример уже лежит в репозитории:

```bash
cp .env.example .env.local
```

Для локального запуска используется proxy к backend через:

```bash
BACKEND_PROXY_ORIGIN=http://127.0.0.1
BACKEND_PROXY_HOST=orbitto.localhost
BACKEND_PROXY_PROTO=http
```

`BACKEND_PROXY_HOST` можно не задавать, если upstream остаётся loopback-hostом и нужен стандартный локальный backend host `orbitto.localhost`.

Frontend-код ходит в backend только через same-origin proxy routes: `/bff/*`, `/self-service/*` и `/sessions/*`. Прямой клиентский вызов backend по отдельному origin здесь не поддерживается, чтобы не обойти cookie-based proxy сценарий.

```bash
npm run dev
```

После этого приложение доступно на `http://localhost:3000`.

## Проверка

Команды для проверки проекта:

```bash
npm test
npm run test:auth-integration
npm run lint
npm run build
```

### Ручная проверка

- Для ручной проверки использовался backend из репозитория `kfreiman/engineer-challenge`, ветка `master`.
- Backend запускался в development-режиме командой `make dev`.
- Вручную были пройдены сценарии: регистрация, вход, восстановление пароля, logout и редирект с защищенной страницы при отсутствии активной сессии.

### Что именно проверяют тесты

- `npm test` запускает unit-тесты. Они проверяют UI-валидацию, локальную обработку ошибок и поведение форм вокруг auth context, но не доказывают, что живой backend flow завершится активной сессией.
- `npm run test:auth-integration` запускает живую проверку регистрации против `http://localhost:3000`, используя реальные `/self-service/*` и `/sessions/*` proxy routes. Для этого теста должны быть подняты и Next frontend, и backend Docker stack.

## Архитектура

Проект разбит по зонам ответственности:

- `app/`
  Next.js routes, providers и proxy route handlers.
- `features/auth/`
  Auth-специфичная API-интеграция, model helpers, context, hooks и UI.
- `shared/`
  Переиспользуемые transport helpers, config, primitives, styles и utility functions.

Ключевые решения:

- `app/self-service/[...path]`, `app/sessions/[...path]` и `app/bff/[...path]` проксируют запросы в backend.
- `features/auth/api/auth.api.ts` реализует transport-слой для Ory/Kratos browser flows.
- `features/auth/context/auth-context.tsx` централизует состояние сессии и logout.
- TanStack Query отвечает за получение и инвалидирование сессии.
- Локальная валидация остается рядом с формами, а backend auth-ошибки нормализуются через shared helpers.

## UX И Надежность

- Повторные submit'ы блокируются через disabled-состояние кнопок во время pending mutation.
- Для проверки сессии ответы `401` и `403` от `/sessions/whoami` интерпретируются как анонимное состояние пользователя, а не как падение интерфейса. Это привязано к текущему backend-контракту, а не рассматривается как универсальное правило для любых API-запросов.
- Recovery и settings flows сохраняют flow state и field-level ошибки, пришедшие от backend.
- Формы показывают и клиентскую валидацию, и backend validation/auth ошибки.
- Inputs имеют явные labels, связанные с полями, что важно для a11y.
- Registration flow не считается завершенным только по успешному submit: frontend дополнительно подтверждает активную сессию и только потом выполняет post-auth redirect.

## Тесты

Сейчас `npm test` покрывает:

- helpers для email и password валидации
- перевод и извлечение auth error messages
- валидацию login form и клиентское поведение успешного submit flow
- переход recovery form на шаг ввода кода
- блокировку recovery code step при пустом поле кода

Отдельно `npm run test:auth-integration` проверяет, что двухшаговая регистрация через живой frontend proxy действительно заканчивается активной сессией на `/sessions/whoami`.

## Trade-Offs

- Для интеграции с Ory/Kratos использован небольшой ручной transport layer вместо более тяжелой auth-абстракции. Это делает поведение явным и ближе к реальному backend-контракту.
- Полный auth journey пока покрыт частично: живая integration-проверка есть только для регистрации. Login и recovery по-прежнему лучше закрыть отдельными browser-level сценариями против живого backend и Mailpit.
- Защита `/dashboard` пока оставлена на client-side уровне через состояние сессии в браузере. Это закрыло UI-сценарий в рамках задания, но server-side route protection для authenticated pages остается сознательно отложенной и нужна в следующей итерации.
- Главная страница пока остается простым entry surface, а не полноценным product landing. Приоритет был отдан обязательным auth-flow сценариям.

## Какие альтернативы рассматривались

- Вызов backend auth через GraphQL:
  отвергнут, потому что backend-контракт не предоставляет таких операций.
- Прямые cross-origin запросы из frontend в `orbitto.localhost`:
  отвергнуты, потому что cookie и redirect поведение в локальной разработке было бы слишком хрупким.
- Более тяжелый global state слой:
  отвергнут, потому что для текущего scope достаточно TanStack Query и небольшого auth context.

## Следующие шаги для production-версии

- Добавить integration или Playwright tests для login и recovery journey против живого backend и Mailpit.
- Перенести защиту authenticated routes на серверный уровень, а не только в client-side UI.
- Заменить текущую root page на более цельный entry flow.
- Добавить observability для неуспешных auth submit'ов и recovery-сценариев.
- Дожать retry/cancellation поведение для быстрых route changes и повторной навигации.
- Явно задокументировать локальный backend bootstrap для передачи проекта команде.

## Demo

На текущий момент в репозитории нет ссылки на hosted demo или screencast.

## Использование ИИ

В репозитории есть `.agents/`-заметки с агентским контекстом разработки, как и требуется в задании.
