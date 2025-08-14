// backend/middleware/validation/common/paramSchemas.js
const Joi = require('joi');
const { validate } = require('../utils/schemas');

// Схемы для параметров
const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID должен быть числом',
      'number.integer': 'ID должен быть целым числом',
      'number.positive': 'ID должен быть положительным',
      'any.required': 'ID обязателен'
    })
});

const clientIdParamSchema = Joi.object({
  clientId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Client ID должен быть числом',
      'number.integer': 'Client ID должен быть целым числом',
      'number.positive': 'Client ID должен быть положительным',
      'any.required': 'Client ID обязателен'
    })
});

// Middleware функции
const validateIdParam = validate(idParamSchema, 'params');
const validateClientIdParam = validate(clientIdParamSchema, 'params');

module.exports = {
  idParamSchema,
  clientIdParamSchema,
  validateIdParam,
  validateClientIdParam
};