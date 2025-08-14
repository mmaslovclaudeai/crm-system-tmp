// backend/routes/planerka.js - Полная интеграция с planerka.app
const express = require('express');
const router = express.Router();
const pool = require('../database');

console.log('🎯 Загружается routes/planerka.js - интеграция с planerka.app');

// 🔐 КОНФИГУРАЦИЯ ТОКЕНА ДЛЯ БЕЗОПАСНОСТИ
const PLANERKA_BEARER_TOKEN = process.env.PLANERKA_BEARER_TOKEN || '0e8b2cef-a404-4172-b8bf-48ab2660bf9c';

// 📱 ФУНКЦИЯ НОРМАЛИЗАЦИИ TELEGRAM HANDLE
function normalizeTelegramHandle(telegramValue) {
  if (!telegramValue || typeof telegramValue !== 'string') {
    return null;
  }

  // Убираем пробелы
  let normalized = telegramValue.trim();

  console.log('📱 Нормализация Telegram. Входное значение:', normalized);

  // Обрабатываем разные форматы:

  // 1. Формат "t.me/username" → "@username"
  if (normalized.startsWith('t.me/')) {
    normalized = '@' + normalized.replace('t.me/', '');
    console.log('📱 Формат t.me/ → результат:', normalized);
  }

  // 2. Формат "https://t.me/username" → "@username"
  else if (normalized.includes('t.me/')) {
    const match = normalized.match(/t\.me\/([a-zA-Z0-9_]+)/);
    if (match) {
      normalized = '@' + match[1];
      console.log('📱 Формат URL t.me → результат:', normalized);
    }
  }

  // 3. Формат "username" (без @) → "@username"
  else if (!normalized.startsWith('@') && /^[a-zA-Z0-9_]+$/.test(normalized)) {
    normalized = '@' + normalized;
    console.log('📱 Формат без @ → результат:', normalized);
  }

  // 4. Формат "@username" - уже правильный
  else if (normalized.startsWith('@')) {
    console.log('📱 Формат уже правильный:', normalized);
  }

  // Валидация финального результата
  if (normalized.startsWith('@') && /^@[a-zA-Z0-9_]+$/.test(normalized)) {
    console.log('✅ Telegram нормализован успешно:', normalized);
    return normalized;
  } else {
    console.log('❌ Неверный формат Telegram после нормализации:', normalized);
    return null;
  }
}

// 🛡️ MIDDLEWARE ДЛЯ ПРОВЕРКИ АВТОРИЗАЦИИ
const validatePlanerkaToken = (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    console.log('❌ Отсутствует Authorization заголовок');
    return res.status(401).json({
      success: false,
      error: 'Отсутствует авторизация'
    });
  }

  const token = authHeader.replace('Bearer ', '');

  if (token !== PLANERKA_BEARER_TOKEN) {
    console.log('❌ Неверный токен авторизации:', token);
    return res.status(401).json({
      success: false,
      error: 'Неверный токен авторизации'
    });
  }

  console.log('✅ Токен авторизации проверен успешно');
  next();
};

