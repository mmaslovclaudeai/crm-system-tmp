// backend/middleware/validation/cashDesks/cashDeskSchemas.js
const Joi = require('joi');
const { validate } = require('../utils/schemas');

// Схема для касс
const cashDeskSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'any.required': 'Название кассы обязательно',
      'string.min': 'Название не может быть пустым',
      'string.max': 'Название не должно превышать 255 символов'
    }),

  current_balance: Joi.number()
    .precision(2)
    .default(0.00)
    .messages({
      'number.base': 'Баланс должен быть числом'
    }),

  description: Joi.string()
    .max(1000)
    .optional()
    .allow(''),

  is_active: Joi.boolean()
    .default(true)
});

// Middleware функция
const validateCashDesk = validate(cashDeskSchema);

module.exports = {
  cashDeskSchema,
  validateCashDesk
};