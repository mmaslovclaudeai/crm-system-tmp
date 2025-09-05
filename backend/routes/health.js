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
    let webSocketStats = {
      connectedClients: 0,
      pendingEvents: 0,
      missedEventsCount: 0,
      uptime: 0,
      status: 'disabled'
    };

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
    checks.push({
      component: 'websocket',
      status: 'disabled',
      connectedClients: 0,
      pendingEvents: 0,
      missedEventsCount: 0,
      message: 'WebSocket service is disabled'
    });

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
        status: 'disabled',
        timestamp: new Date().toISOString(),
        webSocket: {
          connectedClients: 0,
          pendingEvents: 0,
          missedEventsCount: 0,
          uptime: 0,
          status: 'disabled',
          diagnostics
        }
      }
    });
  })
);

// 🧪 ТЕСТОВЫЙ ЭНДПОИНТ ДЛЯ WEBSOCKET СОБЫТИЙ
router.post('/websocket/test-event',
  asyncHandler(async (req, res) => {
    const { eventType = 'system_notification', data = {} } = req.body;
    
    res.json({
      success: true,
      message: `WebSocket service is disabled. Event ${eventType} would be sent if enabled.`,
      timestamp: new Date().toISOString(),
      note: 'WebSocket service is currently disabled'
    });
  })
);

module.exports = router;