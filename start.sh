#!/bin/bash

# 🚀 CRM System - Запуск системы
echo "🚀 Запуск CRM системы..."

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

# Устанавливаем зависимости если нужно
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Устанавливаем зависимости frontend..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Устанавливаем зависимости backend..."
    cd backend && npm install && cd ..
fi

# Останавливаем существующие контейнеры
echo "⏹️  Останавливаем существующие контейнеры..."
docker-compose down

# Запускаем все сервисы
echo "🚀 Запускаем все сервисы..."
docker-compose up --build -d

# Ждем запуска
echo "⏳ Ждем запуска сервисов..."
sleep 15

# Проверяем статус
echo "📊 Статус сервисов:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Система запущена!"
echo "📱 Доступные URL:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:5001"
echo "   Swagger:      http://localhost:3000/api/docs/swagger-ui"
echo "   Health:       http://localhost:5001/api/health"
echo ""
echo "🔐 Учетные данные:"
echo "   Email:        admin@crm.local"
echo "   Пароль:       admin123"
echo ""
echo "🔧 Полезные команды:"
echo "   Логи:         npm run docker:logs"
echo "   Остановить:   npm run docker:down"
echo "   Перезапустить: npm run docker:restart"
