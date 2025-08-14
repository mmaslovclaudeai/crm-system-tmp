# 🚀 Быстрый старт Kubernetes

## ✅ Чек-лист развертывания

### Предварительные требования
- [ ] Kubernetes кластер 1.24+
- [ ] kubectl настроен
- [ ] Container registry доступен
- [ ] Helm установлен (опционально)

### 1. Подготовка образов
```bash
# Сборка
docker build -t your-registry/crm-backend:latest ./backend
docker build -t your-registry/crm-frontend:latest ./frontend  
docker build -t your-registry/crm-telegrambot:latest ./services/telegrambot

# Push
docker push your-registry/crm-backend:latest
docker push your-registry/crm-frontend:latest
docker push your-registry/crm-telegrambot:latest
```

### 2. Создание namespace
```bash
kubectl create namespace crm-system
```

### 3. Секреты
```bash
# PostgreSQL
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD="secure-password" \
  --from-literal=POSTGRES_USER="crm_user" \
  --from-literal=POSTGRES_DB="crm_dev" \
  -n crm-system

# JWT
kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET="your-jwt-secret" \
  -n crm-system

# Telegram
kubectl create secret generic telegram-secret \
  --from-literal=TELEGRAM_BOT_TOKEN="your-bot-token" \
  --from-literal=TELEGRAM_CHAT_ID="your-chat-id" \
  -n crm-system
```

### 4. Развертывание (по порядку)
```bash
# 1. База данных
kubectl apply -f k8s/persistent-volumes/
kubectl apply -f k8s/persistent-volume-claims/
kubectl apply -f k8s/deployments/postgres-deployment.yaml
kubectl apply -f k8s/services/postgres-service.yaml

# 2. Kafka
kubectl apply -f k8s/deployments/zookeeper-deployment.yaml
kubectl apply -f k8s/deployments/kafka-deployment.yaml
kubectl apply -f k8s/services/zookeeper-service.yaml
kubectl apply -f k8s/services/kafka-service.yaml

# 3. Мониторинг
kubectl apply -f k8s/deployments/loki-deployment.yaml
kubectl apply -f k8s/deployments/promtail-daemonset.yaml
kubectl apply -f k8s/deployments/grafana-deployment.yaml

# 4. Приложения
kubectl apply -f k8s/deployments/backend-deployment.yaml
kubectl apply -f k8s/deployments/frontend-deployment.yaml
kubectl apply -f k8s/deployments/telegrambot-deployment.yaml

# 5. Сервисы
kubectl apply -f k8s/services/

# 6. Ingress
kubectl apply -f k8s/ingress/
```

### 5. Проверка
```bash
# Статус подов
kubectl get pods -n crm-system

# Сервисы
kubectl get services -n crm-system

# Ingress
kubectl get ingress -n crm-system
```

## 🔧 Ключевые конфигурации

### Переменные окружения
- `DB_HOST`: `postgres-service`
- `KAFKA_BROKERS`: `kafka-service:9092`
- `NODE_ENV`: `production`

### Порты
- Frontend: 3000
- Backend: 5001
- PostgreSQL: 5432
- Kafka: 9092
- Grafana: 3000
- Loki: 3100

### Ресурсы (рекомендуемые)
- Backend: 512Mi RAM, 250m CPU
- Frontend: 256Mi RAM, 100m CPU
- PostgreSQL: 1Gi RAM, 500m CPU
- Kafka: 1Gi RAM, 500m CPU

## 🚨 Частые проблемы

### Поды не запускаются
```bash
kubectl describe pod <pod-name> -n crm-system
kubectl logs <pod-name> -n crm-system
```

### Проблемы с сетью
```bash
kubectl get endpoints -n crm-system
kubectl describe service <service-name> -n crm-system
```

### Проблемы с базой данных
```bash
kubectl exec -it deployment/postgres -n crm-system -- psql -U crm_user -d crm_dev
```

## 📊 Мониторинг

### Доступ к сервисам
- **Frontend**: `http://your-domain`
- **Backend API**: `http://your-domain/api`
- **Grafana**: `http://your-domain/grafana` (admin/admin123)
- **Kafka UI**: `http://your-domain/kafka-ui`

### Логи
```bash
# Централизованные логи
kubectl logs -l app=backend -n crm-system
kubectl logs -l app=telegrambot -n crm-system

# Grafana Loki
# Запрос: {namespace="crm-system"}
```

## 🔄 Обновление

### Rolling Update
```bash
kubectl set image deployment/backend backend=your-registry/crm-backend:v2.0.0 -n crm-system
kubectl rollout status deployment/backend -n crm-system
```

### Масштабирование
```bash
kubectl scale deployment backend --replicas=3 -n crm-system
```

---

**Для полной документации см.**: `KUBERNETES_DEPLOYMENT.md`
