#!/bin/bash

# CRM-system Deployment Script

# Создание .env файла
echo "Создание .env файла..."

cat > .env << 'EOF'
# 🚀 CRM System - Environment Variables
# ========================================
# DATABASE CONFIGURATION
# ========================================
DB_NAME=db
DB_USER=postgres
DB_PASSWORD=12345678
DB_PORT=5432
# ========================================
# JWT CONFIGURATION
# ========================================
JWT_SECRET=jwt-for-crm-system
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=3d
# ========================================
# CORS CONFIGURATION
# ========================================
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5001,http://127.0.0.1:3000,http://127.0.0.1:5001
# ========================================
# SERVER CONFIGURATION
# ========================================
VITE_API_URL=localhost:3000

PORT=5001
NODE_ENV=production
DEBUG=false
VERBOSE_LOGGING=false
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
EOF


# Проверяем наличие Docker и Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker Desktop."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose."
    exit 1
fi

# Проверяем, запущен ли Docker
if ! docker info &> /dev/null; then
    echo "❌ Docker не запущен. Запустите Docker Desktop."
    exit 1
fi

echo "✅ Docker и Docker Compose готовы"

# Удаляем старый мусор
echo "⏹️  Останавливаем существующие контейнеры..."
docker-compose down -v
docker system prune -a

npm install
npm run build

# Запускаем все сервисы
echo "🚀 Запускаем все сервисы..."
docker-compose up --build -d

# Ждем запуска
echo "⏳ Ждем запуска сервисов..."
sleep 15

# Проверяем статус
echo "📊 Статус сервисов:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Healthcheck
check_container_health() {
    echo "Проверяем здоровье контейнера..."
    
    # Выполняем curl запрос с таймаутом 10 секунд
    local response
    response=$(curl -s --connect-timeout 10 --max-time 10 localhost:5001/api/health 2>&1)
    local curl_exit_code=$?

    # Проверяем код возврата curl
    if [ $curl_exit_code -ne 0 ]; then
        echo "❌ Healthcheck не прошел: контейнер недоступен"
        echo "Ошибка: $response"
        exit 1
    fi

    # Проверяем, что ответ содержит JSON с success:true
    if echo "$response" | grep -q '"success":true' && echo "$response" | grep -q '"status":"healthy"'; then
        echo "✅ Healthcheck прошел успешно!"
        return 0
    else
        echo "❌ Healthcheck не прошел: получен некорректный ответ"
        echo "Ответ сервера: $response"
        exit 1
    fi
}

check_container_health

echo ""
echo "✅ Система запущена!"
echo "📱 Доступные URL:"
echo "   Frontend:     http://localhost:3000"
echo "   KafkaUI:      http://localhost:8080"
echo "   Backend API:  http://localhost:5001"
echo "   Swagger:      http://localhost:3000/api/docs/swagger-ui"
echo "   Health:       http://localhost:5001/api/health"
echo ""
echo "🔐 Учетные данные:"
echo "   Email:        admin@crm.local"
echo "   Пароль:       admin123"
echo "   JWT Secret:   jwt-for-crm-system"
echo "   Пароль DB:    12345678"