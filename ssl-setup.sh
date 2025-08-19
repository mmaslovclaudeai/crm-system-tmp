#!/bin/bash

# 🚀 CRM System - SSL Setup Script
# Автоматическая настройка SSL сертификатов через Let's Encrypt

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

# Проверка что система запущена
if ! docker-compose -f "$PROJECT_DIR/docker-compose.yml" ps | grep -q "crm_nginx"; then
    error "❌ CRM система не запущена. Сначала запустите: bash $PROJECT_DIR/start.sh"
fi

# Создание директорий
log "📁 Создаем директории для SSL сертификатов"
mkdir -p "$CERTS_DIR"
chmod 700 "$SSL_DIR"
chmod 600 "$CERTS_DIR"

# Остановка nginx контейнера для получения сертификатов
log "⏹️ Останавливаем nginx контейнер"
docker-compose -f "$PROJECT_DIR/docker-compose.yml" stop nginx

# Создание временных конфигураций nginx для получения сертификатов
log "📝 Создаем временные конфигурации nginx"
mkdir -p /tmp/nginx-temp
cat > "/tmp/nginx-temp/nginx.conf" << 'EOF'
events {
    worker_connections 768;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        server_name _;
        
        location /.well-known/acme-challenge/ {
            root /var/www/html;
        }
        
        location / {
            return 301 https://$server_name$request_uri;
        }
    }
}
EOF

# Запуск временного nginx контейнера
log "🚀 Запускаем временный nginx для получения сертификатов"
docker run -d --name nginx-temp \
    -p 80:80 \
    -v /tmp/nginx-temp/nginx.conf:/etc/nginx/nginx.conf:ro \
    -v /var/www/html:/var/www/html \
    nginx:alpine

# Создание webroot для ACME challenge
mkdir -p /var/www/html/.well-known/acme-challenge

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
        chown crm:crm "$CERTS_DIR/$domain.crt"
        chown crm:crm "$CERTS_DIR/$domain.key"
        
    else
        error "❌ Не удалось получить сертификат для $domain"
    fi
done

# Остановка временного nginx
log "⏹️ Останавливаем временный nginx"
docker stop nginx-temp
docker rm nginx-temp

# Обновление nginx конфигураций с SSL
log "📋 Обновляем nginx конфигурации с SSL"

# Обновление конфигурации admin.stage.seniorpomidornaya.ru
sed -i 's/# ssl_certificate/ssl_certificate/g' "$PROJECT_DIR/deploy/nginx/sites-available/admin.stage.seniorpomidornaya.ru"
sed -i 's/# ssl_certificate_key/ssl_certificate_key/g' "$PROJECT_DIR/deploy/nginx/sites-available/admin.stage.seniorpomidornaya.ru"

# Обновление конфигурации grafana.stage.seniorpomidornaya.ru
sed -i 's/# ssl_certificate/ssl_certificate/g' "$PROJECT_DIR/deploy/nginx/sites-available/grafana.stage.seniorpomidornaya.ru"
sed -i 's/# ssl_certificate_key/ssl_certificate_key/g' "$PROJECT_DIR/deploy/nginx/sites-available/grafana.stage.seniorpomidornaya.ru"

# Обновление конфигурации kafka-ui.stage.seniorpomidornaya.ru
sed -i 's/# ssl_certificate/ssl_certificate/g' "$PROJECT_DIR/deploy/nginx/sites-available/kafka-ui.stage.seniorpomidornaya.ru"
sed -i 's/# ssl_certificate_key/ssl_certificate_key/g' "$PROJECT_DIR/deploy/nginx/sites-available/kafka-ui.stage.seniorpomidornaya.ru"

# Запуск nginx контейнера
log "🚀 Запускаем nginx контейнер с SSL"
docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d nginx

# Настройка автоматического обновления сертификатов
log "🔄 Настраиваем автоматическое обновление сертификатов"

# Создание скрипта обновления
cat > "$SSL_DIR/renew-certs.sh" << 'EOF'
#!/bin/bash

# Обновление сертификатов
certbot renew --quiet

# Перезапуск nginx после обновления
cd /opt/crm-system
docker-compose restart nginx

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
        chown crm:crm "$CERTS_DIR/$domain.crt"
        chown crm:crm "$CERTS_DIR/$domain.key"
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
