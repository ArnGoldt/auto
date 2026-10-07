# Портал сети кузовных мастерских (MVP)

Responsive веб-платформа для сети автосервисов (покраска, сварка, кузовной ремонт) в РФ: CRM, осмотр, смета, производство, мобильный кабинет мастера и личный кабинет клиента.

## Стек

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL + Drizzle ORM
- NextAuth (JWT): сотрудники и клиенты (разные провайдеры credentials)
- Загрузка фото: локальная папка `uploads/` в dev

## Требования

- Node.js 20+
- pnpm
- PostgreSQL 16 (локально или через `docker compose up -d`)

## Быстрый старт

```bash
cp .env.example .env
# при Docker: порт 5432 в compose; без Docker — настройте DATABASE_URL

pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Приложение: [http://localhost:43123](http://localhost:43123)

## Демо-учётки (после seed)

| Роль | Email / логин | Пароль |
|------|----------------|--------|
| Менеджер | `manager@demo.local` | `demo1234` |
| Админ | `admin@demo.local` | `demo1234` |
| Мастер (Юг) | `master1@demo.local` | `demo1234` |
| Мастер (Север) | `master2@demo.local` | `demo1234` |

| Клиент (ЛК) | `dmitry.client` | `demo1234` |

Дополнительные ЛК создаёт **менеджер** в карточке клиента.

## Сценарий демо

1. Войти как **менеджер** → «Обращения» → создать лид или открыть «Анна Новая» → **Осмотр** → сохранить (автосоздание Client/Vehicle/Order).
2. В карточке **заказа** — добавить строки сметы, назначить операцию **master1**.
3. Войти как **master1** на телефоне/узком окне → чек-лист + фото → завершить операцию.
4. В карточке **клиента** — создать доступ в ЛК → войти на `/client/login` → согласовать доп. работы.

## Скрипты

- `pnpm dev` — dev-сервер (порт 43123)
- `pnpm build` / `pnpm start` — production
- `pnpm typecheck` — TypeScript
- `pnpm db:push` — применить схему
- `pnpm db:seed` — демо-данные (повторный запуск может дублировать записи)

## Docker (PostgreSQL)

```bash
docker compose up -d
```

Используйте `DATABASE_URL` из `.env.example` (порт **5432** на хосте при пробросе `5432:5432`; в репозитории для локального PG без Docker — тот же URL на `localhost:5432`).
