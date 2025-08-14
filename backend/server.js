// backend/server.js - Основной сервер приложения
const express = require('express');
const http = require('http');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 🆕 ИМПОРТ ЛОГГЕРА
const { logger, requestLogger, info, warn, error } = require('./utils/logger');

// Swagger конфигурация
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./config/swagger');

// Подключение к базе данных
const pool = require('./database');



// Middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler, notFoundHandler, unhandledErrorHandler } = require('./middleware/errorHandler');

// Маршруты
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const financesRoutes = require('./routes/finances');
const cashDesksRoutes = require('./routes/cashDesks');
const healthRoutes = require('./routes/health');
const publicRoutes = require('./routes/public');
const workersRoutes = require('./routes/workers');
const clientNotesRoutes = require('./routes/clientNotes');
const planerkaRoutes = require('./routes/planerka');

const app = express();

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// 🔧 ИСПРАВЛЕНИЕ: Включаем trust proxy для работы за nginx
app.set('trust proxy', true);

// 🔒 БЕЗОПАСНОСТЬ: Проверяем критически важные переменные окружения
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-this-in-production-please') {
  warn('JWT_SECRET не установлен или использует дефолтное значение!', {
    action: 'security_check',
    severity: 'warning',
    recommendation: 'Установить переменную JWT_SECRET в .env файле'
  });
}





