// backend/middleware/validation/finances/financeSchemas.js
const Joi = require('joi');
const { validate } = require('../utils/schemas');

// 🔧 ОБНОВЛЕННАЯ схема для финансовых операций с поддержкой transfer
const financeSchema = Joi.object({
  date: Joi.date()
    .required()
    .messages({
      'any.required': 'Дата обязательна',
      'date.base': 'Неверный формат даты'
    }),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'any.required': 'Сумма обязательна',
      'number.base': 'Сумма должна быть числом',
      'number.positive': 'Сумма должна быть положительной'
    }),

  // 🆕 ОБНОВЛЕНО: Добавлен тип 'transfer'
  type: Joi.string()
    .valid('income', 'expense', 'transfer')
    .required()
    .messages({
      'any.required': 'Тип операции обязателен',
      'any.only': 'Тип операции должен быть "income", "expense" или "transfer"'
    }),

  status: Joi.string()
    .valid('actual', 'planned')
    .required()
    .messages({
      'any.required': 'Статус обязателен',
      'any.only': 'Статус должен быть "actual" или "planned"'
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Описание не должно превышать 500 символов'
    }),

  category: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'any.required': 'Категория обязательна',
      'string.max': 'Категория не должна превышать 100 символов'
    }),

  // 🆕 НОВОЕ: Поле для связи парных transfer операций
  transfer_pair_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'ID парной операции должен быть числом',
      'number.positive': 'ID парной операции должен быть положительным'
    }),

  // Поддержка разных способов указания клиента
  client_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null),

  clientId: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null),

  email: Joi.string()
    .email()
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Некорректный формат email'
    }),

  // Поддержка разных способов указания работника
  worker_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null),

  workerId: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null),

  employee: Joi.string()
    .pattern(/^@?[a-zA-Z0-9_]{4,32}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Telegram username должен содержать 4-32 символа (буквы, цифры, подчеркивания)'
    }),

  // Поддержка разных способов указания кассы
  cash_desk_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID кассы должен быть числом',
      'number.positive': 'ID кассы должен быть положительным'
    }),

  cashDeskId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID кассы должен быть числом',
      'number.positive': 'ID кассы должен быть положительным'
    }),

  // 🆕 НОВЫЕ ПОЛЯ: Для создания transfer пары
  cash_desk_from_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID кассы-отправителя должен быть числом',
      'number.positive': 'ID кассы-отправителя должен быть положительным'
    }),

  cash_desk_to_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID кассы-получателя должен быть числом',
      'number.positive': 'ID кассы-получателя должен быть положительным'
    })

// 🆕 НОВАЯ ВАЛИДАЦИЯ: Условные правила для transfer операций
}).custom((value, helpers) => {
  // Для transfer пары требуются кассы отправителя и получателя
  if (value.cash_desk_from_id && value.cash_desk_to_id) {
    // Это создание transfer пары - проверяем, что кассы разные
    if (value.cash_desk_from_id === value.cash_desk_to_id) {
      return helpers.message('Касса-отправитель и касса-получатель не могут совпадать');
    }
    // Transfer пары не должны иметь привязку к клиентам/работникам
    if (value.client_id || value.clientId || value.email) {
      return helpers.message('Transfer операции не могут быть привязаны к клиентам');
    }
    if (value.worker_id || value.workerId || value.employee) {
      return helpers.message('Transfer операции не могут быть привязаны к работникам');
    }
    return value;
  }

  // Для обычных операций требуется одна касса
  if (!value.cash_desk_id && !value.cashDeskId) {
    return helpers.message('Укажите кассу (cash_desk_id или cashDeskId)');
  }

  // Для transfer операций требуется касса
  if (value.type === 'transfer') {
    if (!value.cash_desk_id && !value.cashDeskId) {
      return helpers.message('Для операции transfer обязательно указание кассы');
    }
    // Transfer операции не должны иметь привязку к клиентам/работникам
    if (value.client_id || value.clientId || value.email) {
      return helpers.message('Transfer операции не могут быть привязаны к клиентам');
    }
    if (value.worker_id || value.workerId || value.employee) {
      return helpers.message('Transfer операции не могут быть привязаны к работникам');
    }
  }

  return value;
});

// 🆕 НОВАЯ СХЕМА: Специальная валидация для создания transfer пары
const transferPairSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'any.required': 'Сумма обязательна',
      'number.positive': 'Сумма должна быть положительной'
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Описание не должно превышать 500 символов'
    }),

  date: Joi.date()
    .required()
    .messages({
      'any.required': 'Дата обязательна',
      'date.base': 'Неверный формат даты'
    }),

  // Кассы-отправители и получатели
  cash_desk_from_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Касса-отправитель обязательна',
      'number.positive': 'ID кассы-отправителя должен быть положительным'
    }),

  cash_desk_to_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Касса-получатель обязательна',
      'number.positive': 'ID кассы-получателя должен быть положительным'
    })

}).custom((value, helpers) => {
  // Кассы не должны совпадать
  if (value.cash_desk_from_id === value.cash_desk_to_id) {
    return helpers.message('Касса-отправитель и касса-получатель не могут совпадать');
  }

  return value;
});

// Middleware функции
const validateFinance = validate(financeSchema);
const validateTransferPair = validate(transferPairSchema);

module.exports = {
  financeSchema,
  transferPairSchema,
  validateFinance,
  validateTransferPair
};