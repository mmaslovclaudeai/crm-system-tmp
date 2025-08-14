// backend/routes/clientNotes.js - API endpoints для заметок клиентов
const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  asyncHandler,
  NotFoundError,
  BusinessLogicError,
  ValidationError
} = require('../middleware/errorHandler');

// Валидация данных заметки
const validateNoteData = (req, res, next) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Содержимое заметки обязательно для заполнения'
    });
  }

  if (content.length > 10000) {
    return res.status(400).json({
      success: false,
      error: 'Содержимое заметки не может превышать 10000 символов'
    });
  }

  next();
};

// Валидация ID параметров
const validateIdParam = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      error: `Некорректный ${paramName}`
    });
  }
  next();
};

// Проверка существования клиента
const checkClientExists = asyncHandler(async (req, res, next) => {
  const clientId = req.params.client_id || req.params.clientId;

  const result = await pool.query(
    'SELECT id FROM crm.clients WHERE id = $1',
    [clientId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Клиент не найден');
  }

  req.clientId = clientId;
  next();
});

// Проверка прав доступа к заметке
const checkNoteAccess = asyncHandler(async (req, res, next) => {
  const noteId = req.params.id || req.params.note_id;
  const userId = req.user.id;
  const userRole = req.user.role;

  const result = await pool.query(
    `SELECT id, author_id, client_id 
     FROM crm.client_notes 
     WHERE id = $1`,
    [noteId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Заметка не найдена');
  }

  const note = result.rows[0];

  // Админы могут редактировать любые заметки, остальные только свои
  if (userRole !== 'admin' && note.author_id !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Недостаточно прав для выполнения операции'
    });
  }

  req.note = note;
  next();
});

// ===============================
// 📝 ПОЛУЧЕНИЕ ЗАМЕТОК КЛИЕНТА
// ===============================

// GET /api/clients/:client_id/notes - Получить все заметки клиента
router.get('/:client_id/notes',
  authenticateToken,
  validateIdParam('client_id'),
  checkClientExists,
  asyncHandler(async (req, res) => {
    const clientId = req.clientId;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        cn.id,
        cn.content,
        cn.author_id,
        cn.created_at,
        cn.updated_at,
        u.name as author_name,
        u.email as author_email
       FROM crm.client_notes cn
       LEFT JOIN crm.users u ON cn.author_id = u.id
       WHERE cn.client_id = $1
       ORDER BY cn.created_at DESC
       LIMIT $2 OFFSET $3`,
      [clientId, parseInt(limit), parseInt(offset)]
    );

    const notes = result.rows.map(note => ({
      id: note.id,
      content: note.content,
      author_id: note.author_id,
      author_name: note.author_name || 'Удаленный пользователь',
      created_at: note.created_at,
      updated_at: note.updated_at
    }));

    res.json({
      success: true,
      data: notes,
      meta: {
        total: notes.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        client_id: clientId
      }
    });
  })
);

// ===============================
// ➕ СОЗДАНИЕ ЗАМЕТКИ
// ===============================

// POST /api/clients/:client_id/notes - Создать заметку клиента
router.post('/:client_id/notes',
  authenticateToken,
  validateIdParam('client_id'),
  validateNoteData,
  checkClientExists,
  asyncHandler(async (req, res) => {
    const clientId = req.clientId;
    const authorId = req.user.id;
    const { content } = req.body;

    const result = await pool.query(
      `INSERT INTO crm.client_notes (client_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING 
        id,
        content,
        author_id,
        client_id,
        created_at,
        updated_at`,
      [clientId, authorId, content.trim()]
    );

    const note = result.rows[0];

    // Добавляем информацию об авторе
    const authorResult = await pool.query(
      'SELECT name, email FROM crm.users WHERE id = $1',
      [authorId]
    );

    const noteWithAuthor = {
      ...note,
      author_name: authorResult.rows[0]?.name || 'Неизвестный автор'
    };

    // TODO: Отправить WebSocket событие о новой заметке
    // if (req.webSocketService) {
    //   req.webSocketService.emitNoteCreated(noteWithAuthor);
    // }

    res.status(201).json({
      success: true,
      data: noteWithAuthor,
      message: 'Заметка успешно создана'
    });
  })
);

// ===============================
// ✏️ РЕДАКТИРОВАНИЕ ЗАМЕТКИ
// ===============================

// PUT /api/notes/:id - Обновить заметку
router.put('/:id',
  authenticateToken,
  validateIdParam('id'),
  validateNoteData,
  checkNoteAccess,
  asyncHandler(async (req, res) => {
    const noteId = req.params.id;
    const { content } = req.body;

    const result = await pool.query(
      `UPDATE crm.client_notes 
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING 
        id,
        content,
        author_id,
        client_id,
        created_at,
        updated_at`,
      [content.trim(), noteId]
    );

    const note = result.rows[0];

    // Добавляем информацию об авторе
    const authorResult = await pool.query(
      'SELECT name, email FROM crm.users WHERE id = $1',
      [note.author_id]
    );

    const noteWithAuthor = {
      ...note,
      author_name: authorResult.rows[0]?.name || 'Неизвестный автор'
    };

    // TODO: Отправить WebSocket событие об обновлении заметки
    // if (req.webSocketService) {
    //   req.webSocketService.emitNoteUpdated(noteWithAuthor);
    // }

    res.json({
      success: true,
      data: noteWithAuthor,
      message: 'Заметка успешно обновлена'
    });
  })
);

// ===============================
// 🗑️ УДАЛЕНИЕ ЗАМЕТКИ
// ===============================

// DELETE /api/notes/:id - Удалить заметку
router.delete('/:id',
  authenticateToken,
  validateIdParam('id'),
  checkNoteAccess,
  asyncHandler(async (req, res) => {
    const noteId = req.params.id;
    const note = req.note;

    await pool.query(
      'DELETE FROM crm.client_notes WHERE id = $1',
      [noteId]
    );

    // TODO: Отправить WebSocket событие об удалении заметки
    // if (req.webSocketService) {
    //   req.webSocketService.emitNoteDeleted(noteId, note);
    // }

    res.json({
      success: true,
      message: 'Заметка успешно удалена',
      data: { id: noteId }
    });
  })
);

// ===============================
// 📊 СТАТИСТИКА ЗАМЕТОК
// ===============================

// GET /api/clients/:client_id/notes/stats - Статистика заметок клиента
router.get('/:client_id/notes/stats',
  authenticateToken,
  validateIdParam('client_id'),
  checkClientExists,
  asyncHandler(async (req, res) => {
    const clientId = req.clientId;

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_notes,
        COUNT(DISTINCT author_id) as unique_authors,
        MIN(created_at) as first_note_date,
        MAX(updated_at) as last_activity_date
       FROM crm.client_notes
       WHERE client_id = $1`,
      [clientId]
    );

    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        total_notes: parseInt(stats.total_notes) || 0,
        unique_authors: parseInt(stats.unique_authors) || 0,
        first_note_date: stats.first_note_date,
        last_activity_date: stats.last_activity_date,
        client_id: clientId
      }
    });
  })
);

module.exports = router;