# 🚀 Развертывание CRM системы в Kubernetes

## 📋 Обзор

Данное руководство описывает процесс развертывания CRM системы в Kubernetes кластере. Система включает в себя:

- **Frontend** (React/Vite)
- **Backend API** (Node.js/Express)
- **PostgreSQL** (База данных)
- **Kafka** + **Zookeeper** (Очереди сообщений)
- **Telegram Bot** (Уведомления)
- **Grafana** + **Loki** + **Promtail** (Мониторинг и логирование)
- **Kafka UI** (Веб-интерфейс для Kafka)

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   PostgreSQL    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │     Kafka       │              │
         │              │   + Zookeeper   │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       │
┌─────────────────┐    ┌─────────────────┐              │
│   Grafana       │    │  Telegram Bot   │              │
│   + Loki        │    │   (Python)      │              │
│   + Promtail    │    └─────────────────┘              │
└─────────────────┘                                     │
                                                        │
┌─────────────────┐                                     │
│   Kafka UI      │◄────────────────────────────────────┘
└─────────────────┘
```

## 📁 Структура Kubernetes манифестов

```
k8s/
├── namespaces/
│   └── crm-system.yaml
├── configmaps/
│   ├── postgres-config.yaml
│   ├── kafka-config.yaml
│   ├── loki-config.yaml
│   ├── promtail-config.yaml
│   └── grafana-config.yaml
├── secrets/
│   ├── postgres-secret.yaml
│   ├── jwt-secret.yaml
│   └── telegram-secret.yaml
├── persistent-volumes/
│   ├── postgres-pv.yaml
│   ├── kafka-pv.yaml
│   ├── loki-pv.yaml
│   └── grafana-pv.yaml
├── persistent-volume-claims/
│   ├── postgres-pvc.yaml
│   ├── kafka-pvc.yaml
│   ├── loki-pvc.yaml
│   └── grafana-pvc.yaml
├── deployments/
│   ├── postgres-deployment.yaml
│   ├── zookeeper-deployment.yaml
│   ├── kafka-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── telegrambot-deployment.yaml
│   ├── loki-deployment.yaml
│   ├── promtail-daemonset.yaml
│   └── grafana-deployment.yaml
├── services/
│   ├── postgres-service.yaml
│   ├── zookeeper-service.yaml
│   ├── kafka-service.yaml
│   ├── backend-service.yaml
│   ├── frontend-service.yaml
│   ├── loki-service.yaml
│   └── grafana-service.yaml
├── ingress/
│   └── crm-ingress.yaml
├── jobs/
│   ├── kafka-init-job.yaml
│   └── postgres-init-job.yaml
└── monitoring/
    ├── service-monitors.yaml
    └── grafana-dashboards.yaml
```

## 🔧 Предварительные требования

### 1. Kubernetes кластер
- **Версия**: 1.24+
- **Ресурсы**: Минимум 4 CPU, 8GB RAM
- **Storage**: Поддержка PersistentVolumes

### 2. Инструменты
```bash
# Установка kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Установка helm (опционально)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 3. Container Registry
- **Docker Hub** или **Private Registry**
- Доступ для push/pull образов

## 🚀 Пошаговое развертывание

### Шаг 1: Подготовка образов

```bash
# Сборка образов
docker build -t your-registry/crm-backend:latest ./backend
docker build -t your-registry/crm-frontend:latest ./frontend
docker build -t your-registry/crm-telegrambot:latest ./services/telegrambot

# Push в registry
docker push your-registry/crm-backend:latest
docker push your-registry/crm-frontend:latest
docker push your-registry/crm-telegrambot:latest
```

### Шаг 2: Создание namespace

```bash
kubectl apply -f k8s/namespaces/crm-system.yaml
```

### Шаг 3: Настройка секретов

```bash
# Создание секретов
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD="your-secure-password" \
  --from-literal=POSTGRES_USER="crm_user" \
  --from-literal=POSTGRES_DB="crm_dev" \
  -n crm-system

kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET="your-jwt-secret-key" \
  -n crm-system

kubectl create secret generic telegram-secret \
  --from-literal=TELEGRAM_BOT_TOKEN="your-bot-token" \
  --from-literal=TELEGRAM_CHAT_ID="your-chat-id" \
  -n crm-system
```

### Шаг 4: Развертывание базы данных

```bash
# PostgreSQL
kubectl apply -f k8s/persistent-volumes/postgres-pv.yaml
kubectl apply -f k8s/persistent-volume-claims/postgres-pvc.yaml
kubectl apply -f k8s/deployments/postgres-deployment.yaml
kubectl apply -f k8s/services/postgres-service.yaml

# Инициализация БД
kubectl apply -f k8s/jobs/postgres-init-job.yaml
```

### Шаг 5: Развертывание Kafka

```bash
# Zookeeper
kubectl apply -f k8s/deployments/zookeeper-deployment.yaml
kubectl apply -f k8s/services/zookeeper-service.yaml

# Kafka
kubectl apply -f k8s/persistent-volumes/kafka-pv.yaml
kubectl apply -f k8s/persistent-volume-claims/kafka-pvc.yaml
kubectl apply -f k8s/deployments/kafka-deployment.yaml
kubectl apply -f k8s/services/kafka-service.yaml

# Инициализация топиков
kubectl apply -f k8s/jobs/kafka-init-job.yaml
```

### Шаг 6: Развертывание мониторинга

