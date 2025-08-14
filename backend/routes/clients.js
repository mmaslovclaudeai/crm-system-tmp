// backend/routes/clients.js - ОБНОВЛЕННЫЙ С ПОДДЕРЖКОЙ WORKER_ID И DATA + ВЕСЬ ОРИГИНАЛЬНЫЙ ФУНКЦИОНАЛ
const express = require('express');
const router = express.Router();
const pool = require('../database');
const { requireRole } = require('../middleware/auth');
const kafkaService = require('../services/kafkaService');
const { traceInfo, traceWarn, traceError, traceDebug } = require('../utils/logger');
const {
  validateClient,
  validateClientUpdate,
  validateDocumentsUpdate,
  validateTelegramUpdate,
  validateCuratorUpdate,
  validateEducationDataUpdate,
  validateSearch,
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
 * /api/clients:
 *   get:
 *     tags: [Clients]
 *     summary: Получение списка клиентов
 *     description: Возвращает список всех клиентов с возможностью фильтрации и поиска
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Строка поиска
 *         schema:
 *           type: string
 *         example: Иван
 *       - name: filter
 *         in: query
 *         description: Поле для поиска
 *         schema:
 *           type: string
 *           enum: [name, email, phone, telegram]
 *           default: name
 *       - name: status_group
 *         in: query
 *         description: Группа статусов для фильтрации
 *         schema:
 *           type: string
 *           enum: [all, leads, clients]
 *           default: all
 *       - name: limit
 *         in: query
 *         description: Количество записей на страницу
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
 *     responses:
 *       200:
 *         description: Список клиентов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientListResponse'
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
 *     tags: [Clients]
 *     summary: Создание нового клиента
 *     description: Создает нового клиента в системе
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientCreateRequest'
 *     responses:
 *       201:
 *         description: Клиент успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientResponse'
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
 *         description: Клиент с таким email/телефоном уже существует
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
 *                   example: Клиент с таким email уже существует
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Получение клиента по ID
 *     description: Возвращает подробную информацию о клиенте
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Информация о клиенте
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientResponse'
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
 *   put:
 *     tags: [Clients]
 *     summary: Обновление клиента
 *     description: Обновляет информацию о клиенте
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientUpdateRequest'
 *     responses:
 *       200:
 *         description: Клиент успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientResponse'
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
 *   delete:
 *     tags: [Clients]
 *     summary: Удаление клиента
 *     description: Удаляет клиента из системы (только для администраторов)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Клиент успешно удален
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
 *                   example: Клиент успешно удален
 *                 deleted_client:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Иван Петров
 *                     email:
 *                       type: string
 *                       example: ivan@example.com
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
 *         description: Клиент не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 *       409:
 *         description: Невозможно удалить из-за связанных записей
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
 *                   example: Невозможно удалить клиента. Найдено связанных финансовых операций
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *
 * /api/clients/{id}/documents:
 *   patch:
 *     tags: [Clients]
 *     summary: Обновление документов клиента
 *     description: Обновляет только документы клиента (паспорт, ИНН, СНИЛС)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentsUpdateRequest'
 *     responses:
 *       200:
 *         description: Документы успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientResponse'
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
 * /api/clients/{id}/telegram:
 *   patch:
 *     tags: [Clients]
 *     summary: Обновление Telegram клиента
 *     description: Обновляет только Telegram handle клиента
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegram
 *             properties:
 *               telegram:
 *                 type: string
 *                 description: Telegram handle клиента
 *                 example: '@ivanov_ivan'
 *     responses:
 *       200:
 *         description: Telegram успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientResponse'
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
 * /api/clients/{id}/curator:
 *   patch:
 *     tags: [Clients]
 *     summary: Обновление куратора клиента
 *     description: Назначает или обновляет куратора клиента
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               curator_name:
 *                 type: string
 *                 description: Имя куратора
 *                 example: Анна Смирнова
 *               curator_telegram:
 *                 type: string
 *                 description: Telegram куратора
 *                 example: '@anna_curator'
 *     responses:
 *       200:
 *         description: Куратор успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientResponse'
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
 * /api/clients/{id}/education:
 *   patch:
 *     tags: [Clients]
 *     summary: Обновление образовательных данных клиента
 *     description: Обновляет информацию об образовании клиента
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EducationUpdateRequest'
 *     responses:
 *       200:
 *         description: Образовательные данные успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientResponse'
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
 */

// 🔔 ИМПОРТ СЕРВИСА УВЕДОМЛЕНИЙ
const notificationService = require('../services/notificationService');

// 🔧 КОНСТАНТЫ ДЛЯ ГРУППИРОВКИ СТАТУСОВ
const LEAD_STATUSES = ['CREATED', 'DISTRIBUTION', 'GIVE_ACCESS'];
const CLIENT_STATUSES = ['IN_PROGRESS', 'SEARCH_OFFER', 'ACCEPT_OFFER', 'PAYING_OFFER', 'FINISH'];

// ===============================
// 🛠️ УТИЛИТЫ ДЛЯ РАБОТЫ С ДОКУМЕНТАМИ
// ===============================

// Функция для безопасного обновления JSON поля documents
const updateDocuments = (existingDocs, newDocs) => {
  const existing = existingDocs || {};
  const updated = { ...existing, ...newDocs };

  // Добавляем метку времени последнего обновления
  updated.updatedAt = new Date().toISOString();

  return updated;
};

// Функция для извлечения информации из JSON документов
const extractDocumentInfo = (documents) => {
  if (!documents || typeof documents !== 'object') {
    return {
      hasInn: false,
      hasPassport: false,
      hasKonturLink: false,
      completeness: 'empty'
    };
  }

  const hasInn = !!documents.inn;
  const hasPassport = !!(documents.passport?.serial && documents.passport?.number);
  const hasKonturLink = !!documents.konturLink;

  let completeness = 'empty';
  if (hasInn && hasPassport && hasKonturLink) {
    completeness = 'complete';
  } else if (hasInn || hasPassport || hasKonturLink) {
    completeness = 'partial';
  }

  return {
    hasInn,
    hasPassport,
    hasKonturLink,
    completeness
  };
};

// 🔧 ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Отправка WebSocket события
const emitClientEvent = (req, eventType, clientData, changes = {}) => {
  try {
    const webSocketService = req.webSocketService;
    if (webSocketService) {
      switch (eventType) {
        case 'created':
          webSocketService.emitClientCreated(clientData);
          break;
        case 'updated':
          webSocketService.emitClientUpdated(clientData, changes);
          break;
        case 'deleted':
          webSocketService.emitClientDeleted(clientData.id, clientData);
          break;
        default:
          console.warn('Неизвестный тип события для клиента:', eventType);
      }
    }
  } catch (error) {
    console.error('Ошибка отправки WebSocket события:', error);
    // Не прерываем выполнение, если WebSocket недоступен
  }
};

// ===============================
// 📊 ПОЛУЧЕНИЕ СПИСКА КЛИЕНТОВ
// ===============================

// GET /api/clients - Получение списка клиентов/лидов с фильтрацией
router.get('/',
  validateSearch,
  asyncHandler(async (req, res) => {
    const {
      search = '',
      filter = 'name',
      status_group = 'all',
      limit = 50,
      offset = 0
    } = req.query;

    traceDebug(req, 'Поиск клиентов с параметрами', {
      action: 'clients_search',
      search, filter, status_group, limit, offset
    });

    // Построение WHERE условия
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Фильтрация по группам статусов
    if (status_group && status_group !== 'all') {
      if (status_group === 'leads') {
        whereConditions.push(`c.status = ANY($${paramIndex})`);
        queryParams.push(LEAD_STATUSES);
        paramIndex++;
      } else if (status_group === 'clients') {
        whereConditions.push(`c.status = ANY($${paramIndex})`);
        queryParams.push(CLIENT_STATUSES);
        paramIndex++;
      }
    }

    // Поиск по полям
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;

      switch (filter) {
        case 'name':
          whereConditions.push(`LOWER(c.name) LIKE $${paramIndex}`);
          queryParams.push(searchTerm);
          paramIndex++;
          break;
        case 'email':
          whereConditions.push(`LOWER(c.email) LIKE $${paramIndex}`);
          queryParams.push(searchTerm);
          paramIndex++;
          break;
        case 'phone':
          whereConditions.push(`c.phone LIKE $${paramIndex}`);
          queryParams.push(searchTerm);
          paramIndex++;
          break;
        case 'telegram':
          whereConditions.push(`LOWER(c.telegram) LIKE $${paramIndex}`);
          queryParams.push(searchTerm);
          paramIndex++;
          break;
        case 'all':
          whereConditions.push(`(
            LOWER(c.name) LIKE $${paramIndex} OR 
            LOWER(c.email) LIKE $${paramIndex + 1} OR 
            c.phone LIKE $${paramIndex + 2} OR 
            LOWER(c.telegram) LIKE $${paramIndex + 3}
          )`);
          queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
          paramIndex += 4;
          break;
      }
    }

    // Добавляем LIMIT и OFFSET
    queryParams.push(limit, offset);
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    // 🆕 ОБНОВЛЕННЫЙ ЗАПРОС С НОВЫМИ ПОЛЯМИ И JOIN С WORKERS
    const whereClause = whereConditions.length > 0 ?
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.telegram,
        c.status,
        c.documents,
        c.worker_id,
        c.data,
        c.created_at,
        c.updated_at,
        w.full_name as curator_name,
        w.position as curator_position
      FROM crm.clients c
      LEFT JOIN crm.workers w ON c.worker_id = w.id 
      ${whereClause}
      ORDER BY c.created_at DESC 
      ${limitClause}
    `;

    traceDebug(req, 'Выполняемый SQL запрос', {
      action: 'database_query',
      query: query,
      params: queryParams
    });

    const result = await pool.query(query, queryParams);

    // Обогащаем данные информацией о документах
    const clients = result.rows.map(client => ({
      ...client,
      document_info: extractDocumentInfo(client.documents),
      // 🆕 ДОБАВЛЯЕМ ИНФОРМАЦИЮ О КУРАТОРЕ
      curator: client.worker_id ? {
        id: client.worker_id,
        name: client.curator_name,
        position: client.curator_position
      } : null
    }));

    traceInfo(req, `Найдено клиентов: ${clients.length}`, {
      action: 'clients_search',
      result: 'success',
      count: clients.length
    });

    res.json({
      success: true,
      data: clients,
      meta: {
        total: clients.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        search,
        filter,
        status_group
      }
    });
  })
);



// ===============================
// 👤 ПОЛУЧЕНИЕ КЛИЕНТА ПО ID
// ===============================

// GET /api/clients/:id - Получение клиента по ID
router.get('/:id',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 🆕 ОБНОВЛЕННЫЙ ЗАПРОС С НОВЫМИ ПОЛЯМИ
    const result = await pool.query(
      `SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.telegram,
        c.status,
        c.documents,
        c.worker_id,
        c.data,
        c.created_at,
        c.updated_at,
        w.full_name as curator_name,
        w.position as curator_position
      FROM crm.clients c
      LEFT JOIN crm.workers w ON c.worker_id = w.id
      WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Клиент не найден');
    }

    const client = result.rows[0];
    client.document_info = extractDocumentInfo(client.documents);

    // 🆕 ДОБАВЛЯЕМ ИНФОРМАЦИЮ О КУРАТОРЕ
    client.curator = client.worker_id ? {
      id: client.worker_id,
      name: client.curator_name,
      position: client.curator_position
    } : null;

    res.json({
      success: true,
      data: client
    });
  })
);

