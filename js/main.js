// ============================================================
// Перекрёсток — main.js
// Работа №15: функции форматирования, расчёта скидки,
// статуса товара и краткого описания + безопасный вывод.
// Подключается ПОСЛЕ data.js.
// ============================================================

// ------------------------------------------------------------
// 1. Функция форматирования цены
//    Число → строка вида "89 ₽"
// ------------------------------------------------------------
function formatPrice(value) {
  return `${value} ₽`;
}

// ------------------------------------------------------------
// 2. Функция расчёта скидки
//    Возвращает объект: размер скидки и итоговую цену.
//    Используем арифметические операторы * и -.
// ------------------------------------------------------------
function calculateDiscount(price, discountPercent) {
  const discountValue = price * discountPercent / 100;
  const finalPrice = price - discountValue;

  return {
    discountValue,
    finalPrice
  };
}

// ------------------------------------------------------------
// 3. Функция определения статуса товара
//    Используем сравнение > и логические операторы && / !.
// ------------------------------------------------------------
function getStockStatus(item) {
  if (!item.isAvailable) {
    return 'Нет в наличии';
  }

  if (item.stockCount > 0 && item.stockCount <= LOW_STOCK_THRESHOLD) {
    return `Мало на складе (осталось ${item.stockCount} шт.)`;
  }

  return 'В наличии';
}

// ------------------------------------------------------------
// 4. Функция формирования краткого описания товара
//    Собирает строку из названия, цены и статуса.
// ------------------------------------------------------------
function getShortDescription(item) {
  const price = formatPrice(item.price);
  const status = getStockStatus(item);

  return `${item.title} — ${price}. ${status}.`;
}

// ============================================================
// Проверка работы функций в консоли
// ============================================================

console.group(`Проверка функций (${shopName})`);

console.log('Объект товара:');
console.table(product);

// Форматирование цены
console.log('formatPrice(product.price) →', formatPrice(product.price));
console.log('formatPrice(1250) →', formatPrice(1250));

// Расчёт скидки
const discount = calculateDiscount(product.price, product.discountPercent);
console.log(
  `Скидка ${product.discountPercent}%: −${formatPrice(discount.discountValue)}, итог ${formatPrice(discount.finalPrice)}`
);

// Статус товара
console.log('getStockStatus(product) →', getStockStatus(product));

// Проверим на «плохих» данных — вдруг логика сломается
console.log('Нет в наличии:', getStockStatus({ isAvailable: false, stockCount: 0 }));
console.log('Мало на складе:', getStockStatus({ isAvailable: true, stockCount: 3 }));

// Краткое описание
console.log('getShortDescription(product) →', getShortDescription(product));

// Сравнения и логические операторы (по ТЗ)
console.log('price > 100?           →', product.price > 100);
console.log('price === 89?          →', product.price === 89);
console.log('price !== 0?           →', product.price !== 0);
console.log('rating >= 4.5?         →', product.rating >= 4.5);
console.log('isAvailable && price>0 →', product.isAvailable && product.price > 0);
console.log('Есть скидка?           →', product.discountPercent > 0);

// Арифметика
console.log('Цена за 3 шт.:         →', formatPrice(product.price * 3));
console.log('Цена со скидкой:       →', formatPrice(discount.finalPrice));

// Предупреждение (демонстрация console.warn)
if (product.stockCount <= LOW_STOCK_THRESHOLD) {
  console.warn('⚠ Товара осталось мало, пора пополнить склад');
}

console.groupEnd();

// ============================================================
// Безопасный вывод на страницу через textContent
// ============================================================
// ❌ Плохо: element.innerHTML = userInput; — XSS-уязвимость.
// ✅ Хорошо: element.textContent = userInput; — текст экранируется.

const messageElement = document.querySelector('.js-message');
if (messageElement) {
  messageElement.textContent = `JavaScript подключён корректно. ${getShortDescription(product)}`;
}

// ============================================================
// Кнопка «Наверх» (осталась с работ №12–14)
// ============================================================
document.querySelectorAll('.scroll-top').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
