#!/usr/bin/env python3
"""
Test Kafka Script
Скрипт для тестирования отправки сообщений в Kafka
"""

import json
import time
from confluent_kafka import Producer
from loguru import logger

def delivery_report(err, msg):
    """Callback для подтверждения доставки сообщения"""
    if err is not None:
        logger.error(f'Ошибка доставки сообщения: {err}')
    else:
        logger.info(f'Сообщение доставлено в {msg.topic()} [{msg.partition()}]')

def test_kafka_producer():
    """Тестирование Kafka producer"""
    
    # Конфигурация producer
    config = {
        'bootstrap.servers': 'localhost:9092',
        'client.id': 'test_producer'
    }
    
    # Создание producer
    producer = Producer(config)
    
    # Тестовые сообщения
    test_messages = [
        {
            "event_type": "client_created",
            "data": {
                "full_name": "Иван Иванов",
                "email": "ivan@example.com",
                "phone": "+7 999 123-45-67",
                "status": "CREATED"
            }
        },
        {
            "event_type": "finance_operation",
            "data": {
                "amount": 10000.50,
                "description": "Оплата за обучение",
                "date": "2024-01-15",
                "cash_desk_name": "Основная касса"
            }
        },
        {
            "event_type": "worker_status",
            "data": {
                "full_name": "Петр Петров",
                "position": "Менеджер",
                "is_active": True
            }
        }
    ]
    
    topic = 'crm_notifications'
    
    logger.info(f"Отправка тестовых сообщений в топик: {topic}")
    
    for i, message in enumerate(test_messages, 1):
        try:
            # Сериализация сообщения
            message_json = json.dumps(message, ensure_ascii=False)
            
            # Отправка сообщения
            producer.produce(
                topic=topic,
                value=message_json.encode('utf-8'),
                callback=delivery_report
            )
            
            logger.info(f"Отправлено сообщение {i}: {message['event_type']}")
            
            # Небольшая пауза между сообщениями
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Ошибка отправки сообщения {i}: {e}")
    
    # Ожидание доставки всех сообщений
    producer.flush()
    logger.info("Тестирование завершено")

if __name__ == "__main__":
    test_kafka_producer()