// ===============================
// ➕ СОЗДАНИЕ КЛИЕНТА
// ===============================

// POST /api/clients - Создание нового клиента
router.post('/',
  requireRole(['admin', 'manager']),
  validateClient,
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      phone,
      telegram,
      status = 'CREATED',
      worker_id,     // 🆕 НОВОЕ ПОЛЕ
      data = {}      // 🆕 НОВОЕ ПОЛЕ
    } = req.body;

    traceInfo(req, 'Создание клиента', {
      action: 'client_create',
      data: req.body
    });

    // 🆕 ПРОВЕРЯЕМ СУЩЕСТВОВАНИЕ КУРАТОРА (ЕСЛИ УКАЗАН)
    if (worker_id) {
      const workerCheck = await pool.query(
        'SELECT id, full_name FROM crm.workers WHERE id = $1 AND is_active = true',
        [worker_id]
      );

      if (workerCheck.rows.length === 0) {
        throw new BusinessLogicError('Указанный куратор не найден или неактивен');
      }
    }

    // Проверяем уникальность email
    const existingClient = await pool.query(
      'SELECT id, name FROM crm.clients WHERE email = $1',
      [email]
    );

    if (existingClient.rows.length > 0) {
      throw new BusinessLogicError('Клиент с таким email уже существует');
    }

    // 🆕 ОБНОВЛЕННЫЙ INSERT С НОВЫМИ ПОЛЯМИ
    const result = await pool.query(
      `INSERT INTO crm.clients (name, email, phone, telegram, status, worker_id, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, email, phone, telegram, status, worker_id, JSON.stringify(data)]
    );

    const newClient = result.rows[0];

    // 🆕 ПОЛУЧАЕМ ИНФОРМАЦИЮ О КУРАТОРЕ ДЛЯ ОТВЕТА
    if (newClient.worker_id) {
      const curatorResult = await pool.query(
        'SELECT full_name, position FROM crm.workers WHERE id = $1',
        [newClient.worker_id]
      );

      if (curatorResult.rows.length > 0) {
        newClient.curator = {
          id: newClient.worker_id,
          name: curatorResult.rows[0].full_name,
          position: curatorResult.rows[0].position
        };
      }
    }

    newClient.document_info = extractDocumentInfo(newClient.documents);

    traceInfo(req, `Создан клиент: ${newClient.name}`, {
      action: 'client_create',
      result: 'success',
      clientId: newClient.id,
      clientName: newClient.name
    });

    // 🔌 WEBSOCKET: Отправляем событие создания клиента
    emitClientEvent(req, 'created', newClient);

    // 📤 KAFKA: Отправляем сообщение о создании клиента
    try {
      await kafkaService.sendClientCreatedMessage(newClient);
    } catch (error) {
      traceError(req, 'Ошибка отправки сообщения в Kafka', {
        action: 'kafka_message',
        error: error.message,
        clientId: newClient.id
      });
      // Не прерываем выполнение, если Kafka недоступна
    }

    res.status(201).json({
      success: true,
      data: newClient,
      message: 'Клиент успешно создан'
    });
  })
);

// ===============================
// 🔄 ОБНОВЛЕНИЕ КЛИЕНТА
// ===============================

// PUT /api/clients/:id - Обновление клиента
router.put('/:id',
  requireRole(['admin', 'manager']),
  validateIdParam,
  validateClientUpdate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    traceInfo(req, 'Обновление клиента', {
      action: 'client_update',
      clientId: id,
      updateData: updateData
    });

    // Получаем текущие данные клиента
    const currentResult = await pool.query(
      'SELECT * FROM crm.clients WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      throw new NotFoundError('Клиент не найден');
    }

    const currentClient = currentResult.rows[0];

    // Проверяем уникальность email если он изменился
    if (updateData.email && updateData.email !== currentClient.email) {
      const existingClient = await pool.query(
        'SELECT id FROM crm.clients WHERE email = $1 AND id != $2',
        [updateData.email, id]
      );

      if (existingClient.rows.length > 0) {
        throw new BusinessLogicError('Клиент с таким email уже существует');
      }
    }

    // 🆕 ПРОВЕРЯЕМ СУЩЕСТВОВАНИЕ КУРАТОРА (ЕСЛИ УКАЗАН)
    if (updateData.worker_id) {
      const workerCheck = await pool.query(
        'SELECT id, full_name FROM crm.workers WHERE id = $1 AND is_active = true',
        [updateData.worker_id]
      );

      if (workerCheck.rows.length === 0) {
        throw new BusinessLogicError('Указанный куратор не найден или неактивен');
      }
    }

    // Подготавливаем данные для обновления
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    // Отслеживаем изменения для WebSocket события
    const changes = {};

    // Простые поля (включая новые)
    const simpleFields = ['name', 'email', 'phone', 'telegram', 'status', 'worker_id'];
    simpleFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        fieldsToUpdate.push(`${field} = $${paramIndex}`);
        values.push(updateData[field]);

        // Записываем изменение
        if (currentClient[field] !== updateData[field]) {
          changes[field] = {
            from: currentClient[field],
            to: updateData[field]
          };
        }

        paramIndex++;
      }
    });

    // 🆕 ОБРАБОТКА JSON ПОЛЯ DATA
    if (updateData.data !== undefined) {
      fieldsToUpdate.push(`data = $${paramIndex}`);
      values.push(JSON.stringify(updateData.data || {}));

      // Записываем изменение
      if (JSON.stringify(currentClient.data) !== JSON.stringify(updateData.data)) {
        changes.data = {
          from: currentClient.data,
          to: updateData.data
        };
      }

      paramIndex++;
    }

    // Обработка документов
    if (updateData.documents) {
      const updatedDocuments = updateDocuments(currentClient.documents, updateData.documents);
      fieldsToUpdate.push(`documents = $${paramIndex}`);
      values.push(JSON.stringify(updatedDocuments));

      changes.documents = {
        from: currentClient.documents,
        to: updatedDocuments
      };

      paramIndex++;
    }

    // Добавляем updated_at
    fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);

    if (fieldsToUpdate.length === 1) { // Только updated_at
      throw new BusinessLogicError('Нет данных для обновления');
    }

    // Добавляем ID в конец
    values.push(id);

    // Выполняем обновление
    const query = `
      UPDATE crm.clients 
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const updatedClient = result.rows[0];

    // 🆕 ПОЛУЧАЕМ ИНФОРМАЦИЮ О КУРАТОРЕ ДЛЯ ОТВЕТА
    if (updatedClient.worker_id) {
      const curatorResult = await pool.query(
        'SELECT full_name, position FROM crm.workers WHERE id = $1',
        [updatedClient.worker_id]
      );

      if (curatorResult.rows.length > 0) {
        updatedClient.curator = {
          id: updatedClient.worker_id,
          name: curatorResult.rows[0].full_name,
          position: curatorResult.rows[0].position
        };
      }
    }

    updatedClient.document_info = extractDocumentInfo(updatedClient.documents);

    console.log('✅ Клиент обновлен:', updatedClient.id);

    // 🔌 WEBSOCKET: Отправляем событие обновления клиента
    emitClientEvent(req, 'updated', updatedClient, changes);

    // 📤 KAFKA: Отправляем сообщение об изменении статуса клиента
    if (changes.status) {
      try {
        await kafkaService.sendClientStatusMessage(updatedClient, currentClient.status);
      } catch (error) {
        console.error('❌ Ошибка отправки сообщения в Kafka:', error);
        // Не прерываем выполнение, если Kafka недоступна
      }
    }

    res.json({
      success: true,
      data: updatedClient,
      message: 'Клиент успешно обновлен',
      changes: Object.keys(changes).length > 0 ? changes : undefined
    });
  })
);

