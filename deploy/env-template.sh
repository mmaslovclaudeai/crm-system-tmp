#!/bin/bash

# 🚀 CRM System - Complete Environment Template

cat > /opt/crm-system/.env << 'EOF'
# 🚀 CRM System - Environment Variables

# ========================================
# DATABASE CONFIGURATION
# ========================================
DB_NAME=db
DB_USER=postgres
DB_PASSWORD=GNGvPWa5Pives
DB_HOST=postgres
DB_PORT=5432

# ========================================
# JWT CONFIGURATION
# ========================================
JWT_SECRET=25ea9006173ca40ee4e12ad466cb141532ddc46a8383801025d2e788e26a075a
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ========================================
# SERVER CONFIGURATION
# ========================================
PORT=5001
NODE_ENV=production
DEBUG=false
VERBOSE_LOGGING=false

# ========================================
# CORS CONFIGURATION
# ========================================
CORS_ORIGIN=https://admin.stage.seniorpomidornaya.ru
ALLOWED_ORIGINS=https://admin.stage.seniorpomidornaya.ru

# ========================================
# KAFKA CONFIGURATION
# ========================================
KAFKA_BROKERS=kafka:29092
KAFKA_CLIENT_ID=crm-backend
KAFKA_GROUP_ID=crm-group
ENABLE_KAFKA=true

# ========================================
# TELEGRAM BOT CONFIGURATION
# ========================================
TELEGRAM_BOT_TOKEN=8077238326:AAEwgWeXG9mDKrr-1xmaLmz1PcsGZpY22Ak
TELEGRAM_CHAT_ID=-1002267469682
TELEGRAM_TOPIC_ID=2
ENABLE_TELEGRAM_BOT=true

# ========================================
# GRAFANA CONFIGURATION
# ========================================
GRAFANA_PASSWORD=admin123

# ========================================
# LOGGING CONFIGURATION
# ========================================
LOG_LEVEL=info

# ========================================
# SECURITY CONFIGURATION
# ========================================
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ========================================
# FEATURES CONFIGURATION
# ========================================
ENABLE_SWAGGER=true
ENABLE_WEBSOCKET=true

# ========================================
# EXTERNAL SERVICES
# ========================================
PLANERKA_BEARER_TOKEN=0e8b2cef-a404-4172-b8bf-48ab2660bf9c
EOF

echo "✅ Полный .env файл создан в /opt/crm-system/.env"
echo "📝 Проверьте и отредактируйте значения при необходимости"
