# 🚀 CRM System - Локальная разработка

## 📋 Быстрый старт

### Первый запуск
```bash
# Установка зависимостей и запуск
npm run setup
npm run start
```

### Обычный запуск
```bash
# Запуск системы
npm run start

# Или через Docker Compose
npm run docker:up
```

### Перезапуск
```bash
# Быстрый перезапуск с очисткой кэша
npm run restart

# Обычный перезапуск
npm run docker:restart
```

## 🔧 Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run start` | Запуск всей системы |
| `npm run restart` | Перезапуск с очисткой кэша |
| `npm run docker:up` | Запуск через Docker Compose |
| `npm run docker:down` | Остановка контейнеров |
| `npm run docker:logs` | Просмотр логов |
| `npm run docker:restart` | Перезапуск контейнеров |
| `npm run setup` | Установка зависимостей |
| `npm run clean` | Очистка node_modules |

## 🌐 Доступные URL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Swagger**: http://localhost:3000/api/docs/swagger-ui/
- **Health Check**: http://localhost:5001/api/health

## 🔐 Учетные данные

- **Email**: admin@crm.local
- **Пароль**: admin123

## 📁 Структура проекта

```
crm-system-dev/
├── frontend/         # Frontend (React + Vite)
│   ├── src/         # React компоненты
│   ├── public/      # Статические файлы
│   └── package.json # Frontend зависимости
├── backend/         # Backend API (Node.js + Express)
│   ├── routes/      # API маршруты
│   ├── services/    # Бизнес-логика
│   └── package.json # Backend зависимости
├── init.sql         # Инициализация базы данных
├── docker-compose.yml # Docker Compose конфигурация
├── start.sh         # Скрипт запуска
├── restart.sh       # Скрипт перезапуска
├── package.json     # Корневой package.json
└── README.md        # Основная документация
```

## 🐛 Отладка

### Просмотр логов
```bash
# Все сервисы
npm run docker:logs

# Конкретный сервис
docker logs crm_frontend
docker logs crm_backend
docker logs crm_postgres
```

### Проверка статуса
```bash
# Статус контейнеров
docker ps

# Проверка API
curl http://localhost:5001/api/health

# Проверка базы данных
docker exec -it crm_postgres psql -U crm_user -d crm_dev -c "\dt crm.*"
```

### Очистка и пересборка
```bash
# Полная очистка
npm run clean
docker-compose down -v
docker system prune -f

# Пересборка
npm run setup
npm run start
```

## 🔄 Hot Reload

- **Frontend**: Автоматически перезагружается при изменении файлов в `src/`
- **Backend**: Автоматически перезагружается при изменении файлов в `backend/`
- **База данных**: Изменения в `init.sql` применяются при пересоздании контейнера

## 📝 Полезные команды

```bash
# Вход в контейнер
docker exec -it crm_backend bash
docker exec -it crm_frontend sh
docker exec -it crm_postgres psql -U crm_user -d crm_dev



# Тест авторизации
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.local","password":"admin123"}'
```
