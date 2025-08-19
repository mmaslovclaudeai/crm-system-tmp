#!/bin/bash

# 🚀 CRM System - SSL Setup Script
# Автоматическая настройка SSL сертификатов через Let's Encrypt

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
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
SSL_DIR="$PROJECT_DIR/ssl"
CERTS_DIR="$SSL_DIR/certs"
DOMAINS=(
    "admin.stage.seniorpomidornaya.ru"
    "grafana.stage.seniorpomidornaya.ru"
    "kafka-ui.stage.seniorpomidornaya.ru"
)

log "🚀 Начинаем настройку SSL сертификатов для CRM системы"

# Создание директорий
log "📁 Создаем директории для SSL сертификатов"
mkdir -p "$CERTS_DIR"
chmod 700 "$SSL_DIR"
chmod 600 "$CERTS_DIR"

# Обновление системы
log "🔄 Обновляем систему"
apt update && apt upgrade -y

# Установка необходимых пакетов
log "📦 Устанавливаем необходимые пакеты"
apt install -y certbot python3-certbot-nginx nginx

# Остановка nginx для получения сертификатов
log "⏹️ Останавливаем nginx"
systemctl stop nginx

# Создание временных конфигураций nginx для получения сертификатов
log "📝 Создаем временные конфигурации nginx"
for domain in "${DOMAINS[@]}"; do
    cat > "/etc/nginx/sites-available/$domain" << EOF
server {
    listen 80;
    server_name $domain;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
    
    ln -sf "/etc/nginx/sites-available/$domain" "/etc/nginx/sites-enabled/"
done

# Создание webroot для ACME challenge
mkdir -p /var/www/html/.well-known/acme-challenge

# Запуск nginx с временной конфигурацией
log "🚀 Запускаем nginx с временной конфигурацией"
systemctl start nginx

# Получение сертификатов
log "🔐 Получаем SSL сертификаты через Let's Encrypt"
for domain in "${DOMAINS[@]}"; do
    log "📋 Получаем сертификат для $domain"
    
    if certbot certonly --webroot \
        --webroot-path=/var/www/html \
        --email admin@seniorpomidornaya.ru \
        --agree-tos \
        --no-eff-email \
        --domains "$domain"; then
        
        log "✅ Сертификат для $domain получен успешно"
        
        # Копирование сертификатов в проектную директорию
        cp "/etc/letsencrypt/live/$domain/fullchain.pem" "$CERTS_DIR/$domain.crt"
        cp "/etc/letsencrypt/live/$domain/privkey.pem" "$CERTS_DIR/$domain.key"
        
        # Установка правильных прав доступа
        chmod 644 "$CERTS_DIR/$domain.crt"
        chmod 600 "$CERTS_DIR/$domain.key"
        chown www-data:www-data "$CERTS_DIR/$domain.crt"
        chown www-data:www-data "$CERTS_DIR/$domain.key"
        
    else
        error "❌ Не удалось получить сертификат для $domain"
    fi
done

# Остановка nginx
log "⏹️ Останавливаем nginx"
systemctl stop nginx

# Удаление временных конфигураций
log "🧹 Удаляем временные конфигурации"
for domain in "${DOMAINS[@]}"; do
    rm -f "/etc/nginx/sites-enabled/$domain"
    rm -f "/etc/nginx/sites-available/$domain"
done

# Копирование production конфигураций nginx
log "📋 Копируем production конфигурации nginx"
cp "$PROJECT_DIR/deploy/nginx/nginx.conf" /etc/nginx/nginx.conf

for domain in "${DOMAINS[@]}"; do
    cp "$PROJECT_DIR/deploy/nginx/sites-available/$domain" "/etc/nginx/sites-available/"
    ln -sf "/etc/nginx/sites-available/$domain" "/etc/nginx/sites-enabled/"
done

# Создание директорий для логов
mkdir -p /var/log/nginx

# Проверка конфигурации nginx
log "🔍 Проверяем конфигурацию nginx"
if nginx -t; then
    log "✅ Конфигурация nginx корректна"
else
    error "❌ Ошибка в конфигурации nginx"
fi

# Запуск nginx
log "🚀 Запускаем nginx"
systemctl start nginx
systemctl enable nginx

# Настройка автоматического обновления сертификатов
log "🔄 Настраиваем автоматическое обновление сертификатов"

# Создание скрипта обновления
cat > "$SSL_DIR/renew-certs.sh" << 'EOF'
#!/bin/bash

# Обновление сертификатов
certbot renew --quiet

# Перезапуск nginx после обновления
systemctl reload nginx

# Копирование обновленных сертификатов
PROJECT_DIR="/opt/crm-system"
CERTS_DIR="$PROJECT_DIR/ssl/certs"

for cert in /etc/letsencrypt/live/*/; do
    domain=$(basename "$cert")
    if [ -f "$cert/fullchain.pem" ] && [ -f "$cert/privkey.pem" ]; then
        cp "$cert/fullchain.pem" "$CERTS_DIR/$domain.crt"
        cp "$cert/privkey.pem" "$CERTS_DIR/$domain.key"
        chmod 644 "$CERTS_DIR/$domain.crt"
        chmod 600 "$CERTS_DIR/$domain.key"
        chown www-data:www-data "$CERTS_DIR/$domain.crt"
        chown www-data:www-data "$CERTS_DIR/$domain.key"
    fi
done
EOF

chmod +x "$SSL_DIR/renew-certs.sh"

# Добавление cron задачи для автоматического обновления
(crontab -l 2>/dev/null; echo "0 12 * * * $SSL_DIR/renew-certs.sh") | crontab -

log "✅ SSL сертификаты настроены успешно!"
log "📋 Домены:"
for domain in "${DOMAINS[@]}"; do
    log "   - https://$domain"
done
log "🔄 Автоматическое обновление настроено (ежедневно в 12:00)"
log "📁 Сертификаты сохранены в: $CERTS_DIR"
