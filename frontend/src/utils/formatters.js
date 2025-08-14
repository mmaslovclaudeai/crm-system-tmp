// src/utils/formatters.js

export const formatAmount = (amount) => {
  const formatted = Math.abs(Number(amount)).toLocaleString('ru-RU');
  return Number(amount) >= 0 ? `+${formatted} ₽` : `-${formatted} ₽`;
};

export const getAmountColor = (amount) => {
  return Number(amount) >= 0 ? 'text-green-600' : 'text-red-600';
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

export const formatPhone = (phone) => {
  // Можно добавить форматирование телефона
  return phone;
};