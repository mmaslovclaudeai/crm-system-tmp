const winston = require('winston');
const path = require('path');

// Создаем форматтер для JSON логов
const jsonFormatter = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Создаем форматтер для консольных логов (человекочитаемый)
const consoleFormatter = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.printf(({ timestamp, level, message, service, method, url, statusCode, responseTime, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Добавляем метаданные если они есть
    if (service) log += ` | Service: ${service}`;
    if (method) log += ` | Method: ${method}`;
    if (url) log += ` | URL: ${url}`;
    if (statusCode) log += ` | Status: ${statusCode}`;
    if (responseTime) log += ` | Time: ${responseTime}ms`;
    
    // Добавляем stack trace для ошибок
    if (stack) log += `\n${stack}`;
    
    // Добавляем остальные метаданные
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      log += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Создаем логгер
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormatter,
  defaultMeta: { 
    service: 'crm-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Записываем все логи в файл
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Добавляем консольный транспорт только в development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormatter
  }));
}

// Создаем директорию для логов если её нет
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware для логирования HTTP запросов
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Генерируем уникальный TraceID для запроса
  const traceId = req.headers['x-trace-id'] || 
                 req.headers['x-request-id'] || 
                 `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Добавляем TraceID в объект запроса для использования в других middleware
  req.traceId = traceId;
  
  // Логируем начало запроса
  logger.info('HTTP Request Started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    traceId: traceId
  });

  // Перехватываем ответ
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - start;
    
    // Логируем завершение запроса
    logger.info('HTTP Request Completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length'),
      traceId: traceId
    });

    originalSend.call(this, data);
  };

  next();
};

// Функции для логирования с контекстом
const logWithContext = (level, message, context = {}) => {
  logger.log(level, message, {
    ...context,
    timestamp: new Date().toISOString()
  });
};

// Функция для логирования с TraceID
const logWithTraceId = (req, level, message, context = {}) => {
  const traceId = req?.traceId || 'no-trace-id';
  logger.log(level, message, {
    ...context,
    traceId: traceId,
    timestamp: new Date().toISOString()
  });
};

// Экспортируем функции для удобства
module.exports = {
  logger,
  requestLogger,
  info: (message, context) => logWithContext('info', message, context),
  warn: (message, context) => logWithContext('warn', message, context),
  error: (message, context) => logWithContext('error', message, context),
  debug: (message, context) => logWithContext('debug', message, context),
  
  // Функции с TraceID
  traceInfo: (req, message, context) => logWithTraceId(req, 'info', message, context),
  traceWarn: (req, message, context) => logWithTraceId(req, 'warn', message, context),
  traceError: (req, message, context) => logWithTraceId(req, 'error', message, context),
  traceDebug: (req, message, context) => logWithTraceId(req, 'debug', message, context),
  
  // Специальные функции для HTTP запросов
  httpRequest: (req, res, responseTime) => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      traceId: req.traceId
    });
  },
  
  // Специальные функции для ошибок
  httpError: (req, error, statusCode = 500) => {
    logger.error('HTTP Error', {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      traceId: req.traceId
    });
  },
  
  // Специальные функции для бизнес-логики
  businessLogic: (action, details) => {
    logger.info('Business Logic', {
      action,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  // Специальные функции для базы данных
  database: (operation, details) => {
    logger.info('Database Operation', {
      operation,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  // Специальные функции для Kafka
  kafka: (action, details) => {
    logger.info('Kafka Operation', {
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }
};
