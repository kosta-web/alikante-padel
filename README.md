# TOP PADEL ALICANTE

Одностраничный сайт падел-клуба, перенесённый с Figma-макета.

## Стек

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- CSS Modules + глобальные CSS-переменные (токены в `app/globals.css`)
- Шрифт **Onest** — self-hosted (`public/fonts/*.woff2`, вариативный, веса 100–900), подключён через `@font-face` с сабсетами latin / latin-ext / cyrillic / cyrillic-ext

## Запуск

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start   # прод
```

## Структура

```
app/
  layout.tsx        корневой layout, preload шрифтов, метаданные
  page.tsx          сборка секций
  globals.css       токены (цвет, радиусы, fluid-типографика), reveal-анимация
components/
  Header.tsx        sticky-шапка, центр-меню, полноэкранное меню по бургеру
  Hero.tsx          H1 в 3 строки + два боковых подтекста
  CategoryCards.tsx 6 карточек-категорий (5 светлых + 1 «фичер» с фото)
  Community.tsx     секция «Сообщество» + чат-баблы с parallax + строка фич
  Journal.tsx       «Padel Journal» + фильтр-табы (рабочая фильтрация) + карточки статей
  Reveal.tsx        обёртка reveal-on-scroll (IntersectionObserver, уважает reduced-motion)
  icons.tsx         SVG-иконки и логотип
lib/
  data.ts           весь контент секций и ссылки (сейчас ссылки — заглушки `#`)
public/
  images/           SVG-плейсхолдеры фото (заменить на реальные ассеты)
  fonts/            Onest woff2
```

## Что заменить перед продом

- **Изображения** — `public/images/*.svg` это временные плейсхолдеры. Реальные фото:
  hero/фичер-карточка, фото корта для «Сообщества», 3 фото статей, аватары в чат-баблах.
- **Ссылки** — в `lib/data.ts` все `href: "#"`. Проставить реальные URL (меню, Telegram, статьи).
- **Логотип** — `components/icons.tsx → LogoMark`, сейчас собран по макету; при наличии оригинального SVG заменить.
- Контакты в футере меню (`Header.tsx`) — плейсхолдеры.

## Адаптив

Брейкпоинты: 1360 / 1120 / 1060 / 900 / 800 / 620 / 560 / 420 (+ fluid `clamp()` между ними).
Подробности перестроений — см. итоговый разбор в истории задачи.
