// backend/routes/cashDesks.js
const express = require('express');
const router = express.Router();
const pool = require('../database');
const { requireRole } = require('../middleware/auth');
const {
  validateCashDesk,
  validateSearch,
  validateIdParam
} = require('../middleware/validation');
const {
  asyncHandler,
  NotFoundError,
  BusinessLogicError
} = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/cash-desks:
 *   get:
 *     tags: [CashDesks]
 *     summary: Получение списка касс
 *     description: Возвращает список всех касс с возможностью фильтрации и поиска
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Поисковая строка по названию кассы
 *         schema:
 *           type: string
 *         example: Основная
 *       - name: active_only
 *         in: query
 *         description: Показать только активные кассы
 *         schema:
 *           type: boolean
 *         example: true
 *     responses:
 *       200:
 *         description: Список касс успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashDeskListResponse'
 *       400:
 *         description: Ошибка валидации параметров
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 *   post:
 *     tags: [CashDesks]
 *     summary: Создание новой кассы
 *     description: Создает новую кассу в системе
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CashDeskCreateRequest'
 *     responses:
 *       201:
 *         description: Касса успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashDeskResponse'
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       409:
 *         description: Касса с таким названием уже существует
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Касса с таким названием уже существует
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/cash-desks/{id}:
 *   get:
 *     tags: [CashDesks]
 *     summary: Получение кассы по ID
 *     description: Возвращает подробную информацию о кассе с расчетным балансом
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Информация о кассе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashDeskResponse'
 *       400:
 *         description: Некорректный ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Касса не найдена
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
 *   put:
 *     tags: [CashDesks]
 *     summary: Обновление кассы
 *     description: Обновляет информацию о кассе
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CashDeskUpdateRequest'
 *     responses:
 *       200:
 *         description: Касса успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashDeskResponse'
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Касса не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: Касса с таким названием уже существует
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Касса с таким названием уже существует
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 *   delete:
 *     tags: [CashDesks]
 *     summary: Удаление кассы
 *     description: Удаляет кассу из системы (только если нет связанных операций)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Касса успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Касса успешно удалена
 *                 deleted_cash_desk:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Дополнительная касса
 *       400:
 *         description: Некорректный ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Касса не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: Невозможно удалить кассу с операциями или основную кассу
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/MainCashDeskError'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     error:
 *                       type: string
 *                       example: Невозможно удалить кассу. Найдено связанных операций
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/cash-desks/{id}/transactions:
 *   get:
 *     tags: [CashDesks]
 *     summary: Получение транзакций кассы
 *     description: Возвращает список всех транзакций (операций) конкретной кассы
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: limit
 *         in: query
 *         description: Количество записей для возврата
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - name: offset
 *         in: query
 *         description: Смещение для пагинации
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - name: status
 *         in: query
 *         description: Фильтр по статусу транзакций
 *         schema:
 *           type: string
 *           enum: [actual, planned]
 *     responses:
 *       200:
 *         description: Транзакции кассы успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashDeskTransactionsResponse'
 *       400:
 *         description: Некорректный ID или параметры
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Касса не найдена
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
 * /api/cash-desks/{id}/balance-history:
 *   get:
 *     tags: [CashDesks]
 *     summary: Получение истории баланса кассы
 *     description: Возвращает историю изменения баланса кассы за указанный период для построения графика
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: period
 *         in: query
 *         description: Количество дней для анализа истории баланса
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *       - name: end_date
 *         in: query
 *         description: Конечная дата для анализа (по умолчанию сегодня)
 *         schema:
 *           type: string
 *           format: date
 *         example: 2024-01-31
 *     responses:
 *       200:
 *         description: История баланса успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: История баланса кассы получена
 *                 data:
 *                   type: object
 *                   properties:
 *                     cash_desk_id:
 *                       type: integer
 *                       example: 1
 *                     cash_desk_name:
 *                       type: string
 *                       example: Основная касса
 *                     balance_history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: 2024-01-15
 *                           balance:
 *                             type: number
 *                             format: float
 *                             example: 125000.50
 *                           daily_change:
 *                             type: number
 *                             format: float
 *                             example: 5000.00
 *                           transactions_count:
 *                             type: integer
 *                             example: 3
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         period_change:
 *                           type: number
 *                           format: float
 *                           description: Общее изменение за период
 *                           example: 25000.00
 *                         period_change_percent:
 *                           type: number
 *                           format: float
 *                           description: Процентное изменение за период
 *                           example: 12.5
 *                         total_transactions:
 *                           type: integer
 *                           description: Общее количество транзакций за период
 *                           example: 85
 *                         average_balance:
 *                           type: number
 *                           format: float
 *                           description: Средний баланс за период
 *                           example: 135000.25
 *                         trend:
 *                           type: string
 *                           enum: [growing, declining, stable]
 *                           description: Тренд изменения баланса
 *                           example: growing
 *       400:
 *         description: Некорректный ID или параметры периода
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Касса не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       500:
 *         description: Ошибка при расчете истории баланса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/cash-desks/{id}/balance-adjustment:
 *   post:
 *     tags: [CashDesks]
 *     summary: Корректировка баланса кассы
 *     description: Выполняет корректировку баланса кассы (увеличение, уменьшение или установка точной суммы)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BalanceAdjustmentRequest'
 *     responses:
 *       200:
 *         description: Баланс успешно скорректирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BalanceAdjustmentResponse'
 *       400:
 *         description: Ошибка валидации данных корректировки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Касса не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: Касса неактивна или недостаточно средств для вычитания
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/CashDeskInactiveError'
 *                 - $ref: '#/components/schemas/CashDeskBalanceError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

