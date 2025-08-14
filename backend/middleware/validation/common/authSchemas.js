// backend/middleware/validation/common/authSchemas.js
const Joi = require('joi');
const { validate } = require('../utils/schemas');

// Схема для авторизации
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Неверный формат email',
      'any.required': 'Email обязателен'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'any.required': 'Пароль обязателен'
    })
});

// Middleware функция
const validateLogin = validate(loginSchema);

module.exports = {
  loginSchema,
  validateLogin
};