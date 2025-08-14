// backend/middleware/validation/clients/clientSchemas.js - ОБНОВЛЕНО С ПОДДЕРЖКОЙ НОВЫХ ПОЛЕЙ
const Joi = require('joi');
const { validate, documentsSchema } = require('../utils/schemas');

// 🆕 СХЕМА ДЛЯ ДАННЫХ ОБУЧЕНИЯ
const educationDataSchema = Joi.object({
  flow: Joi.string()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Поток не должен превышать 100 символов'
    }),

  direction: Joi.string()
    .valid('QA', 'AQA')
    .optional()
    .allow(null, '')
    .messages({
      'any.only': 'Направление может быть только QA или AQA'
    }),

  group: Joi.string()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Группа не должна превышать 100 символов'
    }),

  start_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Дата начала должна быть в формате YYYY-MM-DD'
    }),

  end_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Дата окончания должна быть в формате YYYY-MM-DD'
    })
}).custom((value, helpers) => {
  // Проверяем, что end_date больше start_date (если обе указаны)
  if (value.start_date && value.end_date) {
    const startDate = new Date(value.start_date);
    const endDate = new Date(value.end_date);

    if (endDate <= startDate) {
      return helpers.message('Дата окончания должна быть больше даты начала');
    }
  }

  return value;
});

// ОБНОВЛЕННАЯ СХЕМА ДЛЯ СОЗДАНИЯ КЛИЕНТА
const clientSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'any.required': 'Имя клиента обязательно',
      'string.min': 'Имя должно содержать минимум 2 символа',
      'string.max': 'Имя не должно превышать 255 символов'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'any.required': 'Email обязателен',
      'string.email': 'Неверный формат email',
      'string.max': 'Email не должен превышать 255 символов'
    }),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Неверный формат телефона'
    }),

  telegram: Joi.string()
    .pattern(/^@?[a-zA-Z0-9_]{5,32}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Telegram должен содержать от 5 до 32 символов (буквы, цифры, подчеркивания)'
    }),

  status: Joi.string()
    .valid('CREATED', 'DISTRIBUTION', 'GIVE_ACCESS',
           'IN_PROGRESS', 'SEARCH_OFFER', 'ACCEPT_OFFER', 'PAYING_OFFER', 'FINISH')
    .optional()
    .messages({
      'any.only': 'Неверный статус клиента'
    }),

  documents: documentsSchema.optional(),

  // 🆕 НОВЫЕ ПОЛЯ
  worker_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'ID куратора должен быть числом',
      'number.integer': 'ID куратора должен быть целым числом',
      'number.positive': 'ID куратора должен быть положительным'
    }),

  data: educationDataSchema.optional()
});

// ОБНОВЛЕННАЯ СХЕМА ДЛЯ ОБНОВЛЕНИЯ КЛИЕНТА
const clientUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Имя должно содержать минимум 2 символа',
      'string.max': 'Имя не должно превышать 255 символов'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .messages({
      'string.email': 'Неверный формат email',
      'string.max': 'Email не должен превышать 255 символов'
    }),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Неверный формат телефона'
    }),

  telegram: Joi.string()
    .pattern(/^@?[a-zA-Z0-9_]{5,32}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Telegram должен содержать от 5 до 32 символов (буквы, цифры, подчеркивания)'
    }),

  status: Joi.string()
    .valid('CREATED', 'DISTRIBUTION', 'GIVE_ACCESS',
           'IN_PROGRESS', 'SEARCH_OFFER', 'ACCEPT_OFFER', 'PAYING_OFFER', 'FINISH')
    .optional()
    .messages({
      'any.only': 'Неверный статус клиента'
    }),

  documents: documentsSchema.optional(),

  // 🆕 НОВЫЕ ПОЛЯ
  worker_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'ID куратора должен быть числом',
      'number.integer': 'ID куратора должен быть целым числом',
      'number.positive': 'ID куратора должен быть положительным'
    }),

  data: educationDataSchema.optional()

}).min(1).messages({
  'object.min': 'Необходимо указать хотя бы одно поле для обновления'
});

// СХЕМА ДЛЯ ОБНОВЛЕНИЯ ТОЛЬКО ДОКУМЕНТОВ
const documentsUpdateSchema = Joi.object({
  documents: documentsSchema.required().messages({
    'any.required': 'Поле documents обязательно'
  })
});

// СХЕМА ДЛЯ ОБНОВЛЕНИЯ ТОЛЬКО TELEGRAM
const telegramUpdateSchema = Joi.object({
  telegram: Joi.string()
    .pattern(/^@?[a-zA-Z0-9_]{5,32}$/)
    .required()
    .allow(null, '')
    .messages({
      'any.required': 'Поле telegram обязательно',
      'string.pattern.base': 'Telegram должен содержать от 5 до 32 символов (буквы, цифры, подчеркивания)'
    })
});

// 🆕 СХЕМА ДЛЯ ОБНОВЛЕНИЯ КУРАТОРА
const curatorUpdateSchema = Joi.object({
  worker_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'ID куратора должен быть числом',
      'number.integer': 'ID куратора должен быть целым числом',
      'number.positive': 'ID куратора должен быть положительным'
    })
});

// 🆕 СХЕМА ДЛЯ ОБНОВЛЕНИЯ ДАННЫХ ОБУЧЕНИЯ
const educationDataUpdateSchema = Joi.object({
  data: educationDataSchema.required().messages({
    'any.required': 'Поле data обязательно'
  })
});

// Middleware функции
const validateClient = validate(clientSchema);
const validateClientUpdate = validate(clientUpdateSchema);
const validateDocumentsUpdate = validate(documentsUpdateSchema);
const validateTelegramUpdate = validate(telegramUpdateSchema);
const validateCuratorUpdate = validate(curatorUpdateSchema);
const validateEducationDataUpdate = validate(educationDataUpdateSchema);

module.exports = {
  clientSchema,
  clientUpdateSchema,
  documentsUpdateSchema,
  telegramUpdateSchema,
  curatorUpdateSchema,
  educationDataUpdateSchema,
  educationDataSchema,
  validateClient,
  validateClientUpdate,
  validateDocumentsUpdate,
  validateTelegramUpdate,
  validateCuratorUpdate,
  validateEducationDataUpdate
};