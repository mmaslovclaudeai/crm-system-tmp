// backend/middleware/validation/utils/schemas.js
const Joi = require('joi');
const { innValidator, konturUrlValidator } = require('./validators');
const { traceDebug, traceError } = require('../../../utils/logger');

// 📋 БАЗОВАЯ СХЕМА ДЛЯ ДОКУМЕНТОВ
const documentsSchema = Joi.object({
  // ИНН
  inn: Joi.string()
    .pattern(/^\d{10,12}$/)
    .custom(innValidator)
    .optional()
    .messages({
      'string.pattern.base': 'ИНН должен содержать 10 или 12 цифр',
      'string.empty': 'ИНН не может быть пустым'
    }),

  // Паспортные данные
  passport: Joi.object({
    serial: Joi.string()
      .pattern(/^\d{4}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Серия паспорта должна содержать 4 цифры',
        'string.empty': 'Серия паспорта не может быть пустой'
      }),

    number: Joi.string()
      .pattern(/^\d{6}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Номер паспорта должен содержать 6 цифр',
        'string.empty': 'Номер паспорта не может быть пустым'
      })
  })
  .optional()
  .custom((value, helpers) => {
    // Если указан passport объект, то и serial и number должны быть заполнены
    if (value && (value.serial && !value.number || !value.serial && value.number)) {
      return helpers.message('Необходимо указать и серию, и номер паспорта');
    }
    return value;
  }),

  // Ссылка на Контур
  konturLink: Joi.string()
    .uri({ scheme: ['https'] })
    .custom(konturUrlValidator)
    .optional()
    .messages({
      'string.uri': 'Некорректный URL адрес',
      'string.empty': 'Ссылка на Контур не может быть пустой'
    }),

  // Дата последнего обновления (автоматически добавляется)
  updatedAt: Joi.string().isoDate().optional()
}).optional();

// 🛡️ УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ВАЛИДАЦИИ
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    traceDebug(req, `Validation debug: ${property}`, {
      action: 'validation',
      property: property,
      data: req[property]
    });

    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      traceError(req, 'Validation failed', {
        action: 'validation',
        property: property,
        errors: errors,
        data: req[property]
      });

      return res.status(400).json({
        error: 'Ошибка валидации',
        details: errors,
        traceId: req.traceId || 'no-trace-id'
      });
    }

    // Заменяем данные на валидированные и очищенные
    req[property] = value;
    next();
  };
};

module.exports = {
  documentsSchema,
  validate
};