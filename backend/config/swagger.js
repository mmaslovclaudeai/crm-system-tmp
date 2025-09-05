// backend/config/swagger.js - Конфигурация Swagger документации
const swaggerJSDoc = require('swagger-jsdoc');

// Основная конфигурация OpenAPI
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'CRM API',
    version: '1.0.0',
    description: 'API для CRM системы управления клиентами, финансами и сотрудниками',
    contact: {
      name: 'CRM Support',
      email: 'support@crm.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:5001',
      description: 'Development сервер'
    },
    {
      url: 'http://localhost:3000',
      description: 'Frontend Development сервер'
    }
  ],
  // Группировка эндпоинтов по тегам
  tags: [
    {
      name: 'Auth',
      description: 'Авторизация и аутентификация'
    },
    {
      name: 'Clients',
      description: 'Управление клиентами'
    },
    {
      name: 'Finances',
      description: 'Финансовые операции'
    },
    {
      name: 'CashDesks',
      description: 'Управление кассами'
    },
    {
      name: 'Workers',
      description: 'Управление сотрудниками'
    },
    {
      name: 'Integrations',
      description: 'Внешние интеграции'
    }
  ],
  // Схемы безопасности
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT токен для авторизации пользователей'
      },
      PlanerkaAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Bearer токен для интеграции с Planerka'
      }
    },
    // Базовые схемы ответов
    schemas: {
      // Стандартный ответ API
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Успешность выполнения запроса'
          },
          data: {
            type: 'object',
            description: 'Данные ответа'
          },
          error: {
            type: 'string',
            description: 'Сообщение об ошибке (если есть)'
          }
        },
        required: ['success']
      },

      // Пагинация
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            description: 'Текущая страница'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Количество элементов на странице'
          },
          total: {
            type: 'integer',
            minimum: 0,
            description: 'Общее количество элементов'
          },
          totalPages: {
            type: 'integer',
            minimum: 0,
            description: 'Общее количество страниц'
          }
        }
      },

      // Пагинированный ответ
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean'
          },
          data: {
            type: 'array',
            items: {
              type: 'object'
            }
          },
          pagination: {
            $ref: '#/components/schemas/Pagination'
          }
        }
      },

      // Ошибка валидации
      ValidationError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'Ошибка валидации данных'
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'Поле с ошибкой'
                },
                message: {
                  type: 'string',
                  description: 'Описание ошибки'
                }
              }
            }
          }
        }
      },

      // Ошибка авторизации
      UnauthorizedError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'Неавторизованный доступ'
          }
        }
      },

      // Ошибка доступа
      ForbiddenError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'Недостаточно прав доступа'
          }
        }
      },

      // Ошибка "не найдено"
      NotFoundError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'Ресурс не найден'
          }
        }
      }
    },

    // Общие параметры
    parameters: {
      // ID параметры
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Уникальный идентификатор',
        schema: {
          type: 'integer',
          minimum: 1
        },
        example: 1
      },

      ClientIdParam: {
        name: 'clientId',
        in: 'path',
        required: true,
        description: 'ID клиента',
        schema: {
          type: 'integer',
          minimum: 1
        },
        example: 1
      },

      // Параметры пагинации
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Номер страницы',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        }
      },

      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Количество элементов на странице',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        }
      },

      // Параметры поиска
      SearchParam: {
        name: 'search',
        in: 'query',
        description: 'Строка поиска',
        schema: {
          type: 'string',
          minLength: 1,
          maxLength: 255
        }
      },

      // Параметры фильтрации по датам
      DateFromParam: {
        name: 'date_from',
        in: 'query',
        description: 'Фильтр по дате (от)',
        schema: {
          type: 'string',
          format: 'date'
        },
        example: '2024-01-01'
      },

      DateToParam: {
        name: 'date_to',
        in: 'query',
        description: 'Фильтр по дате (до)',
        schema: {
          type: 'string',
          format: 'date'
        },
        example: '2024-12-31'
      }
    }
  }
};

// Настройки для swagger-jsdoc
const swaggerOptions = {
  definition: swaggerDefinition,
  // Пути к файлам с JSDoc комментариями
  apis: [
    './routes/*.js',           // Основные маршруты
    './routes/auth/*.js',      // Авторизация
    './middleware/*.js',       // Middleware
    './docs/schemas/*.js',     // Схемы данных (будем создавать)
    './docs/paths/*.js'        // Описания путей (будем создавать)
  ]
};

// Генерируем спецификацию Swagger
const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = {
  swaggerSpec,
  swaggerOptions,
  swaggerDefinition
};