```bash
# Loki
kubectl apply -f k8s/persistent-volumes/loki-pv.yaml
kubectl apply -f k8s/persistent-volume-claims/loki-pvc.yaml
kubectl apply -f k8s/configmaps/loki-config.yaml
kubectl apply -f k8s/deployments/loki-deployment.yaml
kubectl apply -f k8s/services/loki-service.yaml

# Promtail
kubectl apply -f k8s/configmaps/promtail-config.yaml
kubectl apply -f k8s/deployments/promtail-daemonset.yaml

# Grafana
kubectl apply -f k8s/persistent-volumes/grafana-pv.yaml
kubectl apply -f k8s/persistent-volume-claims/grafana-pvc.yaml
kubectl apply -f k8s/configmaps/grafana-config.yaml
kubectl apply -f k8s/deployments/grafana-deployment.yaml
kubectl apply -f k8s/services/grafana-service.yaml
```

### Шаг 7: Развертывание приложений

```bash
# Backend API
kubectl apply -f k8s/deployments/backend-deployment.yaml
kubectl apply -f k8s/services/backend-service.yaml

# Frontend
kubectl apply -f k8s/deployments/frontend-deployment.yaml
kubectl apply -f k8s/services/frontend-service.yaml

# Telegram Bot
kubectl apply -f k8s/deployments/telegrambot-deployment.yaml
```

### Шаг 8: Настройка Ingress

```bash
kubectl apply -f k8s/ingress/crm-ingress.yaml
```

## 🔍 Проверка развертывания

```bash
# Проверка статуса подов
kubectl get pods -n crm-system

# Проверка сервисов
kubectl get services -n crm-system

# Проверка ingress
kubectl get ingress -n crm-system

# Логи приложений
kubectl logs -f deployment/backend -n crm-system
kubectl logs -f deployment/telegrambot -n crm-system
```

## 📊 Мониторинг и логирование

### Grafana
- **URL**: `http://your-domain/grafana`
- **Логин**: `admin`
- **Пароль**: Из секрета `grafana-admin-password`

### Loki
- **URL**: `http://loki-service:3100`
- **Запросы**: `{namespace="crm-system"}`

### Kafka UI
- **URL**: `http://your-domain/kafka-ui`

## 🔧 Конфигурация

### Переменные окружения

Основные переменные для настройки:

```yaml
# Backend
NODE_ENV: production
PORT: 5001
DB_HOST: postgres-service
DB_PORT: 5432
JWT_SECRET: ${JWT_SECRET}
KAFKA_BROKERS: kafka-service:9092

# Frontend
VITE_API_URL: https://your-domain/api
VITE_WS_URL: wss://your-domain

# Telegram Bot
TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID}
KAFKA_BROKERS: kafka-service:9092
```

### Ресурсы

Рекомендуемые ресурсы для production:

```yaml
# Backend
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"

# Frontend
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "200m"

# PostgreSQL
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

## 🔒 Безопасность

### 1. Секреты
- Все чувствительные данные хранятся в Kubernetes Secrets
- Используйте внешние системы управления секретами (HashiCorp Vault, AWS Secrets Manager)

### 2. Сеть
- Используйте Network Policies для ограничения трафика
- Настройте TLS для всех внешних соединений

### 3. RBAC
- Настройте минимальные права доступа
- Используйте Service Accounts для подов

## 📈 Масштабирование

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Вертикальное масштабирование

```bash
# Увеличение ресурсов
kubectl patch deployment backend -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"requests":{"memory":"1Gi","cpu":"500m"},"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}' -n crm-system
```

## 🛠️ Обновление

### Rolling Update

```bash
# Обновление образа
kubectl set image deployment/backend backend=your-registry/crm-backend:v2.0.0 -n crm-system

# Проверка статуса
kubectl rollout status deployment/backend -n crm-system
```

### Blue-Green Deployment

```yaml
# Создание нового deployment
kubectl apply -f k8s/deployments/backend-v2-deployment.yaml

# Переключение трафика
kubectl patch service backend-service -p '{"spec":{"selector":{"version":"v2"}}}' -n crm-system
```

## 🚨 Troubleshooting

### Частые проблемы

1. **Поды не запускаются**
   ```bash
   kubectl describe pod <pod-name> -n crm-system
   kubectl logs <pod-name> -n crm-system
   ```

2. **Проблемы с базой данных**
   ```bash
   kubectl exec -it deployment/postgres -n crm-system -- psql -U crm_user -d crm_dev
   ```

3. **Проблемы с Kafka**
   ```bash
   kubectl exec -it deployment/kafka -n crm-system -- kafka-topics --list --bootstrap-server localhost:9092
   ```

4. **Проблемы с сетью**
   ```bash
   kubectl get endpoints -n crm-system
   kubectl describe service <service-name> -n crm-system
   ```

### Логи и мониторинг

```bash
# Централизованные логи
kubectl logs -l app=backend -n crm-system --tail=100

# Метрики
kubectl top pods -n crm-system
kubectl top nodes
```

## 📚 Дополнительные ресурсы

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Charts](https://helm.sh/docs/)
- [Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator)
- [Grafana Operator](https://github.com/grafana-operator/grafana-operator)

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте логи приложений
2. Убедитесь в корректности конфигурации
3. Проверьте ресурсы кластера
4. Обратитесь к документации Kubernetes

---

**Версия**: 1.0.0  
**Дата**: 2025-08-13  
**Автор**: DevOps Team
