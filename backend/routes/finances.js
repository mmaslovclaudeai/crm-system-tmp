// backend/routes/finances.js - ОБНОВЛЕН ДЛЯ ПОДДЕРЖКИ TRANSFER ОПЕРАЦИЙ
const express = require('express');
const router = express.Router();
const pool = require('../database');
const { requireRole } = require('../middleware/auth');

console.log('📋 Загружается routes/finances.js');

router.use((req, res, next) => {
  console.log('🔍 FINANCES ROUTER DEBUG:', {
    method: req.method,
    originalUrl: req.originalUrl,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  next();
});

// 🆕 НОВОЕ: Обновленные импорты для модульной валидации
const {
  validateFinance,
  validateTransferPair,
  validateIdParam,
  validateClientIdParam
} = require('../middleware/validation');

const {
  asyncHandler,
  NotFoundError,
  BusinessLogicError
} = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/finances:
 *   get:
 *     tags: [Finances]
 *     summary: Получение списка финансовых операций
 *     description: Возвращает список финансовых операций с возможностью фильтрации по статусу, датам и поиску
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Поисковая строка по описанию операции
 *         schema:
 *           type: string
 *         example: оплата курса
 *       - name: status
 *         in: query
 *         description: Статус операций для фильтрации
 *         schema:
 *           type: string
 *           enum: [actual, planned]
 *         example: actual
 *       - $ref: '#/components/parameters/DateFromParam'
 *       - $ref: '#/components/parameters/DateToParam'
 *     responses:
 *       200:
 *         description: Список финансовых операций успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceListResponse'
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
 *     tags: [Finances]
 *     summary: Создание новой финансовой операции
 *     description: Создает новую финансовую операцию (доход, расход)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinanceCreateRequest'
 *     responses:
 *       201:
 *         description: Операция успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceResponse'
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
 *         description: Клиент или касса не найдены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashDeskNotFoundError'
 *       409:
 *         description: Недостаточно средств для расходной операции
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InsufficientFundsError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/finances/{id}:
 *   get:
 *     tags: [Finances]
 *     summary: Получение финансовой операции по ID
 *     description: Возвращает подробную информацию о финансовой операции
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Информация об операции
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceResponse'
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
 *         description: Операция не найдена
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
 *     tags: [Finances]
 *     summary: Обновление финансовой операции
 *     description: Обновляет существующую финансовую операцию
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinanceUpdateRequest'
 *     responses:
 *       200:
 *         description: Операция успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceResponse'
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
 *         description: Операция не найдена
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
 *   delete:
 *     tags: [Finances]
 *     summary: Удаление финансовой операции
 *     description: Удаляет финансовую операцию из системы
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Операция успешно удалена
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
 *                   example: Финансовая операция успешно удалена
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
 *         description: Операция не найдена
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
 * /api/finances/transfer:
 *   post:
 *     tags: [Finances]
 *     summary: Создание трансферной операции между кассами
 *     description: Создает пару операций для перевода средств между кассами
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferPairRequest'
 *     responses:
 *       201:
 *         description: Перевод успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferPairResponse'
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
 *         description: Одна из касс не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CashDeskNotFoundError'
 *       409:
 *         description: Недостаточно средств в кассе-источнике или попытка перевода между одинаковыми кассами
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/InsufficientFundsError'
 *                 - $ref: '#/components/schemas/InvalidTransferError'
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/finances/summary/stats:
 *   get:
 *     tags: [Finances]
 *     summary: Получение сводной статистики по финансам
 *     description: Возвращает агрегированную статистику по доходам, расходам и балансу с возможностью фильтрации по датам
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/DateFromParam'
 *       - $ref: '#/components/parameters/DateToParam'
 *     responses:
 *       200:
 *         description: Статистика успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceSummaryResponse'
 *       400:
 *         description: Ошибка валидации параметров даты
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
 * /api/finances/client/{clientId}:
 *   get:
 *     tags: [Finances]
 *     summary: Получение финансовых операций по клиенту
 *     description: Возвращает все финансовые операции, связанные с конкретным клиентом
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ClientIdParam'
 *     responses:
 *       200:
 *         description: Операции клиента успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinanceListResponse'
 *       400:
 *         description: Некорректный ID клиента
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
 *         description: Клиент не найден
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
 * /api/finances/export/statement:
 *   get:
 *     tags: [Finances]
 *     summary: Экспорт финансовой выписки
 *     description: Генерирует и возвращает финансовую выписку в формате CSV с детализацией по доходам, расходам и переводам
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/DateFromParam'
 *       - $ref: '#/components/parameters/DateToParam'
 *       - name: format
 *         in: query
 *         description: Формат экспорта
 *         schema:
 *           type: string
 *           enum: [csv]
 *           default: csv
 *     responses:
 *       200:
 *         description: Финансовая выписка успешно сгенерирована
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *               description: CSV файл с финансовой выпиской
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
 *                     filename:
 *                       type: string
 *                       example: finance_statement_2024-01-01_2024-01-31.csv
 *                     total_operations:
 *                       type: integer
 *                       example: 156
 *                     period:
 *                       type: string
 *                       example: 2024-01-01 - 2024-01-31
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
 *         description: Ошибка генерации выписки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

// 💰 ПОЛУЧЕНИЕ ВСЕХ ФИНАНСОВЫХ ОПЕРАЦИЙ С РАСШИРЕННОЙ ФИЛЬТРАЦИЕЙ
router.get('/',
  asyncHandler(async (req, res) => {
    const { 
      search, 
      status, 
      date_from, 
      date_to, 
      cash_desk_id, 
      client_search, 
      worker_search, 
      category, 
      description 
    } = req.query;

    console.log('🔍 DEBUG: Входящие параметры фильтрации:', {
      search, status, date_from, date_to, cash_desk_id, 
      client_search, worker_search, category, description
    });

    let query = `
      SELECT 
        f.*, 
        c.name as client_name, 
        cd.name as cash_desk_name,
        w.full_name as worker_name,
        w.telegram_username as worker_telegram
      FROM crm.finances f 
      LEFT JOIN crm.clients c ON f.client_id = c.id 
      LEFT JOIN crm.cash_desks cd ON f.cash_desk_id = cd.id
      LEFT JOIN crm.workers w ON f.worker_id = w.id
    `;

    let params = [];
    let whereConditions = [];

    // Фильтрация по поиску в описании (legacy параметр)
    if (search) {
      whereConditions.push(`f.description ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }

    // Фильтрация по статусу (actual/planned)
    if (status) {
      whereConditions.push(`f.status = $${params.length + 1}`);
      params.push(status);
    }

    // Фильтрация по дате "от"
    if (date_from) {
      whereConditions.push(`f.date >= $${params.length + 1}`);
      params.push(date_from);
    }

    // Фильтрация по дате "до"
    if (date_to) {
      whereConditions.push(`f.date <= $${params.length + 1}`);
      params.push(date_to);
    }

    // Фильтрация по кассе
    if (cash_desk_id) {
      whereConditions.push(`f.cash_desk_id = $${params.length + 1}`);
      params.push(cash_desk_id);
    }

    // Фильтрация по клиенту (ФИО, email, телефон, телеграм)
    if (client_search) {
      whereConditions.push(`(
        LOWER(c.name) LIKE $${params.length + 1} OR 
        LOWER(c.email) LIKE $${params.length + 2} OR 
        c.phone LIKE $${params.length + 3} OR 
        LOWER(c.telegram) LIKE $${params.length + 4}
      )`);
      const searchTerm = `%${client_search.toLowerCase()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Фильтрация по работнику (ФИО, должность, телефон, телеграм)
    if (worker_search) {
      whereConditions.push(`(
        LOWER(w.full_name) LIKE $${params.length + 1} OR 
        LOWER(w.position) LIKE $${params.length + 2} OR 
        w.phone LIKE $${params.length + 3} OR 
        LOWER(w.telegram_username) LIKE $${params.length + 4}
      )`);
      const searchTerm = `%${worker_search.toLowerCase()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Фильтрация по категории
    if (category) {
      whereConditions.push(`f.category = $${params.length + 1}`);
      params.push(category);
    }

    // Фильтрация по описанию (новый параметр)
    if (description) {
      whereConditions.push(`f.description ILIKE $${params.length + 1}`);
      params.push(`%${description}%`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` ORDER BY f.date DESC, f.created_at DESC`;

    const result = await pool.query(query, params);

    console.log(`📋 Получено ${result.rows.length} финансовых операций пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  })
);

// 📋 ГЕНЕРАЦИЯ ВЫПИСКИ В ФОРМАТЕ CSV - ИСПРАВЛЕННАЯ ВЕРСИЯ
router.get('/statement',
  asyncHandler(async (req, res) => {
    const { date_from, date_to } = req.query;

    console.log('📋 Запрос на генерацию выписки:', {
      date_from, date_to,
      user: req.user?.email || 'UNKNOWN'
    });

    // Валидация дат
    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        error: 'Параметры date_from и date_to обязательны'
      });
    }

    try {
      // 1. ПОЛУЧЕНИЕ ВСЕХ ACTUAL ОПЕРАЦИЙ ЗА ПЕРИОД
      const financesQuery = `
        SELECT 
          f.id,
          f.date,
          f.amount,
          f.type,
          f.status,
          f.description,
          f.category,
          f.transfer_pair_id,
          c.name as client_name,
          c.email as client_email,
          c.phone as client_phone,
          c.telegram as client_telegram,
          cd.name as cash_desk_name,
          w.full_name as worker_name,
          w.telegram_username as worker_telegram
        FROM crm.finances f 
        LEFT JOIN crm.clients c ON f.client_id = c.id 
        LEFT JOIN crm.cash_desks cd ON f.cash_desk_id = cd.id
        LEFT JOIN crm.workers w ON f.worker_id = w.id
        WHERE f.status = 'actual' 
          AND f.date >= $1 
          AND f.date <= $2
        ORDER BY f.date DESC, f.created_at DESC
      `;

      const financesResult = await pool.query(financesQuery, [date_from, date_to]);
      const allFinances = financesResult.rows;

      console.log('💾 Получено операций из БД:', allFinances.length);

      // 🔍 ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА: Проверяем все операции
      console.log('🔍 ВСЕ ОПЕРАЦИИ ЗА ПЕРИОД:');
      allFinances.forEach((finance, index) => {
        console.log(`  ${index + 1}. ID:${finance.id} ${finance.type} ${finance.amount} ${finance.cash_desk_name} (${finance.date})`);
      });

      // 🔍 ОТЛАДКА: Проверяем transfer операции
      const transfersInDb = allFinances.filter(f => f.type === 'transfer');
      console.log('🔄 Transfer операций найдено в БД:', transfersInDb.length);
      transfersInDb.forEach(t => {
        console.log('🔄 Transfer в БД:', {
          id: t.id,
          date: t.date,
          amount: t.amount,
          transfer_pair_id: t.transfer_pair_id,
          cash_desk: t.cash_desk_name,
          description: t.description
        });
      });

      // 2. РАЗДЕЛЕНИЕ ОПЕРАЦИЙ НА КАТЕГОРИИ
      const incomeOperations = [];
      const expenseOperations = [];
      const transferOperations = [];
      const processedTransferPairs = new Set();

      allFinances.forEach(finance => {
        console.log(`🔍 Обрабатываем операцию ID:${finance.id} тип:${finance.type} сумма:${finance.amount}`);

        if (finance.type === 'transfer' && finance.transfer_pair_id) {
          console.log(`🔄 Найдена transfer операция ID:${finance.id}, pair_id:${finance.transfer_pair_id}`);

          // Обрабатываем переводы между кассами
          if (!processedTransferPairs.has(finance.id)) {
            console.log(`🔄 Операция ID:${finance.id} не обработана, ищем пару`);

            // ИСПРАВЛЕННАЯ ЛОГИКА: ищем парную операцию
            const pairOperation = allFinances.find(f =>
              f.id === finance.transfer_pair_id &&
              f.transfer_pair_id === finance.id &&
              f.type === 'transfer'
            );

            if (pairOperation) {
              console.log('✅ НАЙДЕНА ПАРА:', {
                op1: { id: finance.id, amount: finance.amount, cash_desk: finance.cash_desk_name },
                op2: { id: pairOperation.id, amount: pairOperation.amount, cash_desk: pairOperation.cash_desk_name }
              });

              // Определяем отправителя (отрицательная сумма) и получателя (положительная сумма)
              const senderOperation = finance.amount < 0 ? finance : pairOperation;
              const receiverOperation = finance.amount > 0 ? finance : pairOperation;

              const transferDetail = {
                date: finance.date,
                amount: Math.abs(finance.amount), // Всегда положительная сумма
                category: finance.category || 'Перевод между касс',
                sender_cash_desk: senderOperation.cash_desk_name || '',
                receiver_cash_desk: receiverOperation.cash_desk_name || '',
                description: finance.description || ''
              };

              transferOperations.push(transferDetail);

              // Отмечаем обе операции как обработанные
              processedTransferPairs.add(finance.id);
              processedTransferPairs.add(pairOperation.id);

              console.log('✅ ДОБАВЛЕН ПЕРЕВОД В ВЫПИСКУ:', transferDetail);
            } else {
              console.log(`❌ ПАРНАЯ ОПЕРАЦИЯ НЕ НАЙДЕНА для ID:${finance.id} pair_id:${finance.transfer_pair_id}`);

              // Дополнительная отладка - проверим что есть в массиве
              console.log('🔍 Доступные операции для поиска:');
              allFinances.forEach(f => {
                if (f.type === 'transfer') {
                  console.log(`  ID:${f.id} pair_id:${f.transfer_pair_id} amount:${f.amount}`);
                }
              });
            }
          } else {
            console.log(`⏭️ Transfer операция ID:${finance.id} уже обработана`);
          }
        } else if (finance.type === 'income') {
          incomeOperations.push(finance);
          console.log(`✅ Добавлен доход: ${finance.amount} (${finance.cash_desk_name})`);
        } else if (finance.type === 'expense') {
          expenseOperations.push(finance);
          console.log(`✅ Добавлен расход: ${finance.amount} (${finance.cash_desk_name})`);
        }
      });

      console.log('📊 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ РАЗДЕЛЕНИЯ:');
      console.log('  Доходы:', incomeOperations.length);
      console.log('  Расходы:', expenseOperations.length);
      console.log('  Переводы:', transferOperations.length);

      // 3. РАСЧЕТ БАЛАНСОВ КАСС НА ОСНОВЕ ОПЕРАЦИЙ В ВЫПИСКЕ
      const cashDeskBalances = {};

      allFinances.forEach(finance => {
        const cashDeskName = finance.cash_desk_name;
        if (cashDeskName) {
          if (!cashDeskBalances[cashDeskName]) {
            cashDeskBalances[cashDeskName] = 0;
          }
          cashDeskBalances[cashDeskName] += Number(finance.amount);
        }
      });

      console.log('💰 Балансы касс рассчитаны:', cashDeskBalances);

      // 4. ФОРМИРОВАНИЕ CSV
      const csvRows = [];

      // Функция для экранирования CSV значений
      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Функция для форматирования даты в формат ДД.ММ.ГГГГ
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
      };

      // Функция для форматирования периода
      const formatPeriod = (dateFrom, dateTo) => {
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);

        const fromFormatted = `${fromDate.getDate().toString().padStart(2, '0')}.${(fromDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const toFormatted = `${toDate.getDate().toString().padStart(2, '0')}.${(toDate.getMonth() + 1).toString().padStart(2, '0')}`;

        return `${fromFormatted}-${toFormatted}`;
      };

      // ЗАГОЛОВОК ВЫПИСКИ
      csvRows.push([`Выписка ${formatPeriod(date_from, date_to)}`, '', '', '', '', '', '', '', '', '']);
      csvRows.push(['', '', '', '', '', '', '', '', '', '']); // Пустая строка

      // СЕКЦИЯ ДОХОДОВ
      csvRows.push(['Доходы', '', '', '', '', '', '', '', '', '']);
      csvRows.push(['Дата', 'Сумма', 'Категория', 'client_name', 'client_telegram', 'client_email', 'worker_name', 'worker_telegram', 'Касса', 'Описание']);

      let totalIncome = 0;
      incomeOperations.forEach(operation => {
        totalIncome += Number(operation.amount);
        csvRows.push([
          formatDate(operation.date),
          operation.amount,
          operation.category || '',
          operation.client_name || '',
          operation.client_telegram || '',
          operation.client_email || '',
          operation.worker_name || '',
          operation.worker_telegram || '',
          operation.cash_desk_name || '',
          operation.description || ''
        ]);
      });

      csvRows.push(['Итого:', totalIncome, '', '', '', '', '', '', '', '']);
      csvRows.push(['', '', '', '', '', '', '', '', '', '']); // Пустая строка
      csvRows.push(['', '', '', '', '', '', '', '', '', '']); // Пустая строка

      // СЕКЦИЯ РАСХОДОВ
      csvRows.push(['Расходы', '', '', '', '', '', '', '', '', '']);
      csvRows.push(['Дата', 'Сумма', 'Категория', 'client_name', 'client_telegram', 'client_email', 'worker_name', 'worker_telegram', 'Касса', 'Описание']);

      let totalExpense = 0;
      expenseOperations.forEach(operation => {
        totalExpense += Number(operation.amount);
        csvRows.push([
          formatDate(operation.date),
          operation.amount,
          operation.category || '',
          operation.client_name || '',
          operation.client_telegram || '',
          operation.client_email || '',
          operation.worker_name || '',
          operation.worker_telegram || '',
          operation.cash_desk_name || '',
          operation.description || ''
        ]);
      });

      csvRows.push(['Итого:', totalExpense, '', '', '', '', '', '', '', '']);
      csvRows.push(['', '', '', '', '', '', '', '', '', '']); // Пустая строка

      // СЕКЦИЯ ПЕРЕВОДОВ МЕЖДУ КАССАМИ
      csvRows.push(['Переводы между касс', '', '', '', '', '', '', '', '', '']);
      csvRows.push(['Дата', 'Сумма', 'Категория', 'Касса отправитель', 'Касса получатель', 'Описание', '', '', '', '']);

      console.log('📋 Добавляем переводы в CSV:', transferOperations.length, 'штук');
      transferOperations.forEach((transfer, index) => {
        console.log(`📋 Перевод ${index + 1}:`, transfer);
        csvRows.push([
          formatDate(transfer.date),
          transfer.amount,
          transfer.category,
          transfer.sender_cash_desk,
          transfer.receiver_cash_desk,
          transfer.description,
          '', '', '', ''
        ]);
      });

      csvRows.push(['', '', '', '', '', '', '', '', '', '']); // Пустая строка

      // СЕКЦИЯ ИТОГОВОГО БАЛАНСА КАСС
      csvRows.push(['Итоговый баланс касс', '', '', '', '', '', '', '', '', '']);
      csvRows.push(['Касса', 'Баланс', '', '', '', '', '', '', '', '']);

      Object.entries(cashDeskBalances)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([cashDeskName, balance]) => {
          csvRows.push([cashDeskName, balance, '', '', '', '', '', '', '', '']);
        });

      // 5. СОЗДАНИЕ CSV КОНТЕНТА
      const csvContent = csvRows
        .map(row => row.map(escapeCsvValue).join(','))
        .join('\n');

      // 6. ФОРМИРОВАНИЕ ИМЕНИ ФАЙЛА
      const filename = `statement_${formatPeriod(date_from, date_to).replace('-', '_')}.csv`;

      // 7. ОТПРАВКА ФАЙЛА
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      console.log(`📋 Выписка сгенерирована успешно: ${incomeOperations.length} доходов, ${expenseOperations.length} расходов, ${transferOperations.length} переводов`);

      res.send(csvContent);

    } catch (error) {
      console.error('❌ Ошибка при генерации выписки:', error);
      throw error;
    }
  })
);

// 🆕 РОУТ ДЛЯ ФИНАНСОВОЙ АНАЛИТИКИ
router.get('/analytics', async (req, res) => {
  try {
    const { period = 30, start_date, end_date } = req.query;
    
    // Валидация периода
    const validPeriods = [7, 14, 30, 60, 90, 180, 365];
    if (!validPeriods.includes(parseInt(period))) {
      return res.status(400).json({ 
        error: 'Неверный период. Допустимые значения: 7, 14, 30, 60, 90, 180, 365' 
      });
    }

    // Определяем даты периода
    let queryStartDate, queryEndDate;
    
    if (start_date && end_date) {
      // Если переданы конкретные даты
      queryStartDate = start_date;
      queryEndDate = end_date;
    } else {
      // Если передан только период
      queryEndDate = new Date().toISOString().split('T')[0]; // Сегодня
      queryStartDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
    }

    // SQL запрос для получения метрик
    const metricsQuery = `
      WITH period_data AS (
        SELECT 
          date,
          amount,
          type,
          category,
          description
        FROM crm.finances 
        WHERE status = 'actual'
          AND type IN ('income', 'expense')
          AND date >= $1
          AND date <= $2
      )
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
        SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as profit,
        CASE 
          WHEN SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) > 0 
          THEN ROUND(
            (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) / 
             SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END))::numeric, 2
          )
          ELSE NULL 
        END as income_expense_ratio,
        CASE 
          WHEN SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) > 0 
          THEN ROUND(
            ((SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
              SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END)) / 
             SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) * 100)::numeric, 2
          )
          ELSE NULL 
        END as profit_margin,
        COUNT(*) as total_operations
      FROM period_data
    `;

    // SQL запрос для получения данных по категориям
    const categoriesQuery = `
      SELECT 
        category,
        type,
        SUM(amount) as total_amount,
        COUNT(*) as operations_count
      FROM crm.finances 
      WHERE status = 'actual'
        AND type IN ('income', 'expense')
        AND date >= $1
        AND date <= $2
      GROUP BY category, type
      ORDER BY category, type
    `;

    // Выполняем запросы
    const [metricsResult, categoriesResult] = await Promise.all([
      pool.query(metricsQuery, [queryStartDate, queryEndDate]),
      pool.query(categoriesQuery, [queryStartDate, queryEndDate])
    ]);

    const metrics = metricsResult.rows[0];
    const categories = categoriesResult.rows;

    // Группируем категории
    const categoriesByType = {
      income: {},
      expense: {}
    };

    categories.forEach(row => {
      if (row.type === 'income') {
        categoriesByType.income[row.category] = {
          amount: parseFloat(row.total_amount),
          operations_count: parseInt(row.operations_count)
        };
      } else {
        categoriesByType.expense[row.category] = {
          amount: parseFloat(row.total_amount),
          operations_count: parseInt(row.operations_count)
        };
      }
    });

    // Формируем ответ
    const response = {
      period: parseInt(period),
      start_date: queryStartDate,
      end_date: queryEndDate,
      metrics: {
        total_income: parseFloat(metrics.total_income || 0),
        total_expense: parseFloat(metrics.total_expense || 0),
        profit: parseFloat(metrics.profit || 0),
        ebitda: parseFloat(metrics.profit || 0), // В вашем случае EBITDA = P&L
        income_expense_ratio: metrics.income_expense_ratio,
        profit_margin: metrics.profit_margin,
        total_operations: parseInt(metrics.total_operations || 0)
      },
      categories: categoriesByType
    };

    res.json(response);

  } catch (error) {
    console.error('Ошибка получения финансовой аналитики:', error);
    res.status(500).json({ error: 'Ошибка получения финансовой аналитики' });
  }
});

// 📈 РОУТ ДЛЯ ПОЛУЧЕНИЯ ИСТОРИИ БАЛАНСА ПО ДНЯМ
router.get('/balance-history', async (req, res) => {
  try {
    const { period = 30, start_date, end_date } = req.query;
    
    // Валидация периода
    const validPeriods = [7, 14, 30, 60, 90, 180, 365];
    if (!validPeriods.includes(parseInt(period))) {
      return res.status(400).json({ 
        error: 'Неверный период. Допустимые значения: 7, 14, 30, 60, 90, 180, 365' 
      });
    }

    // Определяем даты периода
    let queryStartDate, queryEndDate;
    
    if (start_date && end_date) {
      // Если переданы конкретные даты
      queryStartDate = start_date;
      queryEndDate = end_date;
    } else {
      // Если передан только период
      queryEndDate = new Date().toISOString().split('T')[0]; // Сегодня
      queryStartDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
    }

    // SQL запрос для получения истории баланса по дням
    const balanceHistoryQuery = `
      WITH daily_operations AS (
        SELECT 
          date,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as daily_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as daily_expense,
          COUNT(*) as transactions_count
        FROM crm.finances 
        WHERE status = 'actual'
          AND type IN ('income', 'expense')
          AND date >= $1
          AND date <= $2
        GROUP BY date
        ORDER BY date
      ),
      cumulative_balance AS (
        SELECT 
          date,
          daily_income,
          daily_expense,
          transactions_count,
          SUM(daily_income + daily_expense) OVER (ORDER BY date) as cumulative_balance
        FROM daily_operations
      )
      SELECT 
        date,
        daily_income,
        daily_expense,
        transactions_count,
        cumulative_balance,
        (daily_income + daily_expense) as daily_change
      FROM cumulative_balance
      ORDER BY date
    `;

    const result = await pool.query(balanceHistoryQuery, [queryStartDate, queryEndDate]);
    
    // Форматируем данные для фронтенда
    const balanceHistory = result.rows.map(row => ({
      date: row.date,
      balance: parseFloat(row.cumulative_balance || 0),
      daily_change: parseFloat(row.daily_change || 0),
      transactions_count: parseInt(row.transactions_count || 0),
      daily_income: parseFloat(row.daily_income || 0),
      daily_expense: parseFloat(row.daily_expense || 0)
    }));

    // Вычисляем статистику тренда
    let trend = 'stable';
    if (balanceHistory.length >= 2) {
      const firstBalance = balanceHistory[0].balance;
      const lastBalance = balanceHistory[balanceHistory.length - 1].balance;
      const change = lastBalance - firstBalance;
      
      if (change > 0) {
        trend = 'growing';
      } else if (change < 0) {
        trend = 'declining';
      }
    }

    // Вычисляем дополнительные статистики
    const totalIncome = balanceHistory.reduce((sum, day) => sum + day.daily_income, 0);
    const totalExpense = balanceHistory.reduce((sum, day) => sum + Math.abs(day.daily_expense), 0);
    const totalChange = balanceHistory.reduce((sum, day) => sum + day.daily_change, 0);
    const avgDailyChange = balanceHistory.length > 0 ? totalChange / balanceHistory.length : 0;

    const statistics = {
      trend,
      total_income: totalIncome,
      total_expense: totalExpense,
      total_change: totalChange,
      avg_daily_change: avgDailyChange,
      period_start: queryStartDate,
      period_end: queryEndDate,
      days_count: balanceHistory.length
    };

    res.json({
      success: true,
      balance_history: balanceHistory,
      statistics
    });

  } catch (error) {
    console.error('Ошибка получения истории баланса:', error);
    res.status(500).json({ error: 'Ошибка получения истории баланса' });
  }
});

// 📈 ПОЛУЧЕНИЕ ОПЕРАЦИИ ПО ID
router.get('/:id',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        f.*, 
        c.name as client_name, 
        cd.name as cash_desk_name,
        w.full_name as worker_name,
        w.telegram_username as worker_telegram
      FROM crm.finances f 
      LEFT JOIN crm.clients c ON f.client_id = c.id 
      LEFT JOIN crm.cash_desks cd ON f.cash_desk_id = cd.id
      LEFT JOIN crm.workers w ON f.worker_id = w.id
      WHERE f.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Финансовая операция');
    }

    console.log(`💰 Получена операция ID:${id} пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

