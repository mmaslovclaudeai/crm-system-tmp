// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { warn, error, traceWarn, traceError } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production-please';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    traceWarn(req, 'Access token required', {
      action: 'authentication',
      status: 'failed',
      reason: 'no_token',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.status(401).json({ 
      error: 'Access token required',
      traceId: req.traceId || 'no-trace-id'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      traceWarn(req, 'Token verification failed', {
        action: 'authentication',
        status: 'failed',
        reason: 'invalid_token',
        error: err.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        traceId: req.traceId || 'no-trace-id'
      });
    }
    req.user = user;
    next();
  });
};

// Генерация JWT токена
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Генерация Refresh токена
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

// Хеширование пароля
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Проверка пароля
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Middleware для проверки ролей
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      traceWarn(req, 'Authentication required', {
        action: 'authorization',
        status: 'failed',
        reason: 'no_user',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ 
        error: 'Authentication required',
        traceId: req.traceId || 'no-trace-id'
      });
    }

    if (!roles.includes(req.user.role)) {
      traceWarn(req, 'Access denied - insufficient permissions', {
        action: 'authorization',
        status: 'failed',
        reason: 'insufficient_role',
        userRole: req.user.role,
        requiredRoles: roles,
        userId: req.user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({
        error: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
        traceId: req.traceId || 'no-trace-id'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  requireRole,
  JWT_SECRET
};