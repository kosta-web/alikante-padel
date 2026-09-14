-- Восстановление исходного контента макета: 6 карточек Hero и 3 статьи
-- Padel Journal. До переезда на Supabase они лежали статикой в `lib/data.ts`
-- (коммит fedd979), а миграция 0001 создала таблицы пустыми — из-за чего на
-- главной осталась одна карточка и одна статья.
--
-- `image_path` указывает на плейсхолдеры из `public/images/…`: `publicImageUrl()`
-- отдаёт корневые пути как есть, так что сайт сразу выглядит как макет. Загрузка
-- картинки через /admin перезапишет значение ключом в Storage.
--
-- Идемпотентна: каждая вставка защищена `where not exists`, поэтому строки,
-- заведённые вручную (карточка «Турниры», статья про ракетку), не дублируются.

-- ---------------------------------------------------------------------------
-- cards
-- ---------------------------------------------------------------------------
insert into public.cards (label, title, subtitle, href, image_path, focus, featured, sort_order)
select v.label, v.title, v.subtitle, '#', v.image_path, v.focus, v.featured, v.sort_order
from (values
  ('Турниры',        'Турниры',          null,                  '/images/category-cards/1.webp', '38% 45%', false, 0),
  ('Тренировки',     'Тренировки',       null,                  '/images/category-cards/2.webp', '42% 45%', false, 1),
  ('Ближайшая игра', 'Mexicano El Salt', 'Среда · 19:30–21:30', '/images/category-cards/3.webp', '58% 45%', true,  2),
  ('Найти партнёра', 'Найти партнёра',   null,                  '/images/category-cards/4.webp', '50% 40%', false, 3),
  ('Новости',        'Новости',          null,                  '/images/category-cards/5.webp', '50% 45%', false, 4),
  ('Галерея',        'Галерея',          null,                  '/images/category-cards/6.webp', '50% 52%', false, 5)
) as v(label, title, subtitle, image_path, focus, featured, sort_order)
where not exists (select 1 from public.cards c where c.label = v.label);

-- Карточка «Турниры» была заведена руками до сида: у неё уже загружена своя
-- картинка, поэтому трогаем только позицию и кадрирование.
update public.cards
set focus = coalesce(focus, '38% 45%'), sort_order = 0
where label = 'Турниры';

-- ---------------------------------------------------------------------------
-- article_categories — фильтры Padel Journal из макета
-- ---------------------------------------------------------------------------
insert into public.article_categories (label)
select v.label
from (values ('Советы'), ('Тренировки'), ('Турниры'), ('Оборудование'), ('Истории')) as v(label)
where not exists (select 1 from public.article_categories c where c.label = v.label);

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------
-- `published_at` убывает от первой карточки к третьей: секция сортирует статьи
-- по дате по убыванию, так сохраняется порядок 01 / 02 / 03 из макета.
insert into public.articles (slug, title, category_id, image_path, body, published, published_at)
select
  v.slug,
  v.title,
  (select id from public.article_categories c where c.label = v.category limit 1),
  v.image_path,
  '',
  true,
  v.published_at::date
from (values
  ('kak-vybrat-raketku-pod-svoy-uroven',
   'Как выбрать ракетку под свой уровень',
   'Советы', '/images/articles/article-1.webp', '2026-09-13'),
  ('5-oshibok-kotorye-meshayut-igrat-stabilnee',
   '5 ошибок, которые мешают играть стабильнее',
   'Тренировки', '/images/articles/article-2.webp', '2026-09-12'),
  ('americano-kak-prohodit-samyy-populyarnyy-format',
   'Americano: как проходит самый популярный формат',
   'Турниры', '/images/articles/article-3.webp', '2026-09-11')
) as v(slug, title, category, image_path, published_at)
where not exists (select 1 from public.articles a where a.slug = v.slug);
