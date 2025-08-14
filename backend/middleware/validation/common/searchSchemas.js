// backend/middleware/validation/common/searchSchemas.js
const Joi = require('joi');
const { validate } = require('../utils/schemas');

// Схема для поисковых параметров
const searchSchema = Joi.object({
  search: Joi.string().max(255).optional().allow(''),
  filter: Joi.string().valid('name', 'email', 'description', 'active', 'telegram', 'inn').optional(),
  status: Joi.string().valid('actual', 'planned').optional(),
  active_only: Joi.string().valid('true', 'false').optional(),

  // Фильтрация по группам статусов
  status_group: Joi.string()
    .valid('leads', 'clients', 'all')
    .optional()
    .messages({
      'any.only': 'Группа статусов должна быть: leads, clients или all'
    })
});

// Middleware функция
const validateSearch = validate(searchSchema, 'query');

module.exports = {
  searchSchema,
  validateSearch
};