// ===============================
// 🗑️ УДАЛЕНИЕ КЛИЕНТА
// ===============================

// DELETE /api/clients/:id - Удаление клиента
router.delete('/:id',
  requireRole(['admin']),
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    console.log('🗑️ Удаление клиента:', id);

    // Получаем данные клиента перед удалением
    const clientResult = await pool.query(
      'SELECT * FROM crm.clients WHERE id = $1',
      [id]
    );

    if (clientResult.rows.length === 0) {
      throw new NotFoundError('Клиент не найден');
    }

    const clientToDelete = clientResult.rows[0];

    // Проверяем связанные записи в финансах
    const financeResult = await pool.query(
      'SELECT COUNT(*) as count FROM crm.finances WHERE client_id = $1',
      [id]
    );

    const financeCount = parseInt(financeResult.rows[0].count);

    if (financeCount > 0) {
      throw new BusinessLogicError(
        `Невозможно удалить клиента. Найдено связанных финансовых операций: ${financeCount}. ` +
        'Сначала удалите или переназначите все операции.'
      );
    }

    // Удаляем клиента
    await pool.query('DELETE FROM crm.clients WHERE id = $1', [id]);

    console.log('✅ Клиент удален:', id);

    // 🔌 WEBSOCKET: Отправляем событие удаления клиента
    emitClientEvent(req, 'deleted', clientToDelete);



    res.json({
      success: true,
      message: 'Клиент успешно удален',
      deleted_client: {
        id: clientToDelete.id,
        name: clientToDelete.name,
        email: clientToDelete.email
      }
    });
  })
);