// 💸 ПОЛУЧЕНИЕ ОПЕРАЦИЙ ПО КЛИЕНТУ
router.get('/client/:clientId',
  validateClientIdParam,
  asyncHandler(async (req, res) => {
    const { clientId } = req.params;

    // Проверяем существование клиента
    const clientCheck = await pool.query(
      'SELECT name FROM crm.clients WHERE id = $1',
      [clientId]
    );

    if (clientCheck.rows.length === 0) {
      throw new NotFoundError('Клиент');
    }

    const result = await pool.query(`
      SELECT 
        f.*, 
        c.name as client_name, 
        cd.name as cash_desk_name,
        w.full_name as worker_name,
        w.telegram_username as worker_telegram
      FROM crm.finances f 
      LEFT JOIN crm.clients c ON f.client_id = c.id 
      LEFT JOIN crm.cash_desks cd ON f.cash_desk_id = cd.id
      LEFT JOIN crm.workers w ON f.worker_id = w.id
      WHERE f.client_id = $1
      ORDER BY f.date DESC, f.created_at DESC
    `, [clientId]);

    console.log(`💸 Получены операции клиента ID:${clientId} пользователем ${req.user.email}`);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  })
);

// 💳 СОЗДАНИЕ TRANSFER ПАРЫ
router.post('/transfer',
  requireRole(['admin', 'manager']),
  validateTransferPair,
  asyncHandler(async (req, res) => {
    console.log('🔄 Создание transfer пары:', req.body);
    return await createTransferPair(req, res);
  })
);

