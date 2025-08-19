#!/bin/bash

# 🚀 CRM System - Complete Deployment Script
# Полная настройка CRM системы на Ubuntu сервере

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Проверка root прав
if [[ $EUID -ne 0 ]]; then
   error "Этот скрипт должен быть запущен с правами root"
fi

# Переменные
PROJECT_DIR="/opt/crm-system"
BACKUP_DIR="/opt/backups/crm-system"

log "🚀 Начинаем полный деплой CRM системы"

# Создание резервной копии (если проект уже существует)
if [ -d "$PROJECT_DIR" ]; then
    log "📦 Создаем резервную копию существующего проекта"
    mkdir -p "$BACKUP_DIR"
    tar -czf "$BACKUP_DIR/crm-backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C /opt crm-system
    log "✅ Резервная копия создана"
fi

# Обновление системы
log "🔄 Обновляем систему"
apt update && apt upgrade -y

# Установка необходимых пакетов
log "📦 Устанавливаем необходимые пакеты"
apt install -y \
    curl \
    wget \
    git \
    certbot \
    python3-certbot-nginx \
    postgresql-client \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Установка Docker
log "🐳 Устанавливаем Docker"
# Удаляем старые версии Docker если есть
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Добавляем официальный GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавляем репозиторий Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Обновляем список пакетов
apt update

# Устанавливаем Docker
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Устанавливаем docker-compose отдельно (для совместимости)
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Запуск и включение Docker
log "🐳 Запускаем и настраиваем Docker"
systemctl start docker
systemctl enable docker

# Создание пользователя для проекта (если не существует)
if ! id "crm" &>/dev/null; then
    log "👤 Создаем пользователя crm"
    useradd -m -s /bin/bash crm
    usermod -aG docker crm
    usermod -aG sudo crm
fi

# Создание директорий проекта
log "📁 Создаем директории проекта"
mkdir -p "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/ssl/certs"
mkdir -p "$PROJECT_DIR/backend/logs"
mkdir -p "$PROJECT_DIR/frontend/logs"
mkdir -p "$PROJECT_DIR/services/telegrambot/logs"
mkdir -p "$PROJECT_DIR/deploy/nginx/sites-enabled"

# Установка прав доступа
chown -R crm:crm "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"

# Создание .env файла
log "📝 Создаем .env файл"
cat > "$PROJECT_DIR/.env" << 'EOF'
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

warning "⚠️  Пожалуйста, отредактируйте файл $PROJECT_DIR/.env и установите правильные значения"
warning "⚠️  Особенно важны: DB_PASSWORD, JWT_SECRET, TELEGRAM_BOT_TOKEN"

# Создание скриптов управления
log "📝 Создаем скрипты управления"

# start.sh
cat > "$PROJECT_DIR/start.sh" << 'EOF'
#!/bin/bash

# 🚀 CRM System - Start Script

set -e

PROJECT_DIR="/opt/crm-system"
cd "$PROJECT_DIR"

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Проверка .env файла
if [ ! -f ".env" ]; then
    error "Файл .env не найден"
fi

# Проверка переменных окружения
source .env

required_vars=("DB_PASSWORD" "JWT_SECRET" "TELEGRAM_BOT_TOKEN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_*_here" ]; then
        error "Переменная $var не установлена или имеет значение по умолчанию"
    fi
done

log "🚀 Запускаем CRM систему"

# Остановка существующих контейнеров
log "⏹️ Останавливаем существующие контейнеры"
docker-compose down

# Сборка и запуск контейнеров
log "🔨 Собираем и запускаем контейнеры"
docker-compose up -d --build

# Ожидание готовности сервисов
log "⏳ Ожидаем готовности сервисов"
sleep 30

# Проверка статуса контейнеров
log "🔍 Проверяем статус контейнеров"
docker-compose ps

# Проверка здоровья API
log "🏥 Проверяем здоровье API"
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    log "✅ API работает корректно"
else
    warning "⚠️ API не отвечает, проверьте логи: docker-compose logs backend"
fi

log "🎉 CRM система запущена успешно!"
log "📋 Доступные сервисы:"
log "   - Frontend: http://localhost:3000"
log "   - Backend API: http://localhost:5001"
log "   - Grafana: http://localhost:3001"
log "   - Kafka UI: http://localhost:8080"
log "   - PostgreSQL: localhost:5432"
log "   - Nginx: http://localhost:80"
EOF

chmod +x "$PROJECT_DIR/start.sh"

# restart.sh
cat > "$PROJECT_DIR/restart.sh" << 'EOF'
#!/bin/bash

# 🔄 CRM System - Restart Script

set -e

PROJECT_DIR="/opt/crm-system"
cd "$PROJECT_DIR"

# Цвета для вывода
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log "🔄 Перезапускаем CRM систему"

