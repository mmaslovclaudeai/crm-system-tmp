# 🚀 CRM System - Инструкция по деплою

## 📋 Обзор

Этот документ содержит полную инструкцию по развертыванию CRM системы на Ubuntu сервере с настройкой nginx, SSL сертификатов и всех необходимых сервисов.

## 🎯 Цели деплоя

- **Frontend**: https://admin.stage.seniorpomidornaya.ru
- **Grafana**: https://grafana.stage.seniorpomidornaya.ru  
- **Kafka UI**: https://kafka-ui.stage.seniorpomidornaya.ru
- **PostgreSQL**: localhost:6432 (внешний доступ)

## 🛠️ Требования к серверу

- Ubuntu 20.04+ или 22.04+
- Минимум 4GB RAM
- Минимум 50GB свободного места
- Root доступ
- Открытые порты: 80, 443, 6432

## 📦 Структура файлов деплоя

```
deploy/
├── nginx/
│   ├── nginx.conf                    # Основная конфигурация nginx
│   └── sites-available/              # Конфигурации доменов
│       ├── admin.stage.seniorpomidornaya.ru
│       ├── grafana.stage.seniorpomidornaya.ru
│       └── kafka-ui.stage.seniorpomidornaya.ru
├── docker-compose.prod.yml           # Production docker-compose
├── deploy.sh                         # Основной скрипт деплоя
├── ssl-setup.sh                      # Настройка SSL сертификатов
└── README.md                         # Эта инструкция
```

## 🚀 Пошаговый деплой

### Шаг 1: Подготовка сервера

1. **Подключитесь к серверу с root правами**
   ```bash
   ssh root@your-server-ip
   ```

2. **Склонируйте репозиторий**
   ```bash
   cd /opt
   git clone https://github.com/your-repo/crm-system.git
   cd crm-system
   ```

3. **Запустите основной скрипт деплоя**
   ```bash
   bash deploy/deploy.sh
   ```

### Шаг 2: Настройка переменных окружения

1. **Отредактируйте файл .env**
   ```bash
   nano /opt/crm-system/.env
   ```

2. **Установите обязательные переменные:**
   ```bash
   # База данных
   DB_PASSWORD=your_secure_password_here
   
   # JWT секрет (сгенерируйте случайную строку)
   JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
   
   # Telegram Bot токен
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   
   # Пароль для Grafana
   GRAFANA_PASSWORD=your_grafana_password_here
   ```

### Шаг 3: Настройка SSL сертификатов

1. **Запустите SSL настройку**
   ```bash
   bash /opt/crm-system/deploy/ssl-setup.sh
   ```

2. **Проверьте получение сертификатов**
   ```bash
   ls -la /opt/crm-system/ssl/certs/
   ```

### Шаг 4: Запуск системы

1. **Запустите CRM систему**
   ```bash
   bash /opt/crm-system/start.sh
   ```

2. **Проверьте статус сервисов**
   ```bash
   docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml ps
   ```

## 🔧 Управление системой

### Основные команды

```bash
# Запуск системы
bash /opt/crm-system/start.sh

# Перезапуск системы
bash /opt/crm-system/restart.sh

# Просмотр логов
bash /opt/crm-system/logs.sh

# Создание бэкапа
bash /opt/crm-system/backup.sh

# Остановка системы
docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml down
```

### Просмотр логов

```bash
# Все сервисы
docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml logs -f

# Конкретный сервис
docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml logs -f backend
docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml logs -f frontend
docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml logs -f postgres
```

### Мониторинг системы

```bash
# Статус контейнеров
docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml ps

# Использование ресурсов
docker stats

# Проверка здоровья API
curl http://localhost:5000/health
```

## 🔒 Безопасность

### SSL сертификаты

- Автоматическое обновление через Let's Encrypt
- Ежедневная проверка в 12:00
- Сертификаты хранятся в `/opt/crm-system/ssl/certs/`

### Firewall

```bash
# Открыть необходимые порты
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 6432/tcp
ufw enable
```

### Резервное копирование

- Автоматические бэкапы каждый день в 2:00
- Хранение последних 7 бэкапов
- Бэкапы включают: БД, конфигурации, логи

## 🐛 Устранение неполадок

### Проблемы с SSL

```bash
# Проверка сертификатов
certbot certificates

# Обновление сертификатов
certbot renew

# Проверка nginx конфигурации
nginx -t
```

### Проблемы с Docker

```bash
# Перезапуск Docker
systemctl restart docker

# Очистка неиспользуемых ресурсов
docker system prune -a

# Проверка логов Docker
journalctl -u docker.service
```

### Проблемы с базой данных

```bash
# Подключение к БД
docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml exec postgres psql -U crm_user -d crm_prod

# Проверка логов PostgreSQL
docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml logs postgres
```

### Проблемы с nginx

```bash
# Проверка конфигурации
nginx -t

# Перезапуск nginx
systemctl restart nginx

# Просмотр логов
tail -f /var/log/nginx/error.log
```

## 📊 Мониторинг и логи

### Логи nginx

- Access logs: `/var/log/nginx/access.log`
- Error logs: `/var/log/nginx/error.log`
- Доменные логи: `/var/log/nginx/*.access.log`

### Логи приложений

- Backend: `/opt/crm-system/backend/logs/`
- Frontend: `/opt/crm-system/frontend/logs/`
- Telegram Bot: `/opt/crm-system/services/telegrambot/logs/`

### Grafana дашборды

- URL: https://grafana.stage.seniorpomidornaya.ru
- Логин: `admin`
- Пароль: из переменной `GRAFANA_PASSWORD`

## 🔄 Обновление системы

### Обновление кода

```bash
cd /opt/crm-system
git pull origin main
bash /opt/crm-system/restart.sh
```

### Обновление конфигураций

```bash
# Обновление nginx конфигураций
cp /opt/crm-system/deploy/nginx/nginx.conf /etc/nginx/nginx.conf
systemctl reload nginx

# Обновление docker-compose
docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml pull
bash /opt/crm-system/restart.sh
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `bash /opt/crm-system/logs.sh`
2. Проверьте статус сервисов: `docker-compose -f /opt/crm-system/deploy/docker-compose.prod.yml ps`
3. Проверьте системные ресурсы: `htop`
4. Создайте бэкап перед изменениями: `bash /opt/crm-system/backup.sh`

## 📝 Полезные команды

```bash
# Проверка свободного места
df -h

# Проверка использования памяти
free -h

# Проверка открытых портов
netstat -tlnp

# Проверка процессов
ps aux | grep docker

# Очистка Docker кэша
docker system prune -a --volumes
```