// ===============================
// 📄 СПЕЦИАЛЬНЫЕ ЭНДПОИНТЫ
// ===============================

// PATCH /api/clients/:id/documents - Обновление только документов
router.patch('/:id/documents',
  requireRole(['admin', 'manager']),
  validateIdParam,
  validateDocumentsUpdate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { documents } = req.body;

    // Получаем текущие документы
    const currentResult = await pool.query(
      'SELECT documents FROM crm.clients WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      throw new NotFoundError('Клиент не найден');
    }

    const currentDocuments = currentResult.rows[0].documents || {};
    const updatedDocuments = updateDocuments(currentDocuments, documents);

    // Обновляем документы
    const result = await pool.query(
      `UPDATE crm.clients 
       SET documents = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(updatedDocuments), id]
    );

    const updatedClient = result.rows[0];
    updatedClient.document_info = extractDocumentInfo(updatedClient.documents);

    // 🔌 WEBSOCKET: Отправляем событие обновления документов
    emitClientEvent(req, 'updated', updatedClient, {
      documents: {
        from: currentDocuments,
        to: updatedDocuments
      }
    });

    res.json({
      success: true,
      data: updatedClient,
      message: 'Документы клиента успешно обновлены'
    });
  })
);

// PATCH /api/clients/:id/telegram - Обновление только Telegram
router.patch('/:id/telegram',
  requireRole(['admin', 'manager']),
  validateIdParam,
  validateTelegramUpdate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { telegram } = req.body;

    const result = await pool.query(
      `UPDATE crm.clients 
       SET telegram = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [telegram, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Клиент не найден');
    }

    const updatedClient = result.rows[0];
    updatedClient.document_info = extractDocumentInfo(updatedClient.documents);

    // 🔌 WEBSOCKET: Отправляем событие обновления Telegram
    emitClientEvent(req, 'updated', updatedClient, {
      telegram: {
        to: telegram
      }
    });

    res.json({
      success: true,
      data: updatedClient,
      message: 'Telegram клиента успешно обновлен'
    });
  })
);