// 🏦 ПОЛУЧЕНИЕ ВСЕХ КАСС
router.get('/',
  validateSearch,
  asyncHandler(async (req, res) => {
    const { search, active_only } = req.query;

    let query = `
      SELECT 
        cd.*,
        COUNT(f.id) as transactions_count,
        COALESCE(SUM(CASE WHEN f.type = 'income' AND f.status = 'actual' THEN f.amount ELSE 0 END), 0) as actual_income,
        COALESCE(SUM(CASE WHEN f.type = 'expense' AND f.status = 'actual' THEN f.amount ELSE 0 END), 0) as actual_expense,
        COALESCE(SUM(CASE WHEN f.status = 'actual' THEN f.amount ELSE 0 END), 0) as calculated_balance
      FROM crm.cash_desks cd
      LEFT JOIN crm.finances f ON cd.id = f.cash_desk_id
    `;

    let params = [];
    let whereConditions = [];

    // Фильтрация по поиску в названии
    if (search) {
      whereConditions.push(`cd.name ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }

    // Фильтрация только активных касс
    if (active_only === 'true') {
      whereConditions.push('cd.is_active = true');
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += `
      GROUP BY cd.id, cd.name, cd.current_balance, cd.description, cd.is_active, cd.created_at, cd.updated_at
      ORDER BY cd.created_at DESC
    `;

    const result = await pool.query(query, params);

    console.log(`🏦 Получен список касс пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  })
);

// 🏦 ПОЛУЧЕНИЕ КОНКРЕТНОЙ КАССЫ
router.get('/:id',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        cd.*,
        COUNT(f.id) as transactions_count,
        COALESCE(SUM(CASE WHEN f.type = 'income' AND f.status = 'actual' THEN f.amount ELSE 0 END), 0) as actual_income,
        COALESCE(SUM(CASE WHEN f.type = 'expense' AND f.status = 'actual' THEN f.amount ELSE 0 END), 0) as actual_expense,
        COALESCE(SUM(CASE WHEN f.status = 'actual' THEN f.amount ELSE 0 END), 0) as calculated_balance
      FROM crm.cash_desks cd
      LEFT JOIN crm.finances f ON cd.id = f.cash_desk_id
      WHERE cd.id = $1
      GROUP BY cd.id, cd.name, cd.current_balance, cd.description, cd.is_active, cd.created_at, cd.updated_at
    `, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Касса');
    }

    console.log(`🏦 Получена касса ID:${id} пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

// ➕ СОЗДАНИЕ НОВОЙ КАССЫ
router.post('/',
  validateCashDesk,
  asyncHandler(async (req, res) => {
    const {
      name,
      current_balance = 0.00,
      description = '',
      is_active = true
    } = req.body;

    console.log('🔍 Получены данные для создания кассы:', {
      name, current_balance, description, is_active
    });

    // Проверяем, что касса с таким названием не существует
    const existingCashDesk = await pool.query(
      'SELECT id FROM crm.cash_desks WHERE name = $1',
      [name.trim()]
    );

    if (existingCashDesk.rows.length > 0) {
      throw new BusinessLogicError('Касса с таким названием уже существует');
    }

    const result = await pool.query(`
      INSERT INTO crm.cash_desks (name, current_balance, description, is_active) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `, [name.trim(), parseFloat(current_balance), description.trim(), is_active]);

    console.log(`✅ Касса создана пользователем ${req.user.email}:`, {
      cashDeskId: result.rows[0].id,
      name: result.rows[0].name
    });

    res.status(201).json({
      success: true,
      message: 'Касса успешно создана',
      data: result.rows[0]
    });
  })
);

// ✏️ ОБНОВЛЕНИЕ КАССЫ
router.put('/:id',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      name,
      current_balance,
      description,
      is_active
    } = req.body;

    console.log('🔍 Получены данные для обновления кассы:', {
      name, current_balance, description, is_active
    });

    // Проверяем существование кассы
    const existingCashDesk = await pool.query(
      'SELECT * FROM crm.cash_desks WHERE id = $1',
      [id]
    );

    if (existingCashDesk.rows.length === 0) {
      throw new NotFoundError('Касса');
    }

    // Если обновляется название, проверяем уникальность
    if (name && name.trim() !== existingCashDesk.rows[0].name) {
      const nameCheck = await pool.query(
        'SELECT id FROM crm.cash_desks WHERE name = $1 AND id != $2',
        [name.trim(), id]
      );

      if (nameCheck.rows.length > 0) {
        throw new BusinessLogicError('Касса с таким названием уже существует');
      }
    }

    // Формируем запрос обновления только для переданных полей
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
      paramCount++;
    }

    if (current_balance !== undefined) {
      updates.push(`current_balance = $${paramCount}`);
      values.push(parseFloat(current_balance));
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description.trim());
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new BusinessLogicError('Нет данных для обновления');
    }

    // Добавляем updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE crm.cash_desks 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    console.log('🚀 Выполняем SQL запрос:', query);
    console.log('📋 Параметры:', values);

    const result = await pool.query(query, values);

    console.log(`✅ Касса ID:${id} обновлена пользователем ${req.user.email}`);

    res.json({
      success: true,
      message: 'Касса успешно обновлена',
      data: result.rows[0]
    });
  })
);