// 🎯 ОСНОВНОЙ ЭНДПОИНТ ДЛЯ ПОЛУЧЕНИЯ ВЕБХУКОВ ОТ PLANERKA.APP
router.post('/webhook', validatePlanerkaToken, async (req, res) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress;

  console.log('\n' + '='.repeat(80));
  console.log('🎯 PLANERKA WEBHOOK ПОЛУЧЕН!');
  console.log('📅 Время:', timestamp);
  console.log('🌐 IP адрес:', clientIP);
  console.log('='.repeat(80));

  try {
    const webhookData = req.body;

    // 📋 ЛОГИРУЕМ ПОЛУЧЕННЫЕ ДАННЫЕ
    console.log('📦 Тип события:', webhookData.event);
    console.log('📦 UID встречи:', webhookData.uid);
    console.log('📦 Участники:', webhookData.attendees);

    // 🔍 ИЗВЛЕКАЕМ ДАННЫЕ КЛИЕНТА
    if (!webhookData.attendees || webhookData.attendees.length === 0) {
      console.log('❌ Отсутствуют участники встречи');
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют участники встречи'
      });
    }

    const clientData = webhookData.attendees[0]; // Берем первого участника
    const clientEmail = clientData.email;
    const clientName = clientData.name;
    const clientTimeZone = clientData.timeZone;

    // 📱 ИЗВЛЕКАЕМ TELEGRAM ИЗ CUSTOM INPUTS
    let clientTelegram = null;
    if (webhookData.customInputs && Array.isArray(webhookData.customInputs)) {
      const telegramInput = webhookData.customInputs.find(input =>
        input.label && input.label.toLowerCase().includes('телеграм') ||
        input.label && input.label.toLowerCase().includes('telegram')
      );

      if (telegramInput && telegramInput.value) {
        clientTelegram = normalizeTelegramHandle(telegramInput.value);
        console.log('📱 Найден Telegram в customInputs:', telegramInput.value, '→', clientTelegram);
      }
    }

    console.log('👤 Данные клиента из вебхука:');
    console.log('📧 Email:', clientEmail);
    console.log('👤 Имя:', clientName);
    console.log('🌍 Часовой пояс:', clientTimeZone);
    console.log('📱 Telegram:', clientTelegram || 'не указан');

    // 🔍 ПРОВЕРЯЕМ СУЩЕСТВОВАНИЕ КЛИЕНТА В БАЗЕ
    console.log('🔍 Проверяем существование клиента с email:', clientEmail);

    const existingClientResult = await pool.query(
      'SELECT id, name, status FROM crm.clients WHERE email = $1',
      [clientEmail]
    );

    if (existingClientResult.rows.length > 0) {
      // 🔄 КЛИЕНТ СУЩЕСТВУЕТ - ОБНОВЛЯЕМ СТАТУС
      const existingClient = existingClientResult.rows[0];
      console.log('✅ Найден существующий клиент:', existingClient);

      // Обновляем только статус на "MEET" + telegram если есть
      let updateQuery = `UPDATE crm.clients 
                        SET status = 'MEET', updated_at = CURRENT_TIMESTAMP`;
      let updateParams = [existingClient.id];

      // Если есть telegram и он отличается от текущего, обновляем и его
      if (clientTelegram && existingClient.telegram !== clientTelegram) {
        updateQuery += `, telegram = $2`;
        updateParams.push(clientTelegram);
        console.log('📱 Обновляем Telegram:', existingClient.telegram, '→', clientTelegram);
      }

      updateQuery += ` WHERE id = $1 RETURNING *`;

      const updateResult = await pool.query(updateQuery, updateParams);

      const updatedClient = updateResult.rows[0];
      console.log('🔄 Клиент обновлен - установлен статус MEET:', updatedClient);

      // 🔌 WEBSOCKET: Отправляем событие обновления клиента
      if (req.webSocketService) {
        req.webSocketService.addEventToBatch('client_updated', {
          id: updatedClient.id,
          status: updatedClient.status,
          updated_at: updatedClient.updated_at
        });
      }



    } else {
      // ➕ КЛИЕНТ НЕ СУЩЕСТВУЕТ - СОЗДАЕМ НОВОГО
      console.log('➕ Клиент не найден, создаем нового');

      const insertResult = await pool.query(
        `INSERT INTO crm.clients (name, email, telegram, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'MEET', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [clientName, clientEmail, clientTelegram]
      );

      const newClient = insertResult.rows[0];
      console.log('✅ Создан новый клиент со статусом MEET:', newClient);

      // 🔌 WEBSOCKET: Отправляем событие создания клиента
      if (req.webSocketService) {
        req.webSocketService.addEventToBatch('client_created', newClient);
      }


    }

    // 💾 СОХРАНЯЕМ ИСТОРИЮ ВЕБХУКА (опционально)
    try {
      await pool.query(
        `INSERT INTO crm.webhook_history (source, event_type, client_email, webhook_data, processed_at)
         VALUES ('planerka', $1, $2, $3, CURRENT_TIMESTAMP)`,
        [webhookData.event, clientEmail, JSON.stringify(webhookData)]
      );
      console.log('💾 История вебхука сохранена в БД');
    } catch (historyError) {
      console.error('❌ Ошибка сохранения истории вебхука:', historyError);
      // Не прерываем обработку из-за ошибки сохранения истории
    }

    console.log('✅ Обработка вебхука завершена успешно');
    console.log('='.repeat(80) + '\n');

    // 🚀 ВОЗВРАЩАЕМ УСПЕШНЫЙ ОТВЕТ
    res.status(200).json({
      success: true,
      message: 'Вебхук успешно обработан',
      timestamp,
      processed: {
        client_email: clientEmail,
        action: existingClientResult.rows.length > 0 ? 'updated' : 'created',
        status_set: 'MEET'
      }
    });

  } catch (error) {
    console.error('❌ Ошибка обработки вебхука:', error);
    console.log('='.repeat(80) + '\n');

    res.status(500).json({
      success: false,
      error: 'Ошибка обработки вебхука',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



// 📊 ЭНДПОИНТ ДЛЯ ПОЛУЧЕНИЯ СТАТИСТИКИ ВЕБХУКОВ
router.get('/webhook/stats', async (req, res) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        source,
        event_type,
        COUNT(*) as count,
        DATE(processed_at) as date
      FROM crm.webhook_history 
      WHERE source = 'planerka'
      GROUP BY source, event_type, DATE(processed_at)
      ORDER BY processed_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: statsResult.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Ошибка получения статистики вебхуков:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статистики'
    });
  }
});

// 🧪 ТЕСТОВЫЙ ЭНДПОИНТ ДЛЯ СИМУЛЯЦИИ ВЕБХУКА
router.post('/webhook/test', (req, res) => {
  console.log('🧪 ТЕСТОВЫЙ ВЕБХУК ВЫЗВАН');

  const mockPlanerkaData = {
    event: 'BOOKING_CREATED',
    uid: 'test_' + Date.now(),
    title: 'Тестовая встреча',
    startTime: new Date(Date.now() + 3600000).toISOString(), // +1 час
    endTime: new Date(Date.now() + 7200000).toISOString(),   // +2 часа
    attendees: [{
      name: 'Тестовый Клиент',
      email: 'test@example.com',
      timeZone: 'Europe/Moscow'
    }],
    organizer: {
      name: 'Организатор',
      email: 'organizer@example.com',
      timeZone: 'Europe/Moscow'
    },
    customInputs: [{
      label: 'Ваш телеграм',
      value: '@test_user123'
    }]
  };

  console.log('🧪 Тестовые данные:', JSON.stringify(mockPlanerkaData, null, 2));

  res.json({
    success: true,
    message: 'Тестовый вебхук готов к отправке',
    test_data: mockPlanerkaData,
    instruction: 'Отправьте POST запрос на /api/planerka/webhook с этими данными'
  });
});

module.exports = router;