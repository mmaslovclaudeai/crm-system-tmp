// backend/routes/health.js - ОБНОВЛЕННЫЙ С WEBSOCKET СТАТИСТИКОЙ
const express = require('express');
const router = express.Router();
const pool = require('../database');
const { asyncHandler } = require('../middleware/errorHandler');

// 🏥 ПРОВЕРКА ЗДОРОВЬЯ API И БД
router.get('/',
  asyncHandler(async (req, res) => {
    // Проверяем подключение к базе данных
    const dbStart = Date.now();
    await pool.query('SELECT 1 as health_check');
    const dbTime = Date.now() - dbStart;

    // Получаем информацию о версии PostgreSQL
    const versionResult = await pool.query('SELECT version()');
    const dbVersion = versionResult.rows[0].version;

    // Проверяем количество подключений к БД
    const connectionsResult = await pool.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);

    // 🔌 ПОЛУЧАЕМ СТАТИСТИКУ WEBSOCKET
    let webSocketStats = null;
    try {
      // Пытаемся получить WebSocket сервис из request или напрямую
      const webSocketService = req.webSocketService || require('../services/websocketService');
      webSocketStats = webSocketService.getStats();
    } catch (error) {
      console.warn('⚠️ WebSocket статистика недоступна:', error.message);
      webSocketStats = {
        connectedClients: 0,
        pendingEvents: 0,
        missedEventsCount: 0,
        uptime: 0,
        error: 'WebSocket service unavailable'
      };
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: 'connected',
        responseTime: `${dbTime}ms`,
        version: dbVersion.split(' ')[0] + ' ' + dbVersion.split(' ')[1],
        connections: connectionsResult.rows[0]
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
      },
      features: {
        authentication: 'enabled',
        authorization: 'enabled',
        rateLimit: 'enabled',
        validation: 'enabled',
        webSocket: webSocketStats.error ? 'error' : 'enabled'
      },
      // 🔌 НОВАЯ СЕКЦИЯ: WebSocket статистика
      webSocket: webSocketStats
    };

    res.json({
      success: true,
      data: healthData
    });
  })
);

// 🔍 ДЕТАЛЬНАЯ ПРОВЕРКА СИСТЕМЫ
router.get('/detailed',
  asyncHandler(async (req, res) => {
    const checks = [];

    // Проверка базы данных
    try {
      const dbStart = Date.now();
      await pool.query('SELECT 1');
      const dbTime = Date.now() - dbStart;

      checks.push({
        component: 'database',
        status: 'healthy',
        responseTime: `${dbTime}ms`,
        message: 'Database connection successful'
      });
    } catch (error) {
      checks.push({
        component: 'database',
        status: 'unhealthy',
        error: error.message,
        message: 'Database connection failed'
      });
    }

    // 🔌 ПРОВЕРКА WEBSOCKET СЕРВИСА
    try {
      const webSocketService = req.webSocketService || require('../services/websocketService');
      const wsStats = webSocketService.getStats();

      checks.push({
        component: 'websocket',
        status: 'healthy',
        connectedClients: wsStats.connectedClients,
        pendingEvents: wsStats.pendingEvents,
        missedEventsCount: wsStats.missedEventsCount,
        message: `WebSocket service running with ${wsStats.connectedClients} connected clients`
      });
    } catch (error) {
      checks.push({
        component: 'websocket',
        status: 'unhealthy',
        error: error.message,
        message: 'WebSocket service unavailable'
      });
    }

    // Проверка переменных окружения
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingEnvVars.length === 0) {
      checks.push({
        component: 'environment',
        status: 'healthy',
        message: 'All required environment variables are set'
      });
    } else {
      checks.push({
        component: 'environment',
        status: 'warning',
        missingVariables: missingEnvVars,
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`
      });
    }

    // Проверка памяти
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    checks.push({
      component: 'memory',
      status: memUsedMB < 500 ? 'healthy' : 'warning',
      used: `${memUsedMB}MB`,
      total: `${memTotalMB}MB`,
      percentage: Math.round((memUsedMB / memTotalMB) * 100),
      message: `Memory usage: ${memUsedMB}MB / ${memTotalMB}MB`
    });

    // Определяем общий статус
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasWarnings = checks.some(check => check.status === 'warning');

    let overallStatus = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasWarnings) {
      overallStatus = 'warning';
    }

    res.json({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
        summary: {
          total: checks.length,
          healthy: checks.filter(c => c.status === 'healthy').length,
          warning: checks.filter(c => c.status === 'warning').length,
          unhealthy: checks.filter(c => c.status === 'unhealthy').length
        }
      }
    });
  })
);

// 🔌 WEBSOCKET СПЕЦИФИЧНЫЕ HEALTH CHECKS
router.get('/websocket',
  asyncHandler(async (req, res) => {
    try {
      const webSocketService = req.webSocketService || require('../services/websocketService');
      const stats = webSocketService.getStats();

      // Дополнительная диагностика
      const diagnostics = {
        serverUptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      };

      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          webSocket: {
            ...stats,
            diagnostics
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'WebSocket service health check failed',
        details: error.message
      });
    }
  })
);

// 🧪 ТЕСТОВЫЙ ЭНДПОИНТ ДЛЯ WEBSOCKET СОБЫТИЙ
router.post('/websocket/test-event',
  asyncHandler(async (req, res) => {
    try {
      const { eventType = 'system_notification', data = {} } = req.body;
      
      const webSocketService = req.webSocketService || require('../services/websocketService');
      
      // Отправляем тестовое событие
      switch (eventType) {
        case 'client_created':
          webSocketService.emitClientCreated({
            id: 999,
            name: 'Тестовый клиент',
            email: 'test@example.com',
            phone: '+7 (999) 123-45-67',
            status: 'lead',
            created_at: new Date().toISOString(),
            ...data
          });
          break;
          
        case 'finance_created':
          webSocketService.emitFinanceCreated({
            id: 999,
            amount: 10000,
            type: 'income',
            description: 'Тестовая операция',
            created_at: new Date().toISOString(),
            ...data
          });
          break;
          
        case 'cashdesk_created':
          webSocketService.emitCashDeskCreated({
            id: 999,
            name: 'Тестовая касса',
            current_balance: 50000,
            created_at: new Date().toISOString(),
            ...data
          });
          break;
          
        case 'system_notification':
        default:
          webSocketService.emitSystemNotification(
            'Тестовое уведомление от WebSocket сервера',
            'info'
          );
          break;
      }

      res.json({
        success: true,
        message: `Тестовое событие ${eventType} отправлено`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Ошибка отправки тестового события',
        details: error.message
      });
    }
  })
);

module.exports = router;