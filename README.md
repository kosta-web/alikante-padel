# TOP PADEL ALICANTE

Одностраничный сайт падел-клуба, перенесённый с Figma-макета.

## Стек

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Supabase** — Postgres (админ-контент) + Storage (фото), см. «Backend» ниже
- CSS Modules + глобальные CSS-переменные (токены в `app/globals.css`)
- Шрифт **Onest** — self-hosted (`public/fonts/*.woff2`, вариативный, веса 100–900), подключён через `@font-face` с сабсетами latin / latin-ext / cyrillic / cyrillic-ext

## Запуск

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start   # прод
```

Перед первым запуском настройте Supabase — см. «Backend».

## Backend (Supabase)

Весь админ-редактируемый контент (карточки главной, игры, цены, галерея, статьи,
категории, настройки сайта, SEO по страницам) живёт в Supabase, а не в коде.

1. Создайте проект на [supabase.com](https://supabase.com) (или используйте существующий).
2. Откройте **SQL Editor** и выполните `supabase/migrations/0001_init.sql` целиком —
   он создаёт все таблицы, RLS-политики, Storage bucket `site-media` и сидит
   стартовые строки (`site_settings`, `seo_pages`).
3. Заполните `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # Project Settings → API → anon/publishable key
   SUPABASE_SERVICE_ROLE_KEY=...              # Project Settings → API → service_role key (секрет, только для сервера)
   ```

Публичные страницы читают данные анонимным (publishable) ключом — RLS разрешает
читать всё, кроме неопубликованных статей. Админка (`/admin/*`) читает и пишет через
service-role ключ (в Server Actions из `lib/content/actions.ts` / `queries.ts`),
минуя RLS; доступ к самой админке — отдельная cookie-сессия по паролю
(`ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET`), как и раньше. Загрузка фото в
`ImageUploader` уходит в Storage bucket `site-media` через ту же service-role
Server Action (`lib/content/upload.ts`).

## Структура

```
app/
  layout.tsx          корневой layout, preload шрифтов, fallback-метаданные
  page.tsx            сборка секций главной + generateMetadata из Supabase
  games/, prices/, gallery/, articles/[slug]/   отдельные страницы + свои generateMetadata
  admin/              /admin — логин, дашборд, разделы (обёрнуты в ContentProvider)
  globals.css         токены (цвет, радиусы, fluid-типографика), reveal-анимация
components/
  Header.tsx          sticky-шапка, центр-меню, полноэкранное меню по бургеру
  Hero.tsx            H1 в 3 строки + два боковых подтекста + секция карточек-категорий
  CategoryCards.tsx   карточки-категории, рендерится внутри Hero
  Games.tsx / Prices.tsx / Gallery.tsx   тизеры на главной → ссылки на /games, /prices, /gallery
  Community.tsx       секция «Сообщество» + фото + строка фич
  Articles.tsx        «Padel Journal» + фильтр-табы + карточки статей
  Reveal.tsx          обёртка reveal-on-scroll (IntersectionObserver, уважает reduced-motion)
  icons.tsx           SVG-иконки и логотип
  admin/              формы/виджеты админки (ImageUploader грузит в Supabase Storage)
lib/
  data.ts             статичный копирайт, не завязанный на БД (nav, hero, заголовки секций)
  types.ts            типы админ-редактируемых сущностей (Card, Article, Game, …)
  content-store.tsx   клиентский стор для /admin (fetch/CRUD через Server Actions)
  content/            core.ts (чтение/запись/загрузка, без проверки доступа),
                      actions.ts и queries.ts (то же под cookie-сессией /admin),
                      upload.ts (Storage), mappers.ts (строка БД → тип приложения)
  telegram/           бот-админка: config.ts (доступ), api.ts (клиент Bot API),
                      session.ts (состояние диалога), sections.ts (разделы и поля),
                      bot.ts (экраны и разбор обновлений)
  supabase/           public.ts (anon-клиент), admin.ts (service-role-клиент)
  admin-auth.ts        пароль/cookie-сессия /admin
app/api/
  telegram/webhook/   точка, на которую Telegram шлёт сообщения (setWebhook)
supabase/
  migrations/0001_init.sql   схема, RLS, Storage bucket, сид site_settings/seo_pages
  migrations/0003_telegram_sessions.sql   состояние диалога с ботом
public/
  images/             плейсхолдеры фото для вёрстки (заменить на реальные ассеты)
  fonts/              Onest woff2
```

## Админка в Telegram

Тот же контент правится из чата с ботом — новости, цены, игры, галерея (включая
загрузку фото), карточки главной, SEO и настройки сайта.

Логика записи общая с веб-админкой: `lib/content/core.ts` умеет читать и писать,
но ничего не знает о доступе. Проверку делает каждый вход своим способом —
`/admin` сверяет cookie-сессию (`actions.ts`, `queries.ts`), бот сверяет
отправителя с `TELEGRAM_ADMIN_IDS`. Поэтому правка из Telegram так же сбрасывает
кэш страниц, и сайт обновляется сразу.

Разделы и поля описаны таблицей в `lib/telegram/sections.ts` — экраны собираются
из неё, а не пишутся по одному на раздел. Даты и время вводятся в виде
`20.09.2026 18:30` и разбираются в зоне клуба (Europe/Madrid), а не в UTC,
в котором живёт функция на Vercel.

Библиотеки для ботов нет намеренно: нужны пять методов Bot API, и они лежат в
`lib/telegram/api.ts` — маршрутизация всё равно своя, а состояние диалога и так
живёт в Supabase (вебхук на Vercel не помнит ничего между сообщениями).

### Подключение

1. Переменные — в `.env.local` и в Environment Variables проекта на Vercel:
   ```
   TELEGRAM_BOT_TOKEN=...       # @BotFather → /mybots → API Token
   TELEGRAM_ADMIN_IDS=...       # свой Telegram ID (@userinfobot), можно несколько через запятую
   TELEGRAM_WEBHOOK_SECRET=...  # любая случайная строка, например `openssl rand -hex 32`
   ```
2. Выполнить `supabase/migrations/0003_telegram_sessions.sql` в SQL Editor Supabase.
3. Задеплоить и один раз указать Telegram адрес вебхука:
   ```bash
   set -a; . ./.env.local; set +a
   curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=https://ВАШ-ДОМЕН/api/telegram/webhook" \
     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET" \
     -d "drop_pending_updates=true"
   ```
   Проверка — `getWebhookInfo`: важны `pending_update_count` и `last_error_message`.

Посторонним бот не отвечает вовсе — молчание не подсказывает, что за этим
адресом админка. Вебхук дополнительно закрыт заголовком
`X-Telegram-Bot-Api-Secret-Token`, который сверяется постоянным по времени
сравнением.

## Что заменить перед продом

- Карточки главной, игры, цены, галерея и статьи теперь редактируются в `/admin` —
  **не** хардкодить их обратно в `lib/data.ts`. Применимо только к тому, что
  действительно осталось статикой (см. ниже).
- **Изображения** — `public/images/*.svg` (аватары в чат-баблах Community) и
  `community.image` в `lib/data.ts` — временные плейсхолдеры.
- **Ссылки** — `nav` в `lib/data.ts` и ссылка Telegram в `community.cta` — всё ещё `href: "#"`.
- **Логотип** — `components/icons.tsx → LogoMark`, сейчас собран по макету; при наличии оригинального SVG заменить.
- Контакты в футере меню (`Header.tsx`) — плейсхолдеры.

## Адаптив

Брейкпоинты: 1360 / 1120 / 1060 / 900 / 800 / 620 / 560 / 420 (+ fluid `clamp()` между ними).
Подробности перестроений — см. итоговый разбор в истории задачи.
