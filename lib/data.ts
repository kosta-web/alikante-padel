/* ------------------------------------------------------------------
   Static site copy that isn't admin-editable (nav labels, hero text,
   section headings/intros). Cards, games, price packages, gallery,
   articles and SEO fields are admin-editable and live in Supabase —
   see `lib/types.ts` for their shapes and `lib/content/queries.ts`
   for how they're fetched.
------------------------------------------------------------------ */

export const nav = [
  { label: "Корты", href: "#" },
  { label: "Турниры", href: "#" },
  { label: "Тренировки", href: "#" },
  { label: "О нас", href: "#" },
  { label: "Контакты", href: "#" },
];

export const hero = {
  titleLines: [
    { text: "Падел объединяет людей", dim: false },
    { text: "и превращает обычную игру", dim: false },
    { text: "в часть твоей жизни", dim: true },
  ],
  left: "Тренировки для любого уровня. Учись, играй и становись сильнее.",
  right: "Турниры и игровые встречи каждую неделю в Аликанте.",
};

export const community = {
  eyebrow: "Сообщество",
  titleLines: [
    { text: "Ищешь", dim: false },
    { text: "напарника?", dim: false },
    { text: "Найдём.", dim: true },
  ],
  body: "В Telegram каждый день ищут игроков, собирают пары, договариваются об играх и турнирах.",
  cta: { label: "Найти напарника в Telegram", href: "#" },
  image: "/images/community/community-photo.webp",
  features: [
    "100+ игроков",
    "Анонсы турниров",
    "Поиск напарников",
    "Общение",
    "Аликанте",
  ],
};

export const articlesSection = {
  eyebrow: "Padel Journal",
  titleLines: [
    { text: "Играть — хорошо.", dim: false },
    { text: "Понимать игру —", dim: true },
    { text: "ещё лучше.", dim: true },
  ],
  body: "Советы, разборы, новости и всё, что помогает играть увереннее.",
  allLink: { label: "Все материалы", href: "#" },
  moreLink: { label: "Смотреть все материалы", href: "#" },
};

export const gamesSection = {
  eyebrow: "Игры и мероприятия",
  titleLines: [
    { text: "Играй", dim: false },
    { text: "каждую неделю —", dim: true },
    { text: "не только тренируйся.", dim: true },
  ],
  body: "Турниры, мексикано и игровые встречи для любого уровня — расписание обновляется каждую неделю.",
  allLink: { label: "Все игры", href: "/games" },
};

export const pricesSection = {
  eyebrow: "Цены",
  titleLines: [
    { text: "Тренировки", dim: false },
    { text: "и абонементы", dim: true },
    { text: "под любой график.", dim: true },
  ],
  body: "Разовые занятия и пакеты тренировок — выбери, что подходит по частоте игры.",
  allLink: { label: "Все тарифы", href: "/prices" },
};

export const gallerySection = {
  eyebrow: "Галерея",
  titleLines: [
    { text: "Корты,", dim: false },
    { text: "турниры", dim: true },
    { text: "и моменты игры.", dim: true },
  ],
  body: "Фото с тренировок и турниров TOP PADEL ALICANTE.",
  allLink: { label: "Вся галерея", href: "/gallery" },
};
