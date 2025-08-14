// backend/middleware/errorHandler.js

// 🚨 ТИПЫ ОШИБОК И ИХ КОДЫ
const ERROR_CODES = {
  // Database errors
  UNIQUE_VIOLATION: '23505',
  NOT_NULL_VIOLATION: '23502',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',

  // Custom error types
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR'
};

// 📝 ОПИСАНИЯ ОШИБОК НА РУССКОМ
const ERROR_MESSAGES = {
  [ERROR_CODES.UNIQUE_VIOLATION]: 'Запись с такими данными уже существует',
  [ERROR_CODES.NOT_NULL_VIOLATION]: 'Обязательное поле не заполнено',
  [ERROR_CODES.FOREIGN_KEY_VIOLATION]: 'Ссылка на несуществующую запись',
  [ERROR_CODES.CHECK_VIOLATION]: 'Нарушено ограничение целостности данных',

  [ERROR_CODES.VALIDATION_ERROR]: 'Ошибка валидации входных данных',
  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Ошибка аутентификации',
  [ERROR_CODES.AUTHORIZATION_ERROR]: 'Недостаточно прав доступа',
  [ERROR_CODES.NOT_FOUND_ERROR]: 'Запрашиваемый ресурс не найден',
  [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 'Нарушение бизнес-логики'
};

// 🏥 КАСТОМНЫЕ КЛАССЫ ОШИБОК
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Необходима аутентификация') {
    super(message, 401, ERROR_CODES.AUTHENTICATION_ERROR);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Недостаточно прав доступа') {
    super(message, 403, ERROR_CODES.AUTHORIZATION_ERROR);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Ресурс') {
    super(`${resource} не найден`, 404, ERROR_CODES.NOT_FOUND_ERROR);
  }
}

class BusinessLogicError extends AppError {
  constructor(message) {
    super(message, 422, ERROR_CODES.BUSINESS_LOGIC_ERROR);
  }
}

// 🔧 ОБРАБОТЧИК ОШИБОК БД POSTGRESQL
const handleDatabaseError = (err) => {
  console.error('Database error:', {
    code: err.code,
    detail: err.detail,
    constraint: err.constraint,
    table: err.table,
    column: err.column
  });

  switch (err.code) {
    case ERROR_CODES.UNIQUE_VIOLATION:
      // Определяем, какое поле нарушает уникальность
      if (err.constraint && err.constraint.includes('email')) {
        return new ValidationError('Пользователь с таким email уже существует');
      }
      if (err.constraint && err.constraint.includes('name')) {
        return new ValidationError('Запись с таким именем уже существует');
      }
      return new ValidationError(ERROR_MESSAGES[ERROR_CODES.UNIQUE_VIOLATION]);

    case ERROR_CODES.NOT_NULL_VIOLATION:
      const field = err.column || 'поле';
      return new ValidationError(`Обязательное поле "${field}" не заполнено`);

    case ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return new ValidationError('Ссылка на несуществующую запись');

    case ERROR_CODES.CHECK_VIOLATION:
      return new ValidationError('Нарушено ограничение целостности данных');

    default:
      return new AppError('Ошибка базы данных', 500, 'DATABASE_ERROR');
  }
};

// 🔧 ОБРАБОТЧИК JWT ОШИБОК
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AuthenticationError('Недействительный токен');
  }
  if (err.name === 'TokenExpiredError') {
    return new AuthenticationError('Токен истёк');
  }
  if (err.name === 'NotBeforeError') {
    return new AuthenticationError('Токен ещё не активен');
  }
  return new AuthenticationError('Ошибка токена');
};

// 🏥 ГЛАВНЫЙ ОБРАБОТЧИК ОШИБОК
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Логируем ошибку для отладки
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    user: req.user?.email || 'anonymous'
  });

  // Обрабатываем различные типы ошибок
  if (err.code && err.code.startsWith('23')) {
    // PostgreSQL ошибки
    error = handleDatabaseError(err);
  } else if (err.name && err.name.includes('JsonWebToken')) {
    // JWT ошибки
    error = handleJWTError(err);
  } else if (!(err instanceof AppError)) {
    // Неизвестные ошибки
    error = new AppError('Внутренняя ошибка сервера', 500, 'INTERNAL_ERROR');
  }

  // Формируем ответ
  const response = {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    traceId: req.traceId || 'no-trace-id'
  };

  // Добавляем детали ошибки в development режиме или для валидации
  if (process.env.NODE_ENV === 'development' || error.errorCode === ERROR_CODES.VALIDATION_ERROR) {
    if (error.details) {
      response.details = error.details;
    }
    if (error.errorCode) {
      response.errorCode = error.errorCode;
    }
  }

  // Добавляем stack trace только в development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

// 🚫 ОБРАБОТЧИК 404 ОШИБОК
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Маршрут ${req.originalUrl}`);
  error.traceId = req.traceId || 'no-trace-id';
  next(error);
};

// 💔 ОБРАБОТЧИК НЕОБРАБОТАННЫХ ОШИБОК
const unhandledErrorHandler = () => {
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
  });
};

// 🔧 ОБЕРТКА ДЛЯ ASYNC ФУНКЦИЙ
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 🛡️ ПРОВЕРКА СУЩЕСТВОВАНИЯ РЕСУРСА
const checkResourceExists = (resource, resourceName = 'Ресурс') => {
  return (req, res, next) => {
    if (!resource || (Array.isArray(resource) && resource.length === 0)) {
      throw new NotFoundError(resourceName);
    }
    next();
  };
};

module.exports = {
  // Классы ошибок
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BusinessLogicError,

  // Константы
  ERROR_CODES,
  ERROR_MESSAGES,

  // Middleware
  errorHandler,
  notFoundHandler,
  unhandledErrorHandler,
  asyncHandler,
  checkResourceExists,

  // Обработчики
  handleDatabaseError,
  handleJWTError
};