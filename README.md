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
  content/            queries.ts (чтение), actions.ts (запись), upload.ts (Storage)
  supabase/           public.ts (anon-клиент), admin.ts (service-role-клиент)
  admin-auth.ts        пароль/cookie-сессия /admin
supabase/
  migrations/0001_init.sql   схема, RLS, Storage bucket, сид site_settings/seo_pages
public/
  images/             плейсхолдеры фото для вёрстки (заменить на реальные ассеты)
  fonts/              Onest woff2
```

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
