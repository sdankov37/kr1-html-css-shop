// ============================================================
// Перекрёсток — main.js
// Практическая работа №12: минимальный JS
// (функции и работа с данными появятся в работе №15)
// ============================================================

// Кнопка «Наверх» с плавной прокруткой
document.querySelectorAll('.scroll-top').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