// 🛡️ RATE LIMITING
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 100 запросов на IP за окно
  message: {
    error: 'Слишком много запросов с вашего IP, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 🔧 ОСНОВНЫЕ MIDDLEWARE
app.use(limiter);

// 🔗 CORS (обновленный для локальной разработки)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:5001',
      'http://127.0.0.1:3000',
      'http://localhost:3000/crm-form',
      'https://admin-stage.dev.crm.seniorpomidornaya.ru'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      warn('CORS: Заблокирован запрос', {
        action: 'cors_blocked',
        origin: origin,
        allowedOrigins: allowedOrigins
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📝 ЛОГИРОВАНИЕ ЗАПРОСОВ
app.use(requestLogger);

// 🎯 PLANERKA ВЕБХУКИ (без авторизации - для приема внешних вебхуков)
app.use('/api/planerka', planerkaRoutes);

// // Также добавить middleware для логирования всех запросов к planerka (опционально)
// app.use('/api/planerka', (req, res, next) => {
//   console.log(`🎯 PLANERKA REQUEST: ${req.method} ${req.originalUrl} от IP: ${req.ip}`);
//   next();
// });



// 🏥 HEALTH CHECK (без авторизации)
app.use('/api/health', healthRoutes);

// 🌐 ПУБЛИЧНЫЕ API (без авторизации)
app.use('/api/public', publicRoutes);

// 📚 SWAGGER ДОКУМЕНТАЦИЯ (без авторизации - доступна всем)
// Размещаем под /api чтобы избежать конфликтов с фронтенд роутингом
app.use('/api/docs/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: `
    .topbar-wrapper img { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1IiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzMzMzMzMyI+Q1JNIEFQSTwvdGV4dD4KPHN2Zz4K'); width: 100px; height: auto; }
    .swagger-ui .topbar { background-color: #1f2937; }
    .swagger-ui .info .title { color: #111827; }
  `,
  customSiteTitle: 'CRM API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
}));

// 📋 JSON спецификация Swagger (для генерации клиентов)
app.get('/api/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 🔐 АВТОРИЗАЦИЯ (без защиты)
app.use('/api/auth', authRoutes);

// ===============================
// 🛡️ ЗАЩИЩЕННЫЕ МАРШРУТЫ (требуют авторизации)
// ===============================

// Middleware авторизации для всех остальных API маршрутов
app.use('/api', authenticateToken);

// 👥 КЛИЕНТЫ - с адаптером для обратной совместимости
app.use('/api/clients', (req, res, next) => {
  // Сохраняем оригинальный res.json
  const originalJson = res.json;

  // Переопределяем res.json для адаптации ответов
  res.json = function(data) {
    // Если это наш новый формат с success/data, преобразуем для фронтенда
    if (data && typeof data === 'object' && data.success !== undefined) {
      return originalJson.call(this, data.data || data);
    }
    // Иначе возвращаем как есть
    return originalJson.call(this, data);
  };

  next();
}, clientsRoutes);

// 📝 ЗАМЕТКИ КЛИЕНТОВ - с адаптером для обратной совместимости
app.use('/api/clients', (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (data && typeof data === 'object' && data.success !== undefined) {
      return originalJson.call(this, data.data || data);
    }
    return originalJson.call(this, data);
  };

  next();
}, clientNotesRoutes);

app.use('/api/notes', (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (data && typeof data === 'object' && data.success !== undefined) {
      return originalJson.call(this, data.data || data);
    }
    return originalJson.call(this, data);
  };

  next();
}, clientNotesRoutes);

// 💰 ФИНАНСЫ - с адаптером для обратной совместимости И ОТЛАДКОЙ
app.use('/api/finances', (req, res, next) => {
  // 🔍 ОТЛАДКА: Логируем запрос ДО обработки
  console.log('🔍 MIDDLEWARE DEBUG: До обработки finances route');
  console.log('🔍 MIDDLEWARE DEBUG: req.originalUrl:', req.originalUrl);
  console.log('🔍 MIDDLEWARE DEBUG: req.url:', req.url);
  console.log('🔍 MIDDLEWARE DEBUG: req.query BEFORE:', req.query);
  console.log('🔍 MIDDLEWARE DEBUG: req.method:', req.method);

  const originalJson = res.json;

  res.json = function(data) {
    // 🔍 ОТЛАДКА: Логируем response
    console.log('🔍 MIDDLEWARE DEBUG: Обрабатываем response');
    console.log('🔍 MIDDLEWARE DEBUG: data type:', typeof data);
    console.log('🔍 MIDDLEWARE DEBUG: data.success:', data?.success);

    if (data && typeof data === 'object' && data.success !== undefined) {
      console.log('🔍 MIDDLEWARE DEBUG: Конвертируем response (success format)');
      return originalJson.call(this, data.data || data);
    }
    console.log('🔍 MIDDLEWARE DEBUG: Возвращаем response как есть');
    return originalJson.call(this, data);
  };

  // 🔍 ОТЛАДКА: Логируем запрос ПОСЛЕ установки middleware
  console.log('🔍 MIDDLEWARE DEBUG: req.query AFTER middleware setup:', req.query);

  next();
}, financesRoutes);

// 🏦 КАССЫ - с адаптером для обратной совместимости
app.use('/api/cash-desks', (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (data && typeof data === 'object' && data.success !== undefined) {
      return originalJson.call(this, data.data || data);
    }
    return originalJson.call(this, data);
  };

  next();
}, cashDesksRoutes);

// 👥 РАБОТНИКИ - с адаптером для обратной совместимости
app.use('/api/workers', (req, res, next) => {
  const originalJson = res.json;

  // Адаптер для унификации ответов
  res.json = function(data) {
    if (data && typeof data === 'object' && data.success !== undefined) {
      return originalJson.call(this, data.data || data);
    }
    return originalJson.call(this, data);
  };

  next();
}, workersRoutes);



// ===============================
// 🚫 ОБРАБОТКА ОШИБОК
// ===============================

// Обработчик несуществующих маршрутов
app.use(notFoundHandler);

// Главный обработчик ошибок
app.use(errorHandler);

// Обработчик необработанных ошибок процесса
unhandledErrorHandler();

// ===============================
// 🚀 ЗАПУСК СЕРВЕРА С РЕТРАЯМИ
// ===============================

const waitForDatabase = async (retries = 10, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      info('Подключение к PostgreSQL установлено', {
        action: 'database_connection',
        status: 'success',
        retry: i + 1
      });
      return true;
    } catch (error) {
      info(`Попытка подключения к PostgreSQL`, {
        action: 'database_connection',
        status: 'retrying',
        retry: i + 1,
        maxRetries: retries,
        error: error.message
      });
      if (i === retries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const startServer = async () => {
  try {
    // Ждем, пока база данных запустится
    await waitForDatabase();

    // Запускаем HTTP сервер
    server.listen(PORT, '0.0.0.0', () => {
      info('CRM BACKEND API запущен успешно', {
        action: 'server_startup',
        status: 'success',
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        features: {
          authentication: 'enabled',
          rateLimiting: 'enabled',
          validation: 'enabled',
          cors: 'enabled',
          backwardCompatibility: 'enabled',
          publicApi: 'enabled',
          trustProxy: 'enabled'
        },
        endpoints: [
          'GET /api/health',
          'POST /api/auth/login',
          'POST /api/auth/refresh',
          'POST /api/auth/logout',
          'GET /api/clients',
          'POST /api/clients',
          'PUT /api/clients/:id',
          'DELETE /api/clients/:id',
          'GET /api/finances',
          'POST /api/finances',
          'PUT /api/finances/:id',
          'DELETE /api/finances/:id',
          'GET /api/cash-desks',
          'POST /api/cash-desks',
          'PUT /api/cash-desks/:id',
          'DELETE /api/cash-desks/:id',
          'GET /api/workers',
          'POST /api/workers',
          'PUT /api/workers/:id',
          'DELETE /api/workers/:id',
          'GET /api/workers/:id/finances',
          'GET /api/workers/:id/stats',
          'POST /api/public/submit-application'
        ]
      });
    });
  } catch (error) {
    error('Критическая ошибка запуска сервера', {
      action: 'server_startup',
      status: 'failed',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// 🔄 GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  info('Получен SIGTERM, закрываем сервер', {
    action: 'server_shutdown',
    signal: 'SIGTERM'
  });
  server.close(() => {
    info('HTTP сервер закрыт', {
      action: 'server_shutdown',
      status: 'completed'
    });
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  info('Получен SIGINT, закрываем сервер', {
    action: 'server_shutdown',
    signal: 'SIGINT'
  });
  server.close(() => {
    info('HTTP сервер закрыт', {
      action: 'server_shutdown',
      status: 'completed'
    });
    process.exit(0);
  });
});

// Запускаем сервер
startServer();

module.exports = app;