// 🗑️ УДАЛЕНИЕ КАССЫ (только admin)
router.delete('/:id',
  requireRole(['admin']),
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Проверяем существование кассы
    const existingCashDesk = await pool.query(
      'SELECT * FROM crm.cash_desks WHERE id = $1',
      [id]
    );

    if (existingCashDesk.rows.length === 0) {
      throw new NotFoundError('Касса');
    }

    // Проверяем, есть ли связанные финансовые операции
    const relatedTransactions = await pool.query(
      'SELECT COUNT(*) as count FROM crm.finances WHERE cash_desk_id = $1',
      [id]
    );

    if (parseInt(relatedTransactions.rows[0].count) > 0) {
      throw new BusinessLogicError(
        'Нельзя удалить кассу, к которой привязаны финансовые операции. Сначала переместите или удалите операции.'
      );
    }

    const result = await pool.query(
      'DELETE FROM crm.cash_desks WHERE id = $1 RETURNING *',
      [id]
    );

    console.log(`🗑️ Касса удалена пользователем ${req.user.email}:`, {
      cashDeskId: id,
      cashDeskName: result.rows[0].name
    });

    res.json({
      success: true,
      message: 'Касса успешно удалена',
      data: result.rows[0]
    });
  })
);

// 📊 ПОЛУЧЕНИЕ ОПЕРАЦИЙ ПО КАССЕ
router.get('/:id/transactions',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Проверяем существование кассы
    const cashDeskCheck = await pool.query(
      'SELECT name FROM crm.cash_desks WHERE id = $1',
      [id]
    );

    if (cashDeskCheck.rows.length === 0) {
      throw new NotFoundError('Касса');
    }

    const result = await pool.query(`
      SELECT 
        f.*, 
        c.name as client_name 
      FROM crm.finances f 
      LEFT JOIN crm.clients c ON f.client_id = c.id 
      WHERE f.cash_desk_id = $1
      ORDER BY f.date DESC, f.created_at DESC
    `, [id]);

    console.log(`📊 Получены операции кассы ID:${id} пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      cash_desk: cashDeskCheck.rows[0]
    });
  })
);

// 📊 ПОЛУЧЕНИЕ ИСТОРИИ БАЛАНСА КАССЫ ДЛЯ ГРАФИКА
router.get('/:id/balance-history',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { period = '30', end_date } = req.query;

    // Проверяем существование кассы
    const cashDeskCheck = await pool.query(
      'SELECT name FROM crm.cash_desks WHERE id = $1',
      [id]
    );

    if (cashDeskCheck.rows.length === 0) {
      throw new NotFoundError('Касса');
    }

    // Определяем период для анализа
    const periodDays = parseInt(period) || 30;
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - periodDays + 1);

    console.log(`📊 Запрос истории баланса кассы ID:${id} за ${periodDays} дней пользователем ${req.user.email}`);

    try {
      // Получаем все операции кассы до конечной даты, отсортированные по дате
      const financesQuery = `
        SELECT 
          date,
          amount,
          type,
          status,
          description,
          created_at
        FROM crm.finances 
        WHERE cash_desk_id = $1 
        AND date <= $2
        AND status = 'actual'
        ORDER BY date ASC, created_at ASC
      `;

      const financesResult = await pool.query(financesQuery, [id, endDate]);
      const transactions = financesResult.rows;

      // Получаем начальный баланс кассы (может быть задан вручную)
      const initialBalanceQuery = `
        SELECT current_balance
        FROM crm.cash_desks 
        WHERE id = $1
      `;
      const initialBalanceResult = await pool.query(initialBalanceQuery, [id]);
      const initialBalance = parseFloat(initialBalanceResult.rows[0]?.current_balance || 0);

      // Вычисляем накопительный баланс по дням
      const balanceHistory = [];
      const dailyData = new Map();

      // Группируем операции по дням
      transactions.forEach(transaction => {
        const dateKey = transaction.date.toISOString().split('T')[0];
        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, []);
        }
        dailyData.get(dateKey).push(transaction);
      });

      // Рассчитываем накопительный баланс
      let runningBalance = initialBalance;

      // Если есть операции до startDate, учитываем их в начальном балансе
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate < startDate) {
          runningBalance += parseFloat(transaction.amount);
        }
      });

      // Генерируем данные по дням для запрошенного периода
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const dayTransactions = dailyData.get(dateKey) || [];

        // Рассчитываем изменение за день
        const dayChange = dayTransactions.reduce((sum, transaction) => {
          return sum + parseFloat(transaction.amount);
        }, 0);

        // Только для дней в запрошенном периоде обновляем runningBalance
        if (d >= startDate) {
          runningBalance += dayChange;
        }

        balanceHistory.push({
          date: dateKey,
          balance: Math.round(runningBalance * 100) / 100, // Округляем до копеек
          daily_change: Math.round(dayChange * 100) / 100,
          transactions_count: dayTransactions.length,
          // Добавляем детали операций для этого дня (опционально)
          transactions: dayTransactions.map(t => ({
            amount: parseFloat(t.amount),
            type: t.type,
            description: t.description
          }))
        });
      }

      // Рассчитываем статистику для графика
      const balances = balanceHistory.map(day => day.balance);
      const minBalance = Math.min(...balances);
      const maxBalance = Math.max(...balances);
      const firstBalance = balances[0] || 0;
      const lastBalance = balances[balances.length - 1] || 0;
      const totalChange = lastBalance - firstBalance;
      const totalTransactions = balanceHistory.reduce((sum, day) => sum + day.transactions_count, 0);

      const statistics = {
        period_days: periodDays,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        first_balance: Math.round(firstBalance * 100) / 100,
        last_balance: Math.round(lastBalance * 100) / 100,
        min_balance: Math.round(minBalance * 100) / 100,
        max_balance: Math.round(maxBalance * 100) / 100,
        total_change: Math.round(totalChange * 100) / 100,
        change_percentage: firstBalance !== 0 ? Math.round((totalChange / Math.abs(firstBalance)) * 10000) / 100 : 0,
        total_transactions: totalTransactions,
        average_balance: Math.round((balances.reduce((sum, balance) => sum + balance, 0) / balances.length) * 100) / 100,
        trend: totalChange > 0 ? 'growing' : totalChange < 0 ? 'declining' : 'stable'
      };

      console.log(`✅ История баланса кассы ID:${id} рассчитана: ${balanceHistory.length} дней, ${totalTransactions} операций`);

      res.json({
        success: true,
        message: 'История баланса кассы получена',
        data: {
          cash_desk_id: parseInt(id),
          cash_desk_name: cashDeskCheck.rows[0].name,
          balance_history: balanceHistory,
          statistics: statistics
        }
      });

    } catch (error) {
      console.error('Ошибка при расчете истории баланса:', error);
      throw new Error('Ошибка при расчете истории баланса кассы');
    }
  })
);

module.exports = router;