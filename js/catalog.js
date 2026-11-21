// ============================================================
// Перекрёсток — catalog.js
// 1. Рабочий фильтр по категории и цене (клиентский, без сервера).
// 2. Кнопки «В корзину» → POST /api/cart (нужен Go-сервер).
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('catalog-filters-form');
  const grid = document.querySelector('.products-grid--catalog');
  if (!form || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.product-card'));
  const noResults = document.getElementById('catalog-no-results');

  // --- 1. Фильтр -------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const categories = Array.from(
      form.querySelectorAll('input[name="category"]:checked')
    ).map(i => i.value);

    const minPrice = parseFloat(document.getElementById('price-min').value) || 0;
    const maxPriceRaw = parseFloat(document.getElementById('price-max').value);
    const maxPrice = isNaN(maxPriceRaw) ? Infinity : maxPriceRaw;

    let visible = 0;
    cards.forEach(card => {
      const cat = card.dataset.category;
      const price = parseFloat(card.dataset.price);

      const matchCat = categories.length === 0 || categories.includes(cat);
      const matchPrice = price >= minPrice && price <= maxPrice;
      const show = matchCat && matchPrice;

      card.hidden = !show;
      if (show) visible++;
    });

    if (noResults) noResults.hidden = visible > 0;
  });

  // --- 2. «В корзину» -------------------------------------------
  document.querySelectorAll('.js-add-to-cart').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = Number(btn.dataset.productId);
      if (!productId) return;

      const original = btn.textContent;
      btn.disabled = true;

      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId, quantity: 1 })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);

        btn.textContent = 'Добавлено ✓';
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 1200);
      } catch (err) {
        btn.disabled = false;
        alert(
          'Не удалось добавить в корзину.\n' +
          'Проверьте, что Go-сервер запущен: cd server && go run .\n' +
          'Ошибка: ' + err.message
        );
      }
    });
  });
});
