// backend/middleware/validation/workers/workerSchemas.js
const Joi = require('joi');
const { validate } = require('../utils/schemas');

// Схема для создания работника
const workerSchema = Joi.object({
  full_name: Joi.string()
    .min(2)
    .max(255)
    .pattern(/^[a-zA-Zа-яА-ЯёЁ\s\-\.]+$/)
    .required()
    .messages({
      'any.required': 'ФИО обязательно для заполнения',
      'string.min': 'ФИО должно содержать минимум 2 символа',
      'string.max': 'ФИО не должно превышать 255 символов',
      'string.pattern.base': 'ФИО может содержать только буквы, пробелы, дефисы и точки'
    }),

  position: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'any.required': 'Должность обязательна для заполнения',
      'string.min': 'Должность должна содержать минимум 2 символа',
      'string.max': 'Должность не должна превышать 255 символов'
    }),

  telegram_username: Joi.string()
    .pattern(/^@[a-zA-Z0-9_]{4,31}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Telegram должен быть в формате @username (4-31 символ)'
    }),

  phone: Joi.string()
    .pattern(/^7[0-9]{10}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Телефон должен быть в формате 79991234567 (11 цифр, начиная с 7)'
    }),

  bank: Joi.string()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Название банка не должно превышать 100 символов'
    }),

  card_number: Joi.string()
    .pattern(/^[0-9]{16,19}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Номер карты должен содержать от 16 до 19 цифр'
    }),

  hire_date: Joi.date()
    .max('now')
    .required()
    .messages({
      'any.required': 'Дата трудоустройства обязательна',
      'date.base': 'Неверный формат даты трудоустройства',
      'date.max': 'Дата трудоустройства не может быть в будущем'
    }),

  fire_date: Joi.date()
    .min(Joi.ref('hire_date'))
    .optional()
    .allow(null)
    .messages({
      'date.base': 'Неверный формат даты увольнения',
      'date.min': 'Дата увольнения не может быть раньше даты трудоустройства'
    }),

  is_active: Joi.boolean()
    .default(true)
    .optional()
});

// Схема для обновления работника (все поля опциональны)
const workerUpdateSchema = Joi.object({
  full_name: Joi.string()
    .min(2)
    .max(255)
    .pattern(/^[a-zA-Zа-яА-ЯёЁ\s\-\.]+$/)
    .optional()
    .messages({
      'string.min': 'ФИО должно содержать минимум 2 символа',
      'string.max': 'ФИО не должно превышать 255 символов',
      'string.pattern.base': 'ФИО может содержать только буквы, пробелы, дефисы и точки'
    }),

  position: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Должность должна содержать минимум 2 символа',
      'string.max': 'Должность не должна превышать 255 символов'
    }),

  telegram_username: Joi.string()
    .pattern(/^@[a-zA-Z0-9_]{4,31}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Telegram должен быть в формате @username (4-31 символ)'
    }),

  phone: Joi.string()
    .pattern(/^7[0-9]{10}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Телефон должен быть в формате 79991234567 (11 цифр, начиная с 7)'
    }),

  bank: Joi.string()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Название банка не должно превышать 100 символов'
    }),

  card_number: Joi.string()
    .pattern(/^[0-9]{16,19}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Номер карты должен содержать от 16 до 19 цифр'
    }),

  hire_date: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.base': 'Неверный формат даты трудоустройства',
      'date.max': 'Дата трудоустройства не может быть в будущем'
    }),

  fire_date: Joi.date()
    .optional()
    .allow(null)
    .messages({
      'date.base': 'Неверный формат даты увольнения'
    }),

  is_active: Joi.boolean()
    .optional()
})
// Дополнительная валидация: если указана fire_date, она должна быть позже hire_date
.custom((value, helpers) => {
  if (value.fire_date && value.hire_date && new Date(value.fire_date) < new Date(value.hire_date)) {
    return helpers.message('Дата увольнения не может быть раньше даты трудоустройства');
  }
  return value;
});

// Middleware функции
const validateWorker = validate(workerSchema);
const validateWorkerUpdate = validate(workerUpdateSchema);

module.exports = {
  workerSchema,
  workerUpdateSchema,
  validateWorker,
  validateWorkerUpdate
};