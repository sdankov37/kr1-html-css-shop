// ============================================================
// Модальное окно и форма заявки
// ============================================================

// Получаем модальное окно по id
const orderDialog = document.getElementById('order-dialog');

// Получаем все кнопки заказа в карточках товаров.
// Класс product-card__button сохранён после БЭМ-рефакторинга.
const orderButtons = document.querySelectorAll('.product-card__button');

// Получаем кнопку закрытия модального окна
const closeDialogButton = document.getElementById('close-order-dialog');

// Получаем скрытое поле, в которое будет записан выбранный товар
const selectedProductInput = document.getElementById('selected-product');

// Перебираем все кнопки «Заказать»
orderButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const productName = button.dataset.product;

    if (selectedProductInput) {
      selectedProductInput.value = productName;
    }

    orderDialog.showModal();
  });
});

// Закрываем модальное окно по кнопке «Закрыть»
closeDialogButton.addEventListener('click', () => {
  orderDialog.close();
});

// ============================================================
// Базовая обработка отправки формы
// ============================================================

const orderForm = document.getElementById('order-form');
const successMessage = document.getElementById('success-message');

orderForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const formElements = Array.from(orderForm.elements);

  formElements.forEach((element) => {
    if (element.willValidate) {
      element.removeAttribute('aria-invalid');
    }
  });

  if (!orderForm.checkValidity()) {
    formElements.forEach((element) => {
      if (element.willValidate && !element.checkValidity()) {
        element.setAttribute('aria-invalid', 'true');
      }
    });

    orderForm.reportValidity();
    return;
  }

  successMessage.hidden = false;
  orderForm.reset();
  orderDialog.close();
});

// ============================================================
// Кнопка возврата наверх
// ============================================================
document.querySelectorAll('.scroll-top').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});