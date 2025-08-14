// src/utils/validators.js

export const validateEmail = (email) => {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
};

export const validateClientForm = (formData) => {
  const errors = {};

  if (!formData.fullName?.trim()) {
    errors.fullName = 'Введите ФИО';
  }

  if (!formData.email?.trim()) {
    errors.email = 'Введите email';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Некорректный email';
  }

  if (!formData.phone?.trim()) {
    errors.phone = 'Введите телефон';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

export const validateFinanceForm = (formData) => {
  const errors = {};

  if (!formData.amount?.toString().trim()) {
    errors.amount = 'Введите сумму';
  } else if (Number(formData.amount) <= 0) {
    errors.amount = 'Сумма должна быть больше 0';
  }

  if (!formData.category?.trim()) {
    errors.category = 'Введите категорию';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};