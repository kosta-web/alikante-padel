/* ------------------------------------------------------------------
   Site content. Kept in one place so copy / links are easy to edit.
   All external links are placeholders (#) until real URLs are known.
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

export type Category = {
  label: string;
  title: string;
  href: string;
  image: string;
  /** object-position for the photo — tuned per shot so the subject survives the crop */
  focus?: string;
  featured?: boolean;
  subtitle?: string;
};

export const categories: Category[] = [
  {
    label: "Турниры",
    title: "Турниры",
    href: "#",
    image: "/images/category-cards/1.webp",
    focus: "38% 45%",
  },
  {
    label: "Тренировки",
    title: "Тренировки",
    href: "#",
    image: "/images/category-cards/2.webp",
    focus: "42% 45%",
  },
  {
    label: "Ближайшая игра",
    title: "Mexicano El Salt",
    subtitle: "Среда · 19:30–21:30",
    href: "#",
    featured: true,
    image: "/images/category-cards/3.webp",
    focus: "58% 45%",
  },
  {
    label: "Найти партнёра",
    title: "Найти партнёра",
    href: "#",
    image: "/images/category-cards/4.webp",
    focus: "50% 40%",
  },
  {
    label: "Новости",
    title: "Новости",
    href: "#",
    image: "/images/category-cards/5.webp",
    focus: "50% 45%",
  },
  {
    label: "Галерея",
    title: "Галерея",
    href: "#",
    image: "/images/category-cards/6.webp",
    focus: "50% 52%",
  },
];

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

export const journal = {
  eyebrow: "Padel Journal",
  titleLines: [
    { text: "Играть — хорошо.", dim: false },
    { text: "Понимать игру —", dim: true },
    { text: "ещё лучше.", dim: true },
  ],
  body: "Советы, разборы, новости и всё, что помогает играть увереннее.",
  filters: ["Все", "Советы", "Тренировки", "Турниры", "Оборудование", "Истории"],
  allLink: { label: "Все материалы", href: "#" },
  moreLink: { label: "Смотреть все материалы", href: "#" },
  articles: [
    {
      num: "01",
      category: "Советы",
      title: "Как выбрать ракетку под свой уровень",
      href: "#",
      image: "/images/articles/article-1.webp",
    },
    {
      num: "02",
      category: "Тренировки",
      title: "5 ошибок, которые мешают играть стабильнее",
      href: "#",
      image: "/images/articles/article-2.webp",
    },
    {
      num: "03",
      category: "Турниры",
      title: "Americano: как проходит самый популярный формат",
      href: "#",
      image: "/images/articles/article-3.webp",
    },
  ],
};
