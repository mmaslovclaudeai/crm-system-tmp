// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../database');
const {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  authenticateToken,
  JWT_SECRET
} = require('../middleware/auth');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Вход в систему
 *     description: Авторизация пользователя по email и паролю с выдачей JWT токенов
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Неверные учетные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidCredentialsError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Регистрация нового пользователя
 *     description: Создание нового пользователя в системе с автоматическим входом
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email нового пользователя
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Пароль (минимум 6 символов)
 *                 example: password123
 *               name:
 *                 type: string
 *                 description: Имя пользователя
 *                 example: Иван Петров
 *               role:
 *                 type: string
 *                 enum: [admin, manager, viewer]
 *                 default: viewer
 *                 description: Роль пользователя
 *                 example: manager
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: Пользователь с таким email уже существует
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Пользователь с таким email уже существует
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Обновление access токена
 *     description: Получение нового access токена по refresh токену
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Токен успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Refresh token отсутствует
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Refresh token required
 *       403:
 *         description: Недействительный refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidTokenError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Получение информации о текущем пользователе
 *     description: Возвращает данные авторизованного пользователя
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Пользователь не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Выход из системы
 *     description: Завершение сеанса пользователя
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный выход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 */

// POST /api/auth/login - Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Валидация входных данных
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email и пароль обязательны'
      });
    }

    // Поиск пользователя в базе данных
    const userResult = await pool.query(
      'SELECT * FROM crm.users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Неверный email или пароль'
      });
    }

    const user = userResult.rows[0];

    // Проверка пароля
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Неверный email или пароль'
      });
    }

    // Генерация токенов
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Обновление времени последнего входа
    await pool.query(
      'UPDATE crm.users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    console.log(`✅ Пользователь ${user.email} вошел в систему`);

    // Возврат токенов и информации о пользователе
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/register - Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'viewer' } = req.body;

    // Валидация входных данных
    if (!email || !password || !name) {
      return res.status(409).json({
        error: 'Email, пароль и имя обязательны'
      });
    }

    if (password.length < 6) {
      return res.status(409).json({
        error: 'Пароль должен содержать минимум 6 символов'
      });
    }

    // Проверка допустимых ролей
    const allowedRoles = ['admin', 'manager', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return res.status(409).json({
        error: 'Недопустимая роль пользователя'
      });
    }

    // Хеширование пароля
    const passwordHash = await hashPassword(password);

    // Создание пользователя
    const result = await pool.query(
      `INSERT INTO crm.users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name, role]
    );

    const newUser = result.rows[0];

    // Генерация токенов
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    console.log(`✅ Новый пользователь зарегистрирован: ${newUser.email} (${newUser.role})`);

    res.status(201).json({
      user: newUser,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === '23505') { // PostgreSQL unique constraint error
      return res.status(409).json({
        error: 'Пользователь с таким email уже существует'
      });
    }

    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/refresh - Обновление access токена
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    jwt.verify(refreshToken, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      if (decoded.type !== 'refresh') {
        return res.status(403).json({ error: 'Invalid token type' });
      }

      // Получение пользователя и генерация нового access токена
      const userResult = await pool.query(
        'SELECT id, email, name, role FROM crm.users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(403).json({ error: 'User not found' });
      }

      const user = userResult.rows[0];
      const accessToken = generateAccessToken(user);

      res.json({ accessToken });
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/auth/me - Получение информации о текущем пользователе
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, name, role, created_at FROM crm.users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/logout - Выход из системы
router.post('/logout', authenticateToken, (req, res) => {
  // В простой реализации просто возвращаем успех
  // В продакшене здесь можно добавить blacklist токенов
  console.log(`✅ Пользователь ${req.user.email} вышел из системы`);
  res.json({ message: 'Logout successful' });
});

// Инициализация админа при старте
const initializeAdmin = async () => {
  try {
    // Проверяем есть ли админ
    const adminResult = await pool.query(
      'SELECT id FROM crm.users WHERE role = $1 LIMIT 1',
      ['admin']
    );

    if (adminResult.rows.length === 0) {
      // Создаем админа
      const adminPassword = await hashPassword('admin123');
      await pool.query(
        'INSERT INTO crm.users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@crm.local', adminPassword, 'Администратор', 'admin']
      );
      console.log('🔑 Админ создан: admin@crm.local / admin123');
    }
  } catch (error) {
    console.error('Ошибка инициализации админа:', error);
  }
};

// Запускаем инициализацию админа
initializeAdmin();

module.exports = router;