// backend/middleware/validation/utils/validators.js

// Функция проверки контрольной суммы ИНН
const validateINN = (inn) => {
  if (!inn) return false;

  // Убираем все кроме цифр
  const cleanINN = inn.replace(/\D/g, '');

  // ИНН должен быть 10 или 12 цифр
  if (cleanINN.length !== 10 && cleanINN.length !== 12) {
    return false;
  }

  // Проверка контрольной суммы для ИНН
  const checkDigit = (inn, coefficients) => {
    let sum = 0;
    for (let i = 0; i < coefficients.length; i++) {
      sum += parseInt(inn[i]) * coefficients[i];
    }
    return (sum % 11) % 10;
  };

  if (cleanINN.length === 10) {
    // Для 10-значного ИНН
    const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    const controlDigit = checkDigit(cleanINN, coefficients);
    return controlDigit === parseInt(cleanINN[9]);
  } else {
    // Для 12-значного ИНН
    const coefficients1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const coefficients2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const controlDigit1 = checkDigit(cleanINN, coefficients1);
    const controlDigit2 = checkDigit(cleanINN, coefficients2);
    return controlDigit1 === parseInt(cleanINN[10]) && controlDigit2 === parseInt(cleanINN[11]);
  }
};

// Кастомная валидация для ИНН
const innValidator = (value, helpers) => {
  if (!validateINN(value)) {
    return helpers.message('Некорректный ИНН. Проверьте правильность ввода');
  }
  return value;
};

// Кастомная валидация для URL Контура
const konturUrlValidator = (value, helpers) => {
  if (!value) return value;

  try {
    const url = new URL(value);
    // Проверяем, что это HTTPS и домен относится к Контуру
    if (url.protocol !== 'https:') {
      return helpers.message('Ссылка должна использовать HTTPS протокол');
    }

    const allowedDomains = ['kontur.ru', 'skbkontur.ru', 'extern-api.kontur.ru'];
    const isValidDomain = allowedDomains.some(domain =>
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    );

    if (!isValidDomain) {
      return helpers.message('Разрешены только ссылки на домены Контура');
    }

    return value;
  } catch (error) {
    return helpers.message('Некорректный URL адрес');
  }
};

module.exports = {
  validateINN,
  innValidator,
  konturUrlValidator
};