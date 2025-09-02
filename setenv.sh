log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "Этот скрипт создает .env файл для настройки окружения"

sleep 1

info "#                                       10%"

sleep 1

info "####################                    50%"

sleep 1

info "####################################### 100%"

cat > .env << 'EOF'
# 🚀 CRM System - Environment Variables
# ========================================
# DATABASE CONFIGURATION
# ========================================
DB_NAME=db
DB_USER=postgres
DB_PASSWORD=
DB_HOST=postgres
DB_PORT=5432
# ========================================
# JWT CONFIGURATION
# ========================================
JWT_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=3d
# ========================================
# SERVER CONFIGURATION
# ========================================
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