// 💰 СОЗДАНИЕ ОБЫЧНОЙ ФИНАНСОВОЙ ОПЕРАЦИИ
router.post('/',
  requireRole(['admin', 'manager']),
  validateFinance,
  asyncHandler(async (req, res) => {
    console.log('💰 Создание обычной операции:', req.body);
    return await createRegularOperation(req, res);
  })
);

// 🔄 ФУНКЦИЯ СОЗДАНИЯ TRANSFER ПАРЫ
const createTransferPair = async (req, res) => {
  const { amount, description, date, cash_desk_from_id, cash_desk_to_id } = req.body;

  console.log('🔄 Создание transfer пары:', {
    amount, description, cash_desk_from_id, cash_desk_to_id, date
  });

  // Валидация уже применена в middleware

  // Проверяем существование касс
  const fromCashDeskCheck = await pool.query(
    'SELECT id, name FROM crm.cash_desks WHERE id = $1',
    [cash_desk_from_id]
  );

  const toCashDeskCheck = await pool.query(
    'SELECT id, name FROM crm.cash_desks WHERE id = $1',
    [cash_desk_to_id]
  );

  if (fromCashDeskCheck.rows.length === 0) {
    throw new NotFoundError('Касса-отправитель');
  }

  if (toCashDeskCheck.rows.length === 0) {
    throw new NotFoundError('Касса-получатель');
  }

  // Начинаем транзакцию для атомарного создания пары
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Создаем первую операцию (расход с кассы-отправителя)
    const operation1 = await client.query(
      `INSERT INTO crm.finances (
        date, amount, type, status, description, category, 
        cash_desk_id, transfer_pair_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        date,
        -Math.abs(Number(amount)), // Отрицательная сумма для расхода
        'transfer',
        'actual', // Transfer всегда фактические
        `${description || 'Перевод'} (отправка)`,
        'Перевод между кассами',
        cash_desk_from_id,
        null // Пока null, обновим после создания второй операции
      ]
    );

    const operation1Id = operation1.rows[0].id;

    // Создаем вторую операцию (доход на кассу-получателя)
    const operation2 = await client.query(
      `INSERT INTO crm.finances (
        date, amount, type, status, description, category, 
        cash_desk_id, transfer_pair_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        date,
        Math.abs(Number(amount)), // Положительная сумма для дохода
        'transfer',
        'actual',
        `${description || 'Перевод'} (получение)`,
        'Перевод между кассами',
        cash_desk_to_id,
        operation1Id // Ссылка на первую операцию
      ]
    );

    const operation2Id = operation2.rows[0].id;

    // Обновляем первую операцию, добавляем ссылку на вторую
    await client.query(
      'UPDATE crm.finances SET transfer_pair_id = $1 WHERE id = $2',
      [operation2Id, operation1Id]
    );

    await client.query('COMMIT');

    // Получаем созданные операции с именами касс
    const createdOperations = await pool.query(`
      SELECT 
        f.*, 
        cd.name as cash_desk_name
      FROM crm.finances f 
      LEFT JOIN crm.cash_desks cd ON f.cash_desk_id = cd.id
      WHERE f.id IN ($1, $2)
      ORDER BY f.amount ASC -- Сначала расход, потом доход
    `, [operation1Id, operation2Id]);

    console.log(`✅ Transfer пара создана пользователем ${req.user.email}:`, {
      operation1Id,
      operation2Id,
      amount: Math.abs(Number(amount)),
      fromCashDesk: fromCashDeskCheck.rows[0].name,
      toCashDesk: toCashDeskCheck.rows[0].name
    });

    res.status(201).json({
      success: true,
      message: 'Перевод между кассами успешно выполнен',
      data: {
        operations: createdOperations.rows,
        transfer_info: {
          amount: Math.abs(Number(amount)),
          from_cash_desk: fromCashDeskCheck.rows[0].name,
          to_cash_desk: toCashDeskCheck.rows[0].name
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// 💰 ФУНКЦИЯ СОЗДАНИЯ ОБЫЧНОЙ ОПЕРАЦИИ
const createRegularOperation = async (req, res) => {
  // Валидация уже применена в middleware

  const {
    date, amount, type, status, description, category,
    client_id, clientId, email,
    worker_id, workerId, employee,
    cash_desk_id, cashDeskId
  } = req.body;

  // Определяем финальные значения
  let finalClientId = client_id || clientId;
  let finalWorkerId = worker_id || workerId;
  const finalCashDeskId = cash_desk_id || cashDeskId;

  console.log('🔍 DEBUG: Полученные поля:', {
    finalClientId, finalWorkerId, finalCashDeskId, email, employee
  });

  // Поиск клиента по email
  if (!finalClientId && email) {
    const clientSearch = await pool.query(
      'SELECT id FROM crm.clients WHERE email = $1',
      [email.trim()]
    );

    if (clientSearch.rows.length > 0) {
      finalClientId = clientSearch.rows[0].id;
      console.log('✅ Клиент найден по email:', { email, clientId: finalClientId });
    } else {
      throw new NotFoundError(`Клиент с email "${email}"`);
    }
  }

  // Поиск работника по telegram
  if (!finalWorkerId && employee) {
    const cleanTelegram = employee.startsWith('@') ? employee : `@${employee}`;
    const workerSearch = await pool.query(
      'SELECT id FROM crm.workers WHERE telegram_username = $1',
      [cleanTelegram]
    );

    if (workerSearch.rows.length > 0) {
      finalWorkerId = workerSearch.rows[0].id;
      console.log('✅ Работник найден по telegram:', { employee, workerId: finalWorkerId });
    } else {
      throw new NotFoundError(`Работник с Telegram "${employee}"`);
    }
  }

  // Проверяем существование клиента (если указан)
  if (finalClientId) {
    const clientCheck = await pool.query(
      'SELECT id, name FROM crm.clients WHERE id = $1',
      [finalClientId]
    );

    if (clientCheck.rows.length === 0) {
      throw new NotFoundError('Клиент с указанным ID');
    }
  }

  // Проверяем существование работника (если указан)
  if (finalWorkerId) {
    const workerCheck = await pool.query(
      'SELECT id, full_name, telegram_username FROM crm.workers WHERE id = $1',
      [finalWorkerId]
    );

    if (workerCheck.rows.length === 0) {
      throw new NotFoundError('Работник с указанным ID');
    }
  }

  // Проверяем существование кассы
  if (!finalCashDeskId) {
    throw new BusinessLogicError('Касса обязательна для создания операции');
  }

  const cashDeskCheck = await pool.query(
    'SELECT id, name FROM crm.cash_desks WHERE id = $1',
    [finalCashDeskId]
  );

  if (cashDeskCheck.rows.length === 0) {
    throw new NotFoundError('Касса');
  }

  // Обрабатываем сумму в зависимости от типа
  const finalAmount = type === 'expense' ? -Number(amount) : Number(amount);

  // Создаем операцию
  const result = await pool.query(
    `INSERT INTO crm.finances (date, amount, type, status, description, category, client_id, cash_desk_id, worker_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
    [date, finalAmount, type, status, description, category, finalClientId, finalCashDeskId, finalWorkerId]
  );

  // Получаем операцию с именами
  const financeWithNames = await pool.query(`
    SELECT 
      f.*, 
      c.name as client_name, 
      cd.name as cash_desk_name,
      w.full_name as worker_name,
      w.telegram_username as worker_telegram
    FROM crm.finances f 
    LEFT JOIN crm.clients c ON f.client_id = c.id 
    LEFT JOIN crm.cash_desks cd ON f.cash_desk_id = cd.id
    LEFT JOIN crm.workers w ON f.worker_id = w.id
    WHERE f.id = $1
  `, [result.rows[0].id]);

  console.log(`✅ Финансовая операция создана пользователем ${req.user.email}:`, {
    type, amount: finalAmount, status, finalClientId, finalWorkerId, finalCashDeskId
  });

  res.status(201).json({
    success: true,
    message: 'Финансовая операция успешно создана',
    data: financeWithNames.rows[0]
  });
};

// 🔄 ОБНОВЛЕНИЕ ФИНАНСОВОЙ ОПЕРАЦИИ
router.put('/:id',
  validateIdParam,
  validateFinance,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      date, amount, type, status, description, category,
      client_id, cash_desk_id, clientId, cashDeskId
    } = req.body;

    const finalClientId = client_id || clientId;
    const finalCashDeskId = cash_desk_id || cashDeskId;

    // Проверяем существование операции
    const existingOperation = await pool.query(
      'SELECT * FROM crm.finances WHERE id = $1',
      [id]
    );

    if (existingOperation.rows.length === 0) {
      throw new NotFoundError('Финансовая операция');
    }

    // 🚫 ЗАПРЕТ НА РЕДАКТИРОВАНИЕ TRANSFER ОПЕРАЦИЙ
    if (existingOperation.rows[0].type === 'transfer') {
      throw new BusinessLogicError('Редактирование переводов между кассами запрещено');
    }

    // Проверяем существование клиента (если указан)
    if (finalClientId) {
      const clientCheck = await pool.query(
        'SELECT id FROM crm.clients WHERE id = $1',
        [finalClientId]
      );

      if (clientCheck.rows.length === 0) {
        throw new NotFoundError('Клиент');
      }
    }

    // Проверяем существование кассы
    if (!finalCashDeskId) {
      throw new BusinessLogicError('Касса обязательна для операции');
    }

    const cashDeskCheck = await pool.query(
      'SELECT id FROM crm.cash_desks WHERE id = $1',
      [finalCashDeskId]
    );

    if (cashDeskCheck.rows.length === 0) {
      throw new NotFoundError('Касса');
    }

    // Обрабатываем сумму в зависимости от типа
    const finalAmount = type === 'expense' ? -Number(amount) : Number(amount);

    // Обновляем операцию
    const result = await pool.query(
      `UPDATE crm.finances 
       SET date = $2, amount = $3, type = $4, status = $5, description = $6, 
           category = $7, client_id = $8, cash_desk_id = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id, date, finalAmount, type, status, description, category, finalClientId, finalCashDeskId]
    );

    // Получаем обновленную операцию с именами
    const financeWithNames = await pool.query(`
      SELECT 
        f.*, 
        c.name as client_name, 
        cd.name as cash_desk_name,
        w.full_name as worker_name,
        w.telegram_username as worker_telegram
      FROM crm.finances f 
      LEFT JOIN crm.clients c ON f.client_id = c.id 
      LEFT JOIN crm.cash_desks cd ON f.cash_desk_id = cd.id
      LEFT JOIN crm.workers w ON f.worker_id = w.id
      WHERE f.id = $1
    `, [id]);

    console.log(`✅ Финансовая операция обновлена пользователем ${req.user.email}:`, {
      operationId: id, type, amount: finalAmount
    });

    res.json({
      success: true,
      message: 'Финансовая операция успешно обновлена',
      data: financeWithNames.rows[0]
    });
  })
);

// 🗑️ ОБНОВЛЕННОЕ УДАЛЕНИЕ - поддержка удаления transfer пар
router.delete('/:id',
  requireRole(['admin', 'manager']),
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Проверяем существование операции
    const existingOperation = await pool.query(
      'SELECT * FROM crm.finances WHERE id = $1',
      [id]
    );

    if (existingOperation.rows.length === 0) {
      throw new NotFoundError('Финансовая операция');
    }

    const operation = existingOperation.rows[0];

    // 🆕 НОВОЕ: Если это transfer операция, удаляем обе операции из пары
    if (operation.type === 'transfer' && operation.transfer_pair_id) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Удаляем обе операции
        const deleteResult = await client.query(
          'DELETE FROM crm.finances WHERE id IN ($1, $2) RETURNING *',
          [id, operation.transfer_pair_id]
        );

        await client.query('COMMIT');

        console.log(`🗑️ Transfer пара удалена пользователем ${req.user.email}:`, {
          deletedOperations: deleteResult.rows.length,
          amount: Math.abs(operation.amount)
        });

        res.json({
          success: true,
          message: 'Transfer пара успешно удалена',
          data: {
            deleted_operations: deleteResult.rows.length,
            operations: deleteResult.rows
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Обычное удаление для income/expense операций
      const result = await pool.query(
        'DELETE FROM crm.finances WHERE id = $1 RETURNING *',
        [id]
      );

      console.log(`🗑️ Финансовая операция удалена пользователем ${req.user.email}:`, {
        operationId: id, type: result.rows[0].type, amount: result.rows[0].amount
      });

      res.json({
        success: true,
        message: 'Финансовая операция успешно удалена',
        data: result.rows[0]
      });
    }
  })
);

// 📊 ОБНОВЛЕННАЯ СТАТИСТИКА - исключаем transfer из общих метрик
router.get('/summary/stats',
  asyncHandler(async (req, res) => {
    const { date_from, date_to } = req.query;

    // 🆕 ОБНОВЛЕНО: Исключаем transfer операции из статистики
    let query = `
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN status = 'actual' THEN 1 END) as actual_operations,
        COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_operations,
        COALESCE(SUM(CASE WHEN type = 'income' AND status = 'actual' THEN amount ELSE 0 END), 0) as actual_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'actual' THEN amount ELSE 0 END), 0) as actual_expense,
        COALESCE(SUM(CASE WHEN type IN ('income', 'expense') AND status = 'actual' THEN amount ELSE 0 END), 0) as actual_balance,
        COALESCE(SUM(CASE WHEN type = 'income' AND status = 'planned' THEN amount ELSE 0 END), 0) as planned_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'planned' THEN amount ELSE 0 END), 0) as planned_expense,
        COALESCE(SUM(CASE WHEN type IN ('income', 'expense') AND status = 'planned' THEN amount ELSE 0 END), 0) as planned_balance,
        -- 🆕 НОВОЕ: Статистика по transfer операциям
        COUNT(CASE WHEN type = 'transfer' THEN 1 END) as transfer_operations,
        COALESCE(SUM(CASE WHEN type = 'transfer' AND amount > 0 THEN amount ELSE 0 END), 0) as total_transfer_amount
      FROM crm.finances
      WHERE type IN ('income', 'expense', 'transfer')
    `;

    let params = [];
    let whereConditions = ['type IN (\'income\', \'expense\', \'transfer\')'];

    // Добавляем фильтры по датам
    if (date_from) {
      whereConditions.push(`date >= $${params.length + 1}`);
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push(`date <= $${params.length + 1}`);
      params.push(date_to);
    }

    if (whereConditions.length > 0) {
      query = query.replace('WHERE type IN (\'income\', \'expense\', \'transfer\')', `WHERE ${whereConditions.join(' AND ')}`);
    }

    const result = await pool.query(query, params);
    const stats = result.rows[0];

    console.log(`📊 Получена статистика финансов пользователем ${req.user.email}`, {
      filters: { date_from: date_from || null, date_to: date_to || null }
    });

    res.json({
      success: true,
      data: {
        // Основная статистика (без transfer)
        total_operations: parseInt(stats.total_operations) - parseInt(stats.transfer_operations),
        actual_operations: parseInt(stats.actual_operations) - parseInt(stats.transfer_operations),
        planned_operations: parseInt(stats.planned_operations),
        actual_income: parseFloat(stats.actual_income),
        actual_expense: Math.abs(parseFloat(stats.actual_expense)),
        actual_balance: parseFloat(stats.actual_balance),
        planned_income: parseFloat(stats.planned_income),
        planned_expense: Math.abs(parseFloat(stats.planned_expense)),
        planned_balance: parseFloat(stats.planned_balance),

        // 🆕 НОВОЕ: Статистика по переводам
        transfers: {
          total_operations: parseInt(stats.transfer_operations),
          total_amount: parseFloat(stats.total_transfer_amount)
        }
      }
    });
  })
);

module.exports = router;