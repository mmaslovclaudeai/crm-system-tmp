# Telegram Bot Service

Сервис для обработки уведомлений из Kafka и отправки их в Telegram.

## Описание

Этот сервис является частью CRM системы и отвечает за:
- Потребление сообщений из Kafka топика `crm-msgAccepted`
- Обработку различных типов событий (создание клиентов, финансовые операции, изменения статусов работников)
- Отправку форматированных уведомлений в Telegram

## Архитектура

```
CRM Backend → Kafka → Telegram Bot Service → Telegram
```

## Установка и настройка

### 1. Создание Telegram бота

1. Найдите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен

### 2. Получение Chat ID

1. Добавьте бота в нужную группу или начните с ним диалог
2. Отправьте любое сообщение боту
3. Перейдите по ссылке: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Найдите `chat.id` в ответе

### 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 4. Запуск сервиса

```bash
# Запуск всех сервисов включая Kafka
docker-compose up -d

# Запуск только Telegram Bot сервиса
docker-compose up telegrambot
```

## Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `KAFKA_BROKERS` | Адреса Kafka брокеров | `kafka:29092` |
| `KAFKA_TOPIC` | Топик для потребления сообщений | `crm-msgAccepted` |
| `KAFKA_GROUP_ID` | ID группы потребителей | `telegram_bot_group` |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | - |
| `TELEGRAM_CHAT_ID` | ID чата для отправки уведомлений | - |
| `LOG_LEVEL` | Уровень логирования | `INFO` |

## Типы событий

Сервис обрабатывает следующие типы событий:

### `client_created`
Уведомление о создании нового клиента.

```json
{
  "event_type": "client_created",
  "data": {
    "full_name": "Иван Иванов",
    "email": "ivan@example.com",
    "phone": "+7 999 123-45-67",
    "status": "CREATED"
  }
}
```

### `finance_operation`
Уведомление о финансовой операции.

```json
{
  "event_type": "finance_operation",
  "data": {
    "amount": 10000.50,
    "description": "Оплата за обучение",
    "date": "2024-01-15",
    "cash_desk_name": "Основная касса"
  }
}
```

### `worker_status`
Уведомление об изменении статуса работника.

```json
{
  "event_type": "worker_status",
  "data": {
    "full_name": "Петр Петров",
    "position": "Менеджер",
    "is_active": true
  }
}
```

## Разработка

### Локальная разработка

1. Установите зависимости:
```bash
cd services/telegrambot
pip install -r requirements.txt
```

2. Создайте файл `.env` с переменными окружения

3. Запустите сервис:
```bash
python main.py
```

### Структура проекта

```
services/telegrambot/
├── main.py              # Основной файл сервиса
├── kafka_client.py      # Модуль для работы с Kafka
├── telegram_client.py   # Модуль для работы с Telegram API
├── requirements.txt     # Python зависимости
├── Dockerfile          # Docker образ
├── env.example         # Пример переменных окружения
└── README.md           # Документация
```

### Логирование

Логи сохраняются в файл `logs/telegrambot.log` с ротацией:
- Ротация: каждый день
- Хранение: 7 дней
- Формат: `{time} | {level} | {message}`

## Мониторинг

### Kafka UI
Доступен по адресу: http://localhost:8080

### Логи
```bash
# Просмотр логов сервиса
docker-compose logs telegrambot

# Просмотр логов в реальном времени
docker-compose logs -f telegrambot
```

## Troubleshooting

### Проблемы с подключением к Kafka
1. Убедитесь, что Kafka запущена: `docker-compose ps kafka`
2. Проверьте логи Kafka: `docker-compose logs kafka`
3. Убедитесь, что топик `crm-msgAccepted` существует

### Проблемы с Telegram
1. Проверьте правильность токена бота
2. Убедитесь, что бот добавлен в чат
3. Проверьте права бота на отправку сообщений

### Проблемы с отправкой сообщений
1. Проверьте логи сервиса
2. Убедитесь, что переменные окружения установлены
3. Проверьте подключение к интернету

## Безопасность

- Токен бота должен храниться в переменных окружения
- Не коммитьте токен в репозиторий
- Используйте HTTPS для API запросов
- Ограничьте доступ к логам