// ===============================
// 🆕 НОВЫЕ ЭНДПОИНТЫ ДЛЯ РАБОТЫ С КУРАТОРОМ
// ===============================

// GET /api/clients/:id/curator - Получение куратора клиента
router.get('/:id/curator',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        w.id,
        w.full_name,
        w.position,
        w.telegram_username,
        w.phone
      FROM crm.clients c
      LEFT JOIN crm.workers w ON c.worker_id = w.id
      WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Клиент не найден');
    }

    const curator = result.rows[0].id ? result.rows[0] : null;

    res.json({
      success: true,
      data: curator
    });
  })
);

// PATCH /api/clients/:id/curator - Обновление куратора клиента
router.patch('/:id/curator',
  requireRole(['admin', 'manager']),
  validateIdParam,
  validateCuratorUpdate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { worker_id } = req.body;

    console.log('🔄 Обновление куратора клиента ID:', id, 'новый куратор:', worker_id);

    // Проверяем существование клиента
    const clientCheck = await pool.query(
      'SELECT id FROM crm.clients WHERE id = $1',
      [id]
    );

    if (clientCheck.rows.length === 0) {
      throw new NotFoundError('Клиент не найден');
    }

    // Проверяем существование куратора (если указан)
    if (worker_id) {
      const workerCheck = await pool.query(
        'SELECT id, full_name FROM crm.workers WHERE id = $1 AND is_active = true',
        [worker_id]
      );

      if (workerCheck.rows.length === 0) {
        throw new BusinessLogicError('Указанный куратор не найден или неактивен');
      }
    }

    // Обновляем куратора
    await pool.query(
      'UPDATE crm.clients SET worker_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [worker_id, id]
    );

    // Получаем обновленную информацию о кураторе
    const result = await pool.query(
      `SELECT 
        w.id,
        w.full_name,
        w.position,
        w.telegram_username,
        w.phone
      FROM crm.clients c
      LEFT JOIN crm.workers w ON c.worker_id = w.id
      WHERE c.id = $1`,
      [id]
    );

    const curator = result.rows[0].id ? result.rows[0] : null;

    console.log(`✅ Обновлен куратор для клиента ID: ${id}`);

    res.json({
      success: true,
      data: curator,
      message: 'Куратор успешно обновлен'
    });
  })
);

