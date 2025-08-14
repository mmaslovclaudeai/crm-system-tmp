#!/bin/bash

# 🚀 CRM System - Быстрый перезапуск
echo "🔄 Перезапуск CRM системы..."

# Останавливаем контейнеры
echo "⏹️  Останавливаем контейнеры..."
docker-compose down

# Очищаем кэш Docker
echo "🧹 Очищаем Docker кэш..."
docker system prune -f

# Запускаем заново
echo "🚀 Запускаем систему..."
docker-compose up --build -d

# Ждем запуска
echo "⏳ Ждем запуска сервисов..."
sleep 15

# Проверяем статус
echo "📊 Статус сервисов:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Система перезапущена!"
echo "📱 Доступные URL:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:5001"
echo "   Swagger:      http://localhost:3000/api/docs/swagger-ui/"
echo "   Health:       http://localhost:5001/api/health"
echo ""
echo "🔧 Полезные команды:"
echo "   Логи:         npm run docker:logs"
echo "   Остановить:   npm run docker:down"
echo "   Перезапустить: npm run docker:restart"
