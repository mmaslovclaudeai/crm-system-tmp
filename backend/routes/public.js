// backend/routes/public.js
const express = require('express');
const router = express.Router();
const pool = require('../database');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');



// 🛡️ Rate limiting для защиты от спама
const leadSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 заявок с одного IP за 15 минут
  message: {
    error: 'Слишком много заявок с вашего IP. Попробуйте позже.',
    details: 'Максимум 5 заявок за 15 минут'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 📋 Схема валидации для заявки
const leadSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .pattern(/^[a-zA-Zа-яА-ЯёЁ\s\-\.]+$/)
    .required()
    .messages({
      'string.min': 'Имя должно содержать минимум 2 символа',
      'string.max': 'Имя не должно превышать 255 символов',
      'string.pattern.base': 'Имя может содержать только буквы, пробелы, дефисы и точки',
      'any.required': 'Имя обязательно для заполнения'
    }),

  phone: Joi.string()
    .pattern(/^7\d{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Телефон должен быть в формате 71234567890',
      'any.required': 'Телефон обязателен для заполнения'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Неверный формат email',
      'any.required': 'Email обязателен для заполнения'
    }),



  source: Joi.string()
    .max(50)
    .optional()
    .default('crm-form'),

  // Honeypot поле для защиты от ботов
  website: Joi.string()
    .max(0)
    .optional()
    .messages({
      'string.max': 'Подозрение на спам'
    })
});

// 🛠️ Утилиты для обработки данных

// Нормализация телефона
const normalizePhone = (phone) => {
  if (!phone) return null;

  // Убираем все кроме цифр
  const cleaned = phone.replace(/\D/g, '');

  // Если начинается с 8, заменяем на 7
  const normalized = cleaned.startsWith('8') ? '7' + cleaned.slice(1) : cleaned;

  // Если не начинается с 7, добавляем 7
  const withCountryCode = normalized.startsWith('7') ? normalized : '7' + normalized;

  // Обрезаем до 11 цифр
  return withCountryCode.slice(0, 11);
};



// Простая проверка на спам
const isSpamLike = (data) => {
  const spamPatterns = [
    /casino/i,
    /viagra/i,
    /loan/i,
    /money/i,
    /crypto/i,
    /bitcoin/i,
    /forex/i,
    /investment/i
  ];

  const textToCheck = `${data.name} ${data.email}`.toLowerCase();
  return spamPatterns.some(pattern => pattern.test(textToCheck));
};



// 📝 Создание новой заявки
router.post('/leads', leadSubmissionLimiter, async (req, res) => {
  try {
    console.log('📥 Получена заявка:', req.body);

    // Валидация данных
    const { error, value } = leadSchema.validate(req.body, {
      stripUnknown: true,
      abortEarly: false
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      console.log('❌ Ошибки валидации:', validationErrors);

      return res.status(400).json({
        error: 'Ошибки валидации',
        details: validationErrors
      });
    }

    // Нормализуем данные
    const normalizedData = {
      name: value.name.trim(),
      email: value.email.trim().toLowerCase(),
      phone: normalizePhone(value.phone),
      source: value.source || 'crm-form'
    };

    console.log('🔄 Нормализованные данные:', normalizedData);

    // Проверка на спам
    if (isSpamLike(normalizedData) || value.website) {
      console.log('🚫 Заявка отклонена как спам');
      return res.status(429).json({
        error: 'Заявка отклонена системой защиты от спама'
      });
    }

    // Проверяем дубликаты по email или телефону
    const duplicateCheck = await pool.query(`
      SELECT id, email, phone, created_at 
      FROM crm.clients 
      WHERE email = $1 OR phone = $2
      ORDER BY created_at DESC 
      LIMIT 1
    `, [normalizedData.email, normalizedData.phone]);

    if (duplicateCheck.rows.length > 0) {
      const existing = duplicateCheck.rows[0];
      const timeDiff = Date.now() - new Date(existing.created_at).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Если заявка была меньше 24 часов назад, считаем дубликатом
      if (hoursDiff < 24) {
        console.log('⚠️ Дубликат заявки:', existing);
        return res.status(409).json({
          error: 'Заявка уже была отправлена',
          message: 'Мы уже получили вашу заявку. Наш менеджер свяжется с вами в ближайшее время.'
        });
      }
    }

    // Сохраняем в базу данных
    const result = await pool.query(`
      INSERT INTO crm.clients (name, email, phone, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'CREATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      normalizedData.name,
      normalizedData.email,
      normalizedData.phone
    ]);

    const newLead = result.rows[0];

    console.log('✅ Заявка сохранена:', {
      id: newLead.id,
      name: newLead.name,
      email: newLead.email
    });



    // Возвращаем успешный ответ
    res.status(201).json({
      success: true,
      message: 'Заявка успешно отправлена',
      data: {
        id: newLead.id,
        status: 'created'
      }
    });

  } catch (error) {
    console.error('💥 Ошибка обработки заявки:', error);

    // Обработка специфических ошибок БД
    if (error.code === '23505') { // Нарушение уникальности
      return res.status(409).json({
        error: 'Пользователь с таким email уже существует',
        message: 'Возможно, вы уже отправляли заявку. Проверьте email или свяжитесь с нами напрямую.'
      });
    }

    if (error.code === '23502') { // Нарушение NOT NULL
      return res.status(400).json({
        error: 'Не все обязательные поля заполнены',
        message: 'Проверьте корректность заполнения всех полей.'
      });
    }

    // Общая ошибка сервера
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: 'Произошла ошибка при обработке заявки. Попробуйте позже или свяжитесь с нами по телефону.'
    });
  }
});

// 📊 Получение статистики заявок (опционально, для админки)
router.get('/leads/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_leads,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_leads,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month_leads
      FROM crm.clients 
      WHERE status = 'CREATED'
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });

  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      error: 'Ошибка получения статистики'
    });
  }
});

module.exports = router;