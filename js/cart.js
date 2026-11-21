// ============================================================
// Перекрёсток — cart.js
// Загружает корзину из Go-бэкенда и рисует таблицу.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const tbody   = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const emptyEl = document.getElementById('cart-empty');
  const table   = document.getElementById('cart-table');
  const clearBtn = document.getElementById('cart-clear');

  if (!tbody) return;

  async function loadCart() {
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      render(data.items || []);
    } catch (err) {
      table.hidden = true;
      emptyEl.hidden = false;
      emptyEl.innerHTML = '';
      const p1 = document.createElement('p');
      p1.textContent = 'Не удалось загрузить корзину.';
      const p2 = document.createElement('p');
      p2.textContent = 'Запустите Go-сервер: cd server && go run .';
      const p3 = document.createElement('p');
      p3.textContent = 'Затем откройте http://localhost:8080/cart.html';
      emptyEl.append(p1, p2, p3);
      console.error(err);
    }
  }

  function render(items) {
    tbody.innerHTML = '';

    if (items.length === 0) {
      table.hidden = true;
      emptyEl.hidden = false;
      emptyEl.innerHTML = 'Ваша корзина пуста. <a href="catalog.html">Перейти в каталог</a>';
      totalEl.textContent = '0 ₽';
      return;
    }

    table.hidden = false;
    emptyEl.hidden = true;

    let total = 0;
    items.forEach(item => {
      const sum = item.price * item.quantity;
      total += sum;

      const tr = document.createElement('tr');

      // Картинка
      const tdImg = document.createElement('td');
      const img = document.createElement('img');
      img.src = 'images/' + item.image;
      img.alt = item.title;
      img.width = 64;
      img.height = 64;
      img.className = 'cart-table__img';
      tdImg.appendChild(img);
      tr.appendChild(tdImg);

      // Название
      const tdTitle = document.createElement('td');
      tdTitle.textContent = item.title;
      tr.appendChild(tdTitle);

      // Цена
      const tdPrice = document.createElement('td');
      tdPrice.textContent = item.price + ' ₽';
      tr.appendChild(tdPrice);

      // Количество
      const tdQty = document.createElement('td');
      tdQty.textContent = item.quantity;
      tr.appendChild(tdQty);

      // Сумма
      const tdSum = document.createElement('td');
      tdSum.textContent = sum + ' ₽';
      tr.appendChild(tdSum);

      // Удалить
      const tdAct = document.createElement('td');
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'button button--secondary';
      rm.textContent = 'Удалить';
      rm.addEventListener('click', async () => {
        rm.disabled = true;
        try {
          const r = await fetch('/api/cart/' + item.product_id, { method: 'DELETE' });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          await loadCart();
        } catch (e) {
          rm.disabled = false;
          alert('Не удалось удалить: ' + e.message);
        }
      });
      tdAct.appendChild(rm);
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
    });

    totalEl.textContent = total + ' ₽';
  }

  clearBtn?.addEventListener('click', async () => {
    if (!confirm('Очистить корзину?')) return;
    clearBtn.disabled = true;
    try {
      await fetch('/api/cart', { method: 'DELETE' });
      await loadCart();
    } catch (e) {
      alert('Ошибка: ' + e.message);
    } finally {
      clearBtn.disabled = false;
    }
  });

  loadCart();
});