// PATCH /api/clients/:id/data - Обновление данных обучения
router.patch('/:id/data',
  requireRole(['admin', 'manager']),
  validateIdParam,
  validateEducationDataUpdate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data } = req.body;

    console.log('🔄 Обновление данных обучения клиента ID:', id, 'новые данные:', data);

    // Валидация данных обучения
    if (data && typeof data === 'object') {
      // Проверка направления (только QA или AQA)
      if (data.direction && !['QA', 'AQA'].includes(data.direction)) {
        throw new BusinessLogicError('direction может быть только QA или AQA');
      }

      // Проверка формата дат
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (data.start_date && !dateRegex.test(data.start_date)) {
        throw new BusinessLogicError('start_date должна быть в формате YYYY-MM-DD');
      }
      if (data.end_date && !dateRegex.test(data.end_date)) {
        throw new BusinessLogicError('end_date должна быть в формате YYYY-MM-DD');
      }
    }

    // Проверяем существование клиента
    const clientCheck = await pool.query(
      'SELECT id, data FROM crm.clients WHERE id = $1',
      [id]
    );

    if (clientCheck.rows.length === 0) {
      throw new NotFoundError('Клиент не найден');
    }

    const currentData = clientCheck.rows[0].data || {};
    const updatedData = { ...currentData, ...data };

    // Обновляем данные обучения
    const result = await pool.query(
      `UPDATE crm.clients 
       SET data = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(updatedData), id]
    );

    const updatedClient = result.rows[0];
    updatedClient.document_info = extractDocumentInfo(updatedClient.documents);

    // Получаем информацию о кураторе
    if (updatedClient.worker_id) {
      const curatorResult = await pool.query(
        'SELECT full_name, position FROM crm.workers WHERE id = $1',
        [updatedClient.worker_id]
      );

      if (curatorResult.rows.length > 0) {
        updatedClient.curator = {
          id: updatedClient.worker_id,
          name: curatorResult.rows[0].full_name,
          position: curatorResult.rows[0].position
        };
      }
    }

    console.log(`✅ Обновлены данные обучения для клиента ID: ${id}`);

    // 🔌 WEBSOCKET: Отправляем событие обновления данных
    emitClientEvent(req, 'updated', updatedClient, {
      data: {
        from: currentData,
        to: updatedData
      }
    });

    res.json({
      success: true,
      data: updatedClient,
      message: 'Данные обучения успешно обновлены'
    });
  })
);

module.exports = router;