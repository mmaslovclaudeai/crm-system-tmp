#!/bin/bash

# Скрипт для инициализации Kafka топиков
# Ждем, пока Kafka станет доступной

echo "Ожидание запуска Kafka..."

# Ждем, пока Kafka станет доступной
until kafka-topics --bootstrap-server kafka:9092 --list > /dev/null 2>&1; do
    echo "Kafka еще не готова, ждем..."
    sleep 5
done

echo "Kafka готова! Создаем топики..."

# Создаем топик для успешных операций
kafka-topics --bootstrap-server kafka:9092 \
    --create \
    --topic crm-msgAccepted \
    --partitions 1 \
    --replication-factor 1 \
    --if-not-exists

# Создаем топик для ошибок
kafka-topics --bootstrap-server kafka:9092 \
    --create \
    --topic crm-msgError \
    --partitions 1 \
    --replication-factor 1 \
    --if-not-exists

# Топик crm_notifications удален - теперь используем только crm-msgAccepted и crm-msgError

echo "Топики созданы успешно!"
echo "Список топиков:"
kafka-topics --bootstrap-server kafka:9092 --list
