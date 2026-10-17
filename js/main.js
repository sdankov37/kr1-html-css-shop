// ============================================================
// Модальное окно и форма заявки
// ============================================================

const orderDialog = document.getElementById('order-dialog');
const orderButtons = document.querySelectorAll('.product-card__button');
const closeDialogButton = document.getElementById('close-order-dialog');
const selectedProductInput = document.getElementById('selected-product');

if (orderDialog && closeDialogButton) {
  orderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const productName = button.dataset.product;
      if (selectedProductInput && productName) {
        selectedProductInput.value = productName;
      }
      orderDialog.showModal();
    });
  });

  closeDialogButton.addEventListener('click', () => {
    orderDialog.close();
  });
}

// ============================================================
// Универсальная обработка форм
// ============================================================

const orderForms = document.querySelectorAll('.order-form');

orderForms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const successId = form.dataset.success;
    const successMessage = successId ? document.getElementById(successId) : null;
    const formElements = Array.from(form.elements);

    formElements.forEach((element) => {
      if (element.willValidate) {
        element.removeAttribute('aria-invalid');
      }
    });

    if (!form.checkValidity()) {
      formElements.forEach((element) => {
        if (element.willValidate && !element.checkValidity()) {
          element.setAttribute('aria-invalid', 'true');
        }
      });
      form.reportValidity();
      return;
    }

    if (successMessage) {
      successMessage.hidden = false;
    }

    form.reset();

    if (orderDialog && orderDialog.open) {
      orderDialog.close();
    }
  });
});

// ============================================================
// Кнопка возврата наверх (без анимации)
// ============================================================
document.querySelectorAll('.scroll-top').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo(0, 0);
  });
});