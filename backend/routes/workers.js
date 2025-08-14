// backend/routes/workers.js - API для управления работниками
const express = require('express');
const router = express.Router();
const pool = require('../database');
const { requireRole } = require('../middleware/auth');
const {
  validateWorker,
  validateWorkerUpdate,
  validateSearch,
  validateIdParam
} = require('../middleware/validation');
const {
  asyncHandler,
  NotFoundError,
  BusinessLogicError
} = require('../middleware/errorHandler');

// 🔔 ДОБАВЛЯЕМ ИМПОРТ СЕРВИСА УВЕДОМЛЕНИЙ
const notificationService = require('../services/notificationService');

/**
 * @swagger
 * /api/workers:
 *   get:
 *     tags: [Workers]
 *     summary: Получение списка сотрудников
 *     description: Возвращает список всех сотрудников с возможностью фильтрации и поиска
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Поисковая строка по ФИО или должности
 *         schema:
 *           type: string
 *         example: Анна
 *       - name: active_only
 *         in: query
 *         description: Показать только активных сотрудников
 *         schema:
 *           type: boolean
 *         example: true
 *     responses:
 *       200:
 *         description: Список сотрудников успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkerListResponse'
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
 *     tags: [Workers]
 *     summary: Создание нового сотрудника
 *     description: Создает нового сотрудника в системе
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkerCreateRequest'
 *     responses:
 *       201:
 *         description: Сотрудник успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkerResponse'
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
 *       403:
 *         description: Недостаточно прав (только администраторы и менеджеры)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       409:
 *         description: Сотрудник с таким email уже существует
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
 *                   example: Сотрудник с таким email уже существует
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/workers/{id}:
 *   get:
 *     tags: [Workers]
 *     summary: Получение сотрудника по ID
 *     description: Возвращает подробную информацию о сотруднике
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Информация о сотруднике
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkerResponse'
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
 *         description: Сотрудник не найден
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
 *     tags: [Workers]
 *     summary: Обновление сотрудника
 *     description: Обновляет информацию о сотруднике
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkerUpdateRequest'
 *     responses:
 *       200:
 *         description: Сотрудник успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkerResponse'
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
 *       403:
 *         description: Недостаточно прав (только администраторы и менеджеры)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       404:
 *         description: Сотрудник не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: Email уже используется другим сотрудником
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
 *                   example: Email уже используется другим сотрудником
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 *   delete:
 *     tags: [Workers]
 *     summary: Удаление сотрудника
 *     description: Удаляет сотрудника из системы (только для администраторов)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Сотрудник успешно удален
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
 *                   example: Работник успешно удален
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
 *       403:
 *         description: Недостаточно прав (только администраторы)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       404:
 *         description: Сотрудник не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: Невозможно удалить сотрудника с связанными записями
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkerHasClientsError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/workers/{id}/finances:
 *   get:
 *     tags: [Workers]
 *     summary: Получение финансовых операций сотрудника
 *     description: Возвращает все финансовые операции, связанные с конкретным сотрудником
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Финансовые операции сотрудника успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkerFinancesResponse'
 *       400:
 *         description: Некорректный ID сотрудника
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
 *         description: Сотрудник не найден
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
 * /api/workers/{id}/stats:
 *   get:
 *     tags: [Workers]
 *     summary: Получение статистики по сотруднику
 *     description: Возвращает детальную статистику эффективности сотрудника включая финансовые показатели и работу с клиентами
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *       - name: period
 *         in: query
 *         description: Период для анализа статистики в месяцах
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 12
 *         example: 6
 *     responses:
 *       200:
 *         description: Статистика сотрудника успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     worker_info:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         full_name:
 *                           type: string
 *                           example: Анна Смирнова
 *                         position:
 *                           type: string
 *                           example: Куратор курсов
 *                         is_active:
 *                           type: boolean
 *                           example: true
 *                         hire_date:
 *                           type: string
 *                           format: date
 *                           example: 2023-01-15
 *                         work_experience:
 *                           type: string
 *                           example: 1 лет 2 мес.
 *                     general_stats:
 *                       type: object
 *                       properties:
 *                         total_transactions:
 *                           type: integer
 *                           description: Общее количество транзакций
 *                           example: 156
 *                         income_transactions:
 *                           type: integer
 *                           description: Количество доходных операций
 *                           example: 89
 *                         expense_transactions:
 *                           type: integer
 *                           description: Количество расходных операций
 *                           example: 67
 *                         total_income:
 *                           type: number
 *                           format: float
 *                           description: Общий доход
 *                           example: 450000.00
 *                         total_expenses:
 *                           type: number
 *                           format: float
 *                           description: Общие расходы
 *                           example: 125000.00
 *                         net_result:
 *                           type: number
 *                           format: float
 *                           description: Чистый результат (доход - расходы)
 *                           example: 325000.00
 *                         avg_income:
 *                           type: number
 *                           format: float
 *                           description: Средний доход за операцию
 *                           example: 5056.18
 *                         first_transaction_date:
 *                           type: string
 *                           format: date
 *                           example: 2023-02-01
 *                         last_transaction_date:
 *                           type: string
 *                           format: date
 *                           example: 2024-01-15
 *                     monthly_stats:
 *                       type: array
 *                       description: Статистика по месяцам за последний год
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             format: date
 *                             example: 2024-01-01T00:00:00.000Z
 *                           transactions:
 *                             type: integer
 *                             example: 15
 *                           income:
 *                             type: number
 *                             format: float
 *                             example: 45000.00
 *                           expenses:
 *                             type: number
 *                             format: float
 *                             example: 12000.00
 *                           net:
 *                             type: number
 *                             format: float
 *                             example: 33000.00
 *                     top_clients:
 *                       type: array
 *                       description: Топ-5 клиентов сотрудника по выручке
 *                       items:
 *                         type: object
 *                         properties:
 *                           client_name:
 *                             type: string
 *                             example: Иван Петров
 *                           transactions:
 *                             type: integer
 *                             example: 8
 *                           total_income:
 *                             type: number
 *                             format: float
 *                             example: 65000.00
 *       400:
 *         description: Некорректный ID сотрудника или параметры
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
 *         description: Сотрудник не найден
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
 * /api/workers/stats/overview:
 *   get:
 *     tags: [Workers]
 *     summary: Получение общей статистики по всем сотрудникам
 *     description: Возвращает агрегированную статистику по всем сотрудникам, включая распределение по ролям, отделам и рейтинг производительности
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Общая статистика по сотрудникам успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkersOverallStatsResponse'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Недостаточно прав (только администраторы и менеджеры)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/workers/permissions:
 *   get:
 *     tags: [Workers]
 *     summary: Получение списка доступных ролей и прав
 *     description: Возвращает список всех доступных ролей и прав доступа в системе
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Список ролей и прав успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PermissionsResponse'
 *       401:
 *         description: Неавторизованный доступ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Недостаточно прав (только администраторы)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

// 🛠️ УТИЛИТЫ ДЛЯ РАБОТЫ С РАБОТНИКАМИ

// Маскировка номера карты для безопасности
const maskCardNumber = (cardNumber) => {
  if (!cardNumber) return null;
  if (cardNumber.length < 8) return cardNumber;
  return cardNumber.substring(0, 4) + '****' + cardNumber.substring(cardNumber.length - 4);
};

// Форматирование стажа работы
const calculateWorkExperience = (hireDate, fireDate = null) => {
  const startDate = new Date(hireDate);
  const endDate = fireDate ? new Date(fireDate) : new Date();

  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);

  if (years > 0) {
    return `${years} лет ${months} мес.`;
  } else {
    return `${months} мес.`;
  }
};

// 🔧 ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Отправка WebSocket события
const emitWorkerEvent = (req, eventType, workerData, changes = {}) => {
  try {
    const webSocketService = req.webSocketService;
    if (webSocketService) {
      switch (eventType) {
        case 'created':
          webSocketService.emitWorkerCreated && webSocketService.emitWorkerCreated(workerData);
          break;
        case 'updated':
          webSocketService.emitWorkerUpdated && webSocketService.emitWorkerUpdated(workerData, changes);
          break;
        case 'deleted':
          webSocketService.emitWorkerDeleted && webSocketService.emitWorkerDeleted(workerData.id, workerData);
          break;
        default:
          console.warn('Неизвестный тип события для работника:', eventType);
      }
    }
  } catch (error) {
    console.error('Ошибка отправки WebSocket события для работника:', error);
    // Не прерываем выполнение, если WebSocket недоступен
  }
};

// ===============================
// 👥 ПОЛУЧЕНИЕ СПИСКА РАБОТНИКОВ
// ===============================
router.get('/',
  validateSearch,
  asyncHandler(async (req, res) => {
    const { search, active_only } = req.query;

    let query = `
      SELECT 
        w.*,
        COUNT(f.id) as transactions_count,
        COALESCE(SUM(CASE WHEN f.type = 'expense' THEN ABS(f.amount) ELSE 0 END), 0) as total_salary_paid,
        COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE 0 END), 0) as total_income_brought,
        COALESCE(MAX(f.date), NULL) as last_transaction_date
      FROM crm.workers w
      LEFT JOIN crm.finances f ON w.id = f.worker_id
    `;

    let params = [];
    let whereConditions = [];

    // Фильтрация по поиску в ФИО или должности
    if (search) {
      whereConditions.push(`(w.full_name ILIKE $${params.length + 1} OR w.position ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    // Фильтрация только активных работников
    if (active_only === 'true') {
      whereConditions.push('w.is_active = true');
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += `
      GROUP BY w.id, w.full_name, w.position, w.telegram_username, w.phone, w.bank, 
               w.card_number, w.hire_date, w.fire_date, w.is_active, w.created_at, w.updated_at
      ORDER BY w.created_at DESC
    `;

    const result = await pool.query(query, params);

    // Маскируем номера карт в ответе
    const workersWithMaskedCards = result.rows.map(worker => ({
      ...worker,
      masked_card_number: maskCardNumber(worker.card_number),
      work_experience: calculateWorkExperience(worker.hire_date, worker.fire_date),
      card_number: undefined // Убираем полный номер карты из ответа
    }));

    console.log(`👥 Получен список работников пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: workersWithMaskedCards,
      count: workersWithMaskedCards.length
    });
  })
);

// ===============================
// 👤 ПОЛУЧЕНИЕ КОНКРЕТНОГО РАБОТНИКА
// ===============================
router.get('/:id',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        w.*,
        COUNT(f.id) as transactions_count,
        COALESCE(SUM(CASE WHEN f.type = 'expense' THEN ABS(f.amount) ELSE 0 END), 0) as total_salary_paid,
        COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE 0 END), 0) as total_income_brought,
        COALESCE(MAX(f.date), NULL) as last_transaction_date
      FROM crm.workers w
      LEFT JOIN crm.finances f ON w.id = f.worker_id
      WHERE w.id = $1
      GROUP BY w.id, w.full_name, w.position, w.telegram_username, w.phone, w.bank, 
               w.card_number, w.hire_date, w.fire_date, w.is_active, w.created_at, w.updated_at
    `, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Работник');
    }

    const worker = result.rows[0];

    // Добавляем дополнительные поля
    const workerWithExtras = {
      ...worker,
      masked_card_number: maskCardNumber(worker.card_number),
      work_experience: calculateWorkExperience(worker.hire_date, worker.fire_date),
      card_number: undefined // Убираем полный номер карты из ответа
    };

    console.log(`👤 Получен работник: ${worker.full_name} пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: workerWithExtras
    });
  })
);

// ===============================
// ➕ СОЗДАНИЕ НОВОГО РАБОТНИКА
// ===============================
router.post('/',
  requireRole(['admin', 'manager']),
  validateWorker,
  asyncHandler(async (req, res) => {
    const {
      full_name,
      position,
      telegram_username,
      phone,
      bank,
      card_number,
      hire_date
    } = req.body;

    // Проверяем уникальность email и телефона
    const existingWorker = await pool.query(`
      SELECT id, full_name 
      FROM crm.workers 
      WHERE (phone = $1 AND phone IS NOT NULL) 
         OR (telegram_username = $2 AND telegram_username IS NOT NULL)
    `, [phone, telegram_username]);

    if (existingWorker.rows.length > 0) {
      throw new BusinessLogicError(
        'Работник с таким телефоном или Telegram уже существует'
      );
    }

    // Создаем нового работника
    const result = await pool.query(`
      INSERT INTO crm.workers (
        full_name, position, telegram_username, phone, bank, card_number, hire_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [full_name, position, telegram_username, phone, bank, card_number, hire_date]);

    const newWorker = result.rows[0];

    // Добавляем вычисляемые поля
    const workerWithDetails = {
      ...newWorker,
      masked_card_number: maskCardNumber(newWorker.card_number),
      work_experience: calculateWorkExperience(newWorker.hire_date),
      transactions_count: 0,
      total_salary_paid: 0,
      total_income_brought: 0,
      last_transaction_date: null,
      card_number: undefined
    };

    // 🔌 Отправляем WebSocket событие

    // 🔌 Отправляем WebSocket событие
    emitWorkerEvent(req, 'created', workerWithDetails);

    console.log(`✅ Создан новый работник: ${newWorker.full_name} пользователем ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: workerWithDetails,
      message: 'Работник успешно создан'
    });
  })
);

// ===============================
// ✏️ ОБНОВЛЕНИЕ РАБОТНИКА
// ===============================
router.put('/:id',
  requireRole(['admin', 'manager']),
  validateIdParam,
  validateWorkerUpdate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Получаем текущие данные работника
    const currentResult = await pool.query('SELECT * FROM crm.workers WHERE id = $1', [id]);

    if (currentResult.rows.length === 0) {
      throw new NotFoundError('Работник');
    }

    const currentWorker = currentResult.rows[0];

    // Проверяем уникальность при обновлении
    if (updateData.phone || updateData.telegram_username) {
      const existingWorker = await pool.query(`
        SELECT id, full_name 
        FROM crm.workers 
        WHERE id != $1 AND (
          (phone = $2 AND $2 IS NOT NULL) 
          OR (telegram_username = $3 AND $3 IS NOT NULL)
        )
      `, [id, updateData.phone, updateData.telegram_username]);

      if (existingWorker.rows.length > 0) {
        throw new BusinessLogicError(
          'Работник с таким телефоном или Telegram уже существует'
        );
      }
    }

    // Автоматически обновляем is_active при изменении fire_date
    if (updateData.fire_date !== undefined) {
      updateData.is_active = updateData.fire_date === null;
    }

    // Строим запрос для обновления
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      updateFields.push(`${key} = $${paramIndex}`);
      updateValues.push(updateData[key]);
      paramIndex++;
    });

    updateValues.push(id); // Добавляем ID в конец для WHERE clause

    const updateQuery = `
      UPDATE crm.workers 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, updateValues);
    const updatedWorker = result.rows[0];

    // Добавляем вычисляемые поля
    const workerWithDetails = {
      ...updatedWorker,
      masked_card_number: maskCardNumber(updatedWorker.card_number),
      work_experience: calculateWorkExperience(updatedWorker.hire_date, updatedWorker.fire_date),
      card_number: undefined
    };

    // Определяем изменения для уведомлений
    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (currentWorker[key] !== updateData[key]) {
        changes[key] = {
          old: currentWorker[key],
          new: updateData[key]
        };
      }
    });



    // 🔌 Отправляем WebSocket событие
    emitWorkerEvent(req, 'updated', workerWithDetails, changes);

    console.log(`✅ Обновлен работник: ${updatedWorker.full_name} пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: workerWithDetails,
      message: 'Работник успешно обновлен'
    });
  })
);

// ===============================
// 🗑️ УДАЛЕНИЕ РАБОТНИКА
// ===============================
router.delete('/:id',
  requireRole(['admin']),
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Получаем информацию о работнике перед удалением
    const workerResult = await pool.query('SELECT * FROM crm.workers WHERE id = $1', [id]);

    if (workerResult.rows.length === 0) {
      throw new NotFoundError('Работник');
    }

    const worker = workerResult.rows[0];

    // Проверяем, есть ли связанные финансовые операции
    const financesResult = await pool.query(
      'SELECT COUNT(*) as count FROM crm.finances WHERE worker_id = $1',
      [id]
    );

    const financesCount = parseInt(financesResult.rows[0].count);

    if (financesCount > 0) {
      throw new BusinessLogicError(
        `Невозможно удалить работника. У него есть ${financesCount} связанных финансовых операций. Сначала удалите или перенесите операции.`
      );
    }

    // Удаляем работника
    await pool.query('DELETE FROM crm.workers WHERE id = $1', [id]);



    // 🔌 Отправляем WebSocket событие
    emitWorkerEvent(req, 'deleted', { id, ...worker });

    console.log(`🗑️ Удален работник: ${worker.full_name} пользователем ${req.user.email}`);

    res.json({
      success: true,
      message: 'Работник успешно удален'
    });
  })
);

// ===============================
// 💰 ПОЛУЧЕНИЕ ФИНАНСОВЫХ ОПЕРАЦИЙ РАБОТНИКА
// ===============================
router.get('/:id/finances',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Проверяем существование работника
    const workerCheck = await pool.query('SELECT id, full_name FROM crm.workers WHERE id = $1', [id]);

    if (workerCheck.rows.length === 0) {
      throw new NotFoundError('Работник');
    }

    // Получаем финансовые операции работника
    const result = await pool.query(`
      SELECT 
        f.*,
        c.name as client_name,
        cd.name as cash_desk_name
      FROM crm.finances f
      LEFT JOIN crm.clients c ON f.client_id = c.id
      LEFT JOIN crm.cash_desks cd ON f.cash_desk_id = cd.id
      WHERE f.worker_id = $1
      ORDER BY f.date DESC, f.created_at DESC
    `, [id]);

    console.log(`💰 Получены финансовые операции работника ${workerCheck.rows[0].full_name} пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      worker: workerCheck.rows[0]
    });
  })
);

// ===============================
// 📊 СТАТИСТИКА ПО РАБОТНИКУ
// ===============================
router.get('/:id/stats',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Проверяем существование работника
    const workerCheck = await pool.query('SELECT * FROM crm.workers WHERE id = $1', [id]);

    if (workerCheck.rows.length === 0) {
      throw new NotFoundError('Работник');
    }

    const worker = workerCheck.rows[0];

    // Получаем детальную статистику
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE type = 'income') as income_transactions,
        COUNT(*) FILTER (WHERE type = 'expense') as expense_transactions,
        
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
        
        COALESCE(AVG(CASE WHEN type = 'income' THEN amount END), 0) as avg_income,
        COALESCE(AVG(CASE WHEN type = 'expense' THEN ABS(amount) END), 0) as avg_expense,
        
        COALESCE(MAX(CASE WHEN type = 'income' THEN amount END), 0) as max_income,
        COALESCE(MAX(CASE WHEN type = 'expense' THEN ABS(amount) END), 0) as max_expense,
        
        MIN(date) as first_transaction_date,
        MAX(date) as last_transaction_date
        
      FROM crm.finances 
      WHERE worker_id = $1
    `, [id]);

    // Статистика по месяцам за последний год
    const monthlyStatsResult = await pool.query(`
      SELECT 
        DATE_TRUNC('month', date) as month,
        COUNT(*) as transactions,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as expenses
      FROM crm.finances 
      WHERE worker_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
    `, [id]);

    // Статистика по клиентам (топ-5 клиентов этого работника)
    const clientStatsResult = await pool.query(`
      SELECT 
        c.name as client_name,
        COUNT(f.*) as transactions,
        COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE 0 END), 0) as total_income
      FROM crm.finances f
      JOIN crm.clients c ON f.client_id = c.id
      WHERE f.worker_id = $1
      GROUP BY c.id, c.name
      ORDER BY total_income DESC
      LIMIT 5
    `, [id]);

    const stats = statsResult.rows[0];

    // Формируем итоговую статистику
    const workerStats = {
      // Основная информация о работнике
      worker_info: {
        id: worker.id,
        full_name: worker.full_name,
        position: worker.position,
        is_active: worker.is_active,
        hire_date: worker.hire_date,
        fire_date: worker.fire_date,
        work_experience: calculateWorkExperience(worker.hire_date, worker.fire_date)
      },

      // Общая статистика
      general_stats: {
        total_transactions: parseInt(stats.total_transactions),
        income_transactions: parseInt(stats.income_transactions),
        expense_transactions: parseInt(stats.expense_transactions),

        total_income: parseFloat(stats.total_income),
        total_expenses: parseFloat(stats.total_expenses),
        net_result: parseFloat(stats.total_income) - parseFloat(stats.total_expenses),

        avg_income: parseFloat(stats.avg_income),
        avg_expense: parseFloat(stats.avg_expense),

        max_income: parseFloat(stats.max_income),
        max_expense: parseFloat(stats.max_expense),

        first_transaction_date: stats.first_transaction_date,
        last_transaction_date: stats.last_transaction_date
      },

      // Статистика по месяцам
      monthly_stats: monthlyStatsResult.rows.map(row => ({
        month: row.month,
        transactions: parseInt(row.transactions),
        income: parseFloat(row.income),
        expenses: parseFloat(row.expenses),
        net: parseFloat(row.income) - parseFloat(row.expenses)
      })),

      // Топ клиенты
      top_clients: clientStatsResult.rows.map(row => ({
        client_name: row.client_name,
        transactions: parseInt(row.transactions),
        total_income: parseFloat(row.total_income)
      }))
    };

    console.log(`📊 Получена статистика работника: ${worker.full_name} пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: workerStats
    });
  })
);

module.exports = router;