// ============================================================
// Перекрёсток — data.js
// Работа №15: данные товара
// Подключается ПЕРЕД main.js, чтобы main.js мог их использовать.
// ============================================================

/*
  Объект товара.
  Здесь собраны все базовые типы данных из ТЗ:
  string, number, boolean, object.
*/
const product = {
  id: 1,                              // number
  title: 'Молоко «Простоквашино»',    // string
  category: 'dairy',                  // string
  unit: 'л',                          // string
  price: 89,                          // number (₽)
  discountPercent: 15,                // number (%)
  rating: 4.7,                        // number
  isAvailable: true,                  // boolean
  stockCount: 12                      // number (шт.)
};

// Название магазина — тоже строка, понадобится в сообщениях
const shopName = 'Перекрёсток';

// Порог «мало на складе» — вынесем в константу
const LOW_STOCK_THRESHOLD = 5;
