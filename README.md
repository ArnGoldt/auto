# АвтоПортал — сеть мастерских (покраска и сварка)

Веб-платформа для управления ремонтом: CRM, осмотр, сметы, назначения мастерам, чек-листы с телефона, личный кабинет клиента.

## Требования

- Node.js 20+
- PostgreSQL 16

## Быстрый старт

```bash
cp .env.example .env
# PostgreSQL: postgresql://auto:auto@127.0.0.1:5432/autoportal

npm install
npm run db:push
npm run db:seed
npm run dev
```

Приложение: [http://127.0.0.1:43123](http://127.0.0.1:43123)

## Демо-учётки (пароль `demo1234`)

| Роль | Email |
|------|--------|
| Менеджер (все филиалы) | manager@demo.local |
| Мастер (покраска) | master1@demo.local |
| Мастер (сварка) | master2@demo.local |
| QC | qc@demo.local |
| Админ сети | admin@demo.local |

Клиентский ЛК: создайте логин/пароль в карточке клиента (`/app/clients/...`).

## Маршруты

- `/app` — менеджер (desktop)
- `/master` — мастер (mobile-first)
- `/client` — личный кабинет клиента
- `/request` — публичная заявка (только лид)

## Скрипты

- `npm run db:push` — схема БД
- `npm run db:seed` — демо-данные (3 филиала)
- `npm run test` — unit-тесты доменных правил
