// backend/docs/schemas/auth.js - Схемы для модуля авторизации

/**
 * @swagger
 * components:
 *   schemas:
 *     # ===== ЗАПРОСЫ =====
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя
 *           example: admin@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Пароль пользователя
 *           example: password123
 *       example:
 *         email: admin@example.com
 *         password: password123
 *
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token для обновления access token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *     # ===== ОТВЕТЫ =====
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT access token
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImlhdCI6MTY0NjEyMzQ1NiwiZXhwIjoxNjQ2MTI3MDU2fQ.abc123
 *             refreshToken:
 *               type: string
 *               description: Refresh token для обновления access token
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             expiresIn:
 *               type: integer
 *               description: Время жизни access token в секундах
 *               example: 3600
 *       example:
 *         success: true
 *         data:
 *           user:
 *             id: 1
 *             email: admin@example.com
 *             name: Администратор
 *             role: admin
 *           token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *           refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *           expiresIn: 3600
 *
 *     TokenResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: Новый JWT access token
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             expiresIn:
 *               type: integer
 *               description: Время жизни access token в секундах
 *               example: 3600
 *
 *     LogoutResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Успешный выход из системы
 *
 *     # ===== ПОЛЬЗОВАТЕЛЬ =====
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор пользователя
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя
 *           example: admin@example.com
 *         name:
 *           type: string
 *           description: Имя пользователя
 *           example: Администратор
 *         role:
 *           type: string
 *           enum: [admin, manager, user]
 *           description: Роль пользователя
 *           example: admin
 *         is_active:
 *           type: boolean
 *           description: Активен ли пользователь
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания пользователя
 *           example: 2024-01-01T00:00:00.000Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления
 *           example: 2024-01-01T00:00:00.000Z
 *       example:
 *         id: 1
 *         email: admin@example.com
 *         name: Администратор
 *         role: admin
 *         is_active: true
 *         created_at: 2024-01-01T00:00:00.000Z
 *         updated_at: 2024-01-01T00:00:00.000Z
 *
 *     # ===== ОШИБКИ АВТОРИЗАЦИИ =====
 *     InvalidCredentialsError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Неверный email или пароль
 *
 *     TokenExpiredError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Токен истек
 *
 *     InvalidTokenError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Недействительный токен
 */