# Остановка контейнеров
log "⏹️ Останавливаем контейнеры"
docker-compose down

# Запуск контейнеров
log "🚀 Запускаем контейнеры"
docker-compose up -d

log "✅ CRM система перезапущена"
EOF

chmod +x "$PROJECT_DIR/restart.sh"

# logs.sh
cat > "$PROJECT_DIR/logs.sh" << 'EOF'
#!/bin/bash

# 📋 CRM System - Logs Viewer

PROJECT_DIR="/opt/crm-system"
cd "$PROJECT_DIR"

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

echo -e "${BLUE}📋 CRM System - Logs Viewer${NC}"
echo "Выберите сервис для просмотра логов:"
echo "1) Backend API"
echo "2) Frontend"
echo "3) PostgreSQL"
echo "4) Kafka"
echo "5) Grafana"
echo "6) Telegram Bot"
echo "7) Nginx"
echo "8) Все сервисы"
echo "0) Выход"

read -p "Введите номер: " choice

case $choice in
    1)
        log "📋 Логи Backend API"
        docker-compose logs -f backend
        ;;
    2)
        log "📋 Логи Frontend"
        docker-compose logs -f frontend
        ;;
    3)
        log "📋 Логи PostgreSQL"
        docker-compose logs -f postgres
        ;;
    4)
        log "📋 Логи Kafka"
        docker-compose logs -f kafka
        ;;
    5)
        log "📋 Логи Grafana"
        docker-compose logs -f grafana
        ;;
    6)
        log "📋 Логи Telegram Bot"
        docker-compose logs -f telegrambot
        ;;
    7)
        log "📋 Логи Nginx"
        docker-compose logs -f nginx
        ;;
    8)
        log "📋 Логи всех сервисов"
        docker-compose logs -f
        ;;
    0)
        echo "Выход"
        exit 0
        ;;
    *)
        echo "Неверный выбор"
        exit 1
        ;;
esac
EOF

chmod +x "$PROJECT_DIR/logs.sh"

# backup.sh
cat > "$PROJECT_DIR/backup.sh" << 'EOF'
#!/bin/bash

# 💾 CRM System - Backup Script

set -e

PROJECT_DIR="/opt/crm-system"
BACKUP_DIR="/opt/backups/crm-system"
DATE=$(date +%Y%m%d-%H%M%S)

# Цвета для вывода
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log "💾 Создаем резервную копию CRM системы"

# Создание директории для бэкапов
mkdir -p "$BACKUP_DIR"

# Бэкап базы данных
log "🗄️ Создаем бэкап базы данных"
source "$PROJECT_DIR/.env"
docker-compose exec -T postgres \
    pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/db-backup-$DATE.sql"

# Бэкап конфигураций
log "📁 Создаем бэкап конфигураций"
tar -czf "$BACKUP_DIR/config-backup-$DATE.tar.gz" \
    -C "$PROJECT_DIR" \
    .env \
    deploy/ \
    config/ \
    ssl/

# Бэкап логов
log "📋 Создаем бэкап логов"
tar -czf "$BACKUP_DIR/logs-backup-$DATE.tar.gz" \
    -C "$PROJECT_DIR" \
    logs/

# Удаление старых бэкапов (оставляем последние 7)
log "🧹 Удаляем старые бэкапы"
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

log "✅ Резервная копия создана: $BACKUP_DIR"
log "📊 Размер бэкапов:"
du -h "$BACKUP_DIR"/* | tail -3
EOF

chmod +x "$PROJECT_DIR/backup.sh"

# Настройка cron для автоматических бэкапов
log "⏰ Настраиваем автоматические бэкапы"
(crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_DIR/backup.sh") | crontab -

# Установка прав доступа
log "🔐 Устанавливаем права доступа"
chown -R crm:crm "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"
chmod 600 "$PROJECT_DIR/.env"

log "✅ Деплой завершен успешно!"
log ""
log "📋 Следующие шаги:"
log "1. Отредактируйте файл $PROJECT_DIR/.env"
log "2. Запустите систему: bash $PROJECT_DIR/start.sh"
log "3. Настройте SSL сертификаты: bash $PROJECT_DIR/ssl-setup.sh"
log ""
log "📁 Полезные команды:"
log "   - Просмотр логов: bash $PROJECT_DIR/logs.sh"
log "   - Перезапуск: bash $PROJECT_DIR/restart.sh"
log "   - Бэкап: bash $PROJECT_DIR/backup.sh"
log ""
log "🌐 Доступные домены (после настройки SSL):"
log "   - https://admin.stage.seniorpomidornaya.ru"
log "   - https://grafana.stage.seniorpomidornaya.ru"
log "   - https://kafka-ui.stage.seniorpomidornaya.ru"
