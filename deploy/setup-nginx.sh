#!/bin/bash

# 🚀 CRM System - Nginx Setup Script

set -e

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

# Проверка root прав
if [[ $EUID -ne 0 ]]; then
   error "Этот скрипт должен быть запущен с правами root"
fi

PROJECT_DIR="/opt/crm-system"

log "🚀 Настраиваем nginx для CRM системы"

# Остановка nginx
log "⏹️ Останавливаем nginx"
systemctl stop nginx

# Создание директорий для логов
log "📁 Создаем директории для логов"
mkdir -p /var/log/nginx

# Копирование основной конфигурации nginx
log "📋 Копируем основную конфигурацию nginx"
cp "$PROJECT_DIR/deploy/nginx/nginx.conf" /etc/nginx/nginx.conf

# Создание конфигураций для доменов
log "📝 Создаем конфигурации доменов"

# Frontend конфигурация
cat > "/etc/nginx/sites-available/admin.stage.seniorpomidornaya.ru" << 'EOF'
server {
    listen 80;
    server_name admin.stage.seniorpomidornaya.ru;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.stage.seniorpomidornaya.ru;

    # SSL Configuration (временно отключено для получения сертификатов)
    # ssl_certificate /opt/crm-system/ssl/certs/admin.stage.seniorpomidornaya.ru.crt;
    # ssl_certificate_key /opt/crm-system/ssl/certs/admin.stage.seniorpomidornaya.ru.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Frontend static files
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logs
    access_log /var/log/nginx/admin.stage.seniorpomidornaya.ru.access.log;
    error_log /var/log/nginx/admin.stage.seniorpomidornaya.ru.error.log;
}
EOF

# Grafana конфигурация
cat > "/etc/nginx/sites-available/grafana.stage.seniorpomidornaya.ru" << 'EOF'
server {
    listen 80;
    server_name grafana.stage.seniorpomidornaya.ru;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name grafana.stage.seniorpomidornaya.ru;

    # SSL Configuration (временно отключено для получения сертификатов)
    # ssl_certificate /opt/crm-system/ssl/certs/grafana.stage.seniorpomidornaya.ru.crt;
    # ssl_certificate_key /opt/crm-system/ssl/certs/grafana.stage.seniorpomidornaya.ru.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Grafana proxy
    location / {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Grafana specific headers
        proxy_set_header X-Grafana-Org-Id $http_x_grafana_org_id;
    }

    # Logs
    access_log /var/log/nginx/grafana.stage.seniorpomidornaya.ru.access.log;
    error_log /var/log/nginx/grafana.stage.seniorpomidornaya.ru.error.log;
}
EOF

# Kafka UI конфигурация
cat > "/etc/nginx/sites-available/kafka-ui.stage.seniorpomidornaya.ru" << 'EOF'
server {
    listen 80;
    server_name kafka-ui.stage.seniorpomidornaya.ru;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kafka-ui.stage.seniorpomidornaya.ru;

    # SSL Configuration (временно отключено для получения сертификатов)
    # ssl_certificate /opt/crm-system/ssl/certs/kafka-ui.stage.seniorpomidornaya.ru.crt;
    # ssl_certificate_key /opt/crm-system/ssl/certs/kafka-ui.stage.seniorpomidornaya.ru.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Kafka UI proxy
    location / {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Logs
    access_log /var/log/nginx/kafka-ui.stage.seniorpomidornaya.ru.access.log;
    error_log /var/log/nginx/kafka-ui.stage.seniorpomidornaya.ru.error.log;
}
EOF

# Активация сайтов
log "🔗 Активируем конфигурации сайтов"
ln -sf "/etc/nginx/sites-available/admin.stage.seniorpomidornaya.ru" "/etc/nginx/sites-enabled/"
ln -sf "/etc/nginx/sites-available/grafana.stage.seniorpomidornaya.ru" "/etc/nginx/sites-enabled/"
ln -sf "/etc/nginx/sites-available/kafka-ui.stage.seniorpomidornaya.ru" "/etc/nginx/sites-enabled/"

# Удаление дефолтной конфигурации
rm -f /etc/nginx/sites-enabled/default

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

log "✅ Nginx настроен успешно!"
log "📋 Конфигурации созданы для:"
log "   - admin.stage.seniorpomidornaya.ru"
log "   - grafana.stage.seniorpomidornaya.ru"
log "   - kafka-ui.stage.seniorpomidornaya.ru"
log ""
log "⚠️  SSL сертификаты временно отключены"
log "🔄 Следующий шаг: настройка SSL сертификатов"
