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

## Стек

- Next.js 16.2.4 App Router
- React 19
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
- Локально backend ожидается на `http://orbitto.localhost`.
- Письма для recovery в backend-сетапе отправляются через Mailpit.

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

```bash
npm run dev
```

После этого приложение доступно на `http://localhost:3000`.

## Проверка

Команды, которые использовались для проверки проекта:

```bash
npm test
npm run lint
npm run build
```

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
- Запросы с `401` и `403` интерпретируются как анонимное состояние, а не как падение интерфейса.
- Recovery и settings flows сохраняют flow state и field-level ошибки, пришедшие от backend.
- Формы показывают и клиентскую валидацию, и backend validation/auth ошибки.
- Inputs имеют явные labels, связанные с полями, что важно для a11y.

## Тесты

Сейчас unit-тесты покрывают:

- helpers для email и password валидации
- перевод и извлечение auth error messages
- валидацию login form и успешный submit flow
- переход recovery form на шаг ввода кода
- блокировку recovery code step при пустом поле кода

Текущие тесты сфокусированы на критичной пользовательской логике.

## Trade-Offs

- Я оставила Next.js App Router, потому что проект уже был на нем, и он дал удобную точку для colocated proxy endpoints. Замена фреймворка здесь увеличила бы риск без пользы для результата задания.
- Для интеграции с Ory/Kratos использован небольшой ручной transport layer вместо более тяжелой auth-абстракции. Это делает поведение явным и ближе к реальному backend-контракту.
- Сначала я добавила unit-тесты. Они дают быстрый фидбек по валидации и ключевому async-поведению форм, но не заменяют полноценную browser-level проверку с Mailpit и живым backend.
- Главная страница пока остается простым entry surface, а не полноценным product landing. Приоритет был отдан обязательным auth-flow сценариям.

## Какие альтернативы рассматривались

- Вызов backend auth через GraphQL:
  отвергнут, потому что backend-контракт не предоставляет таких операций.
- Прямые cross-origin запросы из frontend в `orbitto.localhost`:
  отвергнуты, потому что cookie и redirect поведение в локальной разработке было бы слишком хрупким.
- Более тяжелый global state слой:
  отвергнут, потому что для текущего scope достаточно TanStack Query и небольшого auth context.

## Что бы я сделал следующим шагом в production-версии

- Добавила бы integration или Playwright tests для полного auth journey против живого backend и Mailpit.
- Перенесла бы защиту authenticated routes на серверный уровень, а не только в client-side UI.
- Заменила бы текущую root page на более цельный entry flow.
- Добавила бы observability для неуспешных auth submit'ов и recovery-сценариев.
- Дожала бы retry/cancellation поведение для быстрых route changes и повторной навигации.
- Явно задокументировала бы локальный backend bootstrap, если бы проект передавался команде.

## Demo

На текущий момент в репозитории нет ссылки на hosted demo или screencast.

## Использование ИИ

В репозитории есть `.agents/`-заметки с агентским контекстом разработки, как и требуется в задании.
