#!/usr/bin/env python3
"""
Telegram Bot Service
Сервис для обработки сообщений из Kafka и отправки уведомлений в Telegram
"""

import asyncio
import os
import signal
import sys
from typing import Dict, Any
from loguru import logger
from dotenv import load_dotenv

# Импорт наших модулей
from kafka_client import KafkaClient
from telegram_client import TelegramClient

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logger.add(
    "logs/telegrambot.log",
    rotation="1 day",
    retention="7 days",
    level="INFO",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
)

class TelegramBotService:
    """Основной класс сервиса Telegram бота"""
    
    def __init__(self):
        # Конфигурация Kafka
        self.kafka_brokers = os.getenv("KAFKA_BROKERS", "kafka:29092")
        self.kafka_topic = os.getenv("KAFKA_TOPIC", "crm-msgAccepted")
        self.kafka_group_id = os.getenv("KAFKA_GROUP_ID", "telegram_bot_group")
        
        # Конфигурация Telegram
        self.telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID")
        
        # Клиенты
        self.kafka_client: KafkaClient = None
        self.telegram_client: TelegramClient = None
        
        # Флаг для graceful shutdown
        self.running = False
        
        # Проверка конфигурации
        if not self.telegram_token:
            logger.warning("TELEGRAM_BOT_TOKEN не установлен")
        
        if not self.telegram_chat_id:
            logger.warning("TELEGRAM_CHAT_ID не установлен")
    
    async def start(self):
        """Запуск сервиса"""
        logger.info("Запуск Telegram Bot Service...")
        
        try:
            # Инициализация клиентов
            await self.setup_kafka_consumer()
            await self.setup_telegram_bot()
            
            # Проверка подключения к Telegram
            await self.test_telegram_connection()
            
            logger.info("Telegram Bot Service успешно запущен")
            
            # Установка обработчика сигналов для graceful shutdown
            self.setup_signal_handlers()
            
            # Бесконечный цикл для обработки сообщений
            self.running = True
            await self.kafka_client.start_consuming()
                
        except Exception as e:
            logger.error(f"Ошибка при запуске сервиса: {e}")
            raise
        finally:
            await self.cleanup()
    
    def setup_signal_handlers(self):
        """Настройка обработчиков сигналов"""
        def signal_handler(signum, frame):
            logger.info(f"Получен сигнал {signum}, начинаем graceful shutdown...")
            self.running = False
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def setup_kafka_consumer(self):
        """Настройка Kafka consumer"""
        logger.info(f"Настройка Kafka consumer для брокеров: {self.kafka_brokers}")
        
        self.kafka_client = KafkaClient(
            brokers=self.kafka_brokers,
            topic=self.kafka_topic,
            group_id=self.kafka_group_id
        )
        
        # Установка обработчика сообщений
        self.kafka_client.set_message_handler(self.process_message)
        
        logger.info(f"✅ Kafka consumer настроен для топика: {self.kafka_topic}")
    
    async def setup_telegram_bot(self):
        """Настройка Telegram бота"""
        logger.info("Настройка Telegram бота")
        
        if not self.telegram_token or not self.telegram_chat_id:
            logger.warning("Telegram бот не настроен - уведомления отправляться не будут")
            return
        
        self.telegram_client = TelegramClient(
            token=self.telegram_token,
            chat_id=self.telegram_chat_id
        )
        
        await self.telegram_client.setup()
        logger.info("Telegram бот настроен")
    
    async def test_telegram_connection(self):
        """Тестирование подключения к Telegram"""
        if not self.telegram_client:
            logger.warning("Telegram клиент не настроен")
            return
        
        try:
            bot_info = await self.telegram_client.get_me()
            if bot_info:
                logger.info(f"Подключение к Telegram успешно. Бот: @{bot_info.get('username', 'Unknown')}")
            else:
                logger.error("Не удалось получить информацию о боте")
        except Exception as e:
            logger.error(f"Ошибка тестирования подключения к Telegram: {e}")
    
    async def process_message(self, message: Dict[str, Any]):
        """Обработка сообщений из Kafka (только crm-msgAccepted)"""
        logger.info(f"Обработка сообщения из crm-msgAccepted: {message}")
        
        try:
            # Извлечение типа события и данных
            event_type = message.get("event_type")
            data = message.get("data", {})
            
            if not event_type:
                logger.warning("Сообщение не содержит event_type")
                return
            
            # Форматирование и отправка уведомления
            if self.telegram_client:
                notification_text = self.telegram_client.format_notification(event_type, data)
                # Отправляем сообщение в топик "Alerts"
                success = await self.telegram_client.send_message_to_topic(notification_text, "Alerts")
                
                if success:
                    logger.info(f"✅ Уведомление отправлено в Telegram топик 'Alerts' для события: {event_type}")
                else:
                    logger.error(f"❌ Не удалось отправить уведомление для события: {event_type}")
            else:
                logger.warning("Telegram клиент не настроен, уведомление не отправлено")
                
        except Exception as e:
            logger.error(f"Ошибка обработки сообщения: {e}")
    
    async def cleanup(self):
        """Очистка ресурсов при завершении"""
        logger.info("Очистка ресурсов...")
        
        if self.kafka_client:
            await self.kafka_client.stop()
        
        if self.telegram_client:
            await self.telegram_client.close()
        
        logger.info("Ресурсы очищены")

async def main():
    """Главная функция"""
    service = TelegramBotService()
    await service.start()

if __name__ == "__main__":
    # Создание директории для логов
    os.makedirs("logs", exist_ok=True)
    
    # Запуск сервиса
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Сервис остановлен пользователем")
    except Exception as e:
        logger.error(f"Критическая ошибка: {e}")
        sys.exit(1)
