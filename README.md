# Перекрёсток — учебный интернет-магазин

Учебный проект по дисциплине «Фронтенд и бэкенд разработка».
Основа для контрольной работы №4 (JavaScript).

## Структура проекта

```

perekrestok/
├── index.html
├── catalog.html
├── product.html
├── order.html
├── contacts.html
├── css/
│   └── style.css
├── js/
│   ├── data.js     ← объект товара (подключается ПЕРВЫМ)
│   └── main.js     ← функции и вывод (подключается ВТОРЫМ)
├── images/
│   ├── milk.jpg
│   ├── bread.png
│   ├── apples.jpg
│   ├── cheese.jpg
│   ├── coffee.jpg
│   └── choko.jpg
├── lighthouse/
└── README.md

```

## Работа №12 — адаптивная вёрстка

- mobile-first, breakpoints: 480, 600, 900, 1200;
- сетка товаров: 1 → 2 → 3 колонки;
- каталог: фильтры сверху → сайдбар 280px (sticky);
- карточка товара: 1 колонка → 2 (grid-areas).

## Работа №13 — доступность

- alt-тексты по контексту, декоративный hero с `alt=""`;
- `aria-current="page"`, `aria-label` только там, где нужно;
- `role="img"` + `aria-label` для рейтингов;
- skip-link, `:focus-visible`, `prefers-reduced-motion`;
- контрастность ≥ 4.5:1.

## Работа №14 — responsive images, формы, таблицы

- `srcset` + `sizes` для всех картинок;
- `width`/`height` у всех `<img>` — нет CLS;
- `loading="lazy"` для картинок ниже первого экрана;
- `fetchpriority="high"` для hero и главного фото;
- форма в 2 колонки с 600px;
- таблица → карточки на мобильных, таблица с 600px.

## Работа №15 — JavaScript: переменные, типы, функции, безопасный вывод

### 1. Подключение скриптов

В каждом HTML, в `<head>`:

```html
<script src="js/data.js" defer></script>
<script src="js/main.js" defer></script>
```

- `defer` — браузер загружает скрипт параллельно, но выполняет **после** разбора HTML. Значит, `document.querySelector` в `main.js` найдёт нужные элементы.
- **Порядок важен**: `data.js` идёт первым, потому что `main.js` использует `product`, `shopName`, `LOW_STOCK_THRESHOLD`. Если поменять местами — в консоли будет `Uncaught ReferenceError: product is not defined`.

### 2. Объект товара (`data.js`)

```
const product = {
  id: 1,
  title: 'Молоко «Простоквашино»',
  category: 'dairy',
  unit: 'л',
  price: 89,
  discountPercent: 15,
  rating: 4.7,
  isAvailable: true,
  stockCount: 12
};
```

Все базовые типы использованы:

- **string** — `title`, `category`, `unit`;
- **number** — `id`, `price`, `discountPercent`, `rating`, `stockCount`;
- **boolean** — `isAvailable`;
- **object** — сам `product`.

### 3. Функции (`main.js`)

| Функция                             | Что делает                                                     | Что использует       |
| ----------------------------------- | -------------------------------------------------------------- | -------------------- |
| `formatPrice(value)`                | `89` → `'89 ₽'`                                                | шаблонные строки     |
| `calculateDiscount(price, percent)` | возвращает `{ discountValue, finalPrice }`                     | `*` и `-`            |
| `getStockStatus(item)`              | `'Нет в наличии'` / `'Мало на складе (N шт.)'` / `'В наличии'` | `!`, `&&`, `<=`, `>` |
| `getShortDescription(item)`         | `'Молоко «Простоквашино» — 89 ₽. В наличии.'`                  | остальные 3 функции  |

### 4. Что выводится в консоль

Открыть DevTools → **Console**. После загрузки `index.html` там будет:

```
Проверка функций (Перекрёсток)
  ▸ Объект товара: (таблица)
  formatPrice(product.price) → 89 ₽
  formatPrice(1250) → 1250 ₽
  Скидка 15%: −13.35 ₽, итог 75.65 ₽
  getStockStatus(product) → В наличии
  Нет в наличии: Нет в наличии
  Мало на складе: Мало на складе (осталось 3 шт.)
  getShortDescription(product) → Молоко «Простоквашино» — 89 ₽. В наличии.
  price > 100?           → false
  price === 89?          → true
  price !== 0?           → true
  rating >= 4.5?         → true
  isAvailable && price>0 → true
  Есть скидка?           → true
  Цена за 3 шт.:         → 267 ₽
  Цена со скидкой:       → 75.65 ₽
```

⚠ Если увидишь `product is not defined` — значит, порядок скриптов перепутан или `data.js` не подключён.

### 5. Безопасный вывод на страницу

На `index.html` (и на `catalog.html`, `order.html`) есть блок:

```
<p class="js-message" aria-live="polite"></p>
```

`main.js` заполняет его через `textContent`:

```
const messageElement = document.querySelector('.js-message');
if (messageElement) {
  messageElement.textContent = `JavaScript подключён корректно. ${getShortDescription(product)}`;
}
```

После загрузки на главной появится зелёное сообщение:

> JavaScript подключён корректно. Молоко «Простоквашино» — 89 ₽. В наличии.

### 6. Почему `textContent`, а не `innerHTML`

```
// ❌ ОПАСНО: если в userInput окажется <img src=x onerror=...>, скрипт выполнится
element.innerHTML = userInput;

// ✅ БЕЗОПАСНО: браузер экранирует всё, что приходит из данных
element.textContent = userInput;
```

`innerHTML` **парсит строку как HTML**. Если строка пришла от пользователя (из формы, из URL, из API) — в ней может быть `<script>` или `<img onerror=...>`. Это XSS-уязвимость.

`textContent` работает только с текстом. Символы `<`, `>`, `&` автоматически экранируются — тег не выполнится, а будет показан как текст.

Правило: **`textContent` по умолчанию, `innerHTML` — только для своего статичного HTML, который ты сам написал.**

### 7. Как проверить

1. Открыть `index.html` через Live Server.
2. `F12` → **Console**.
3. Убедиться, что группа «Проверка функций (Перекрёсток)» раскрылась и в ней все выводы без ошибок.
4. Прокрутить страницу — под hero должно быть зелёное сообщение.
5. Открыть `catalog.html` и `order.html` — сообщение тоже должно появиться.
6. Открыть `product.html` и `contacts.html` — сообщение не появится, потому что там нет `.js-message`. Это нормально.
7. Проверить безопасность: временно заменить в `main.js` `textContent` на `innerHTML` и вписать в строку `<img src=x onerror="alert(1)">`. Если появится `alert` — это демонстрация уязвимости. Вернуть `textContent` обратно.

## Что дальше

- **Работа №16** — массив товаров, циклы, методы массивов, поиск, фильтрация, сортировка.
- **Работа №17** — DOM, события, вывод карточек товаров, валидация формы, localStorage.
- **Работа №18** — сдача КР №4.
