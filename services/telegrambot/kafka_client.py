"""
Kafka Client Module
Модуль для работы с Apache Kafka
"""

import asyncio
import json
import os
from typing import Dict, Any, Callable
from loguru import logger
from kafka import KafkaConsumer
from kafka.errors import KafkaError

class KafkaClient:
    """Клиент для работы с Kafka"""
    
    def __init__(self, brokers: str, topic: str, group_id: str):
        self.brokers = brokers
        self.topic = topic
        self.group_id = group_id
        self.consumer = None
        self.running = False
        self.message_handler: Callable = None
    
    def setup_consumer(self):
        """Настройка Kafka consumer"""
        try:
            self.consumer = KafkaConsumer(
                self.topic,
                bootstrap_servers=self.brokers,
                group_id=self.group_id,
                auto_offset_reset='earliest',
                enable_auto_commit=True,
                auto_commit_interval_ms=1000,
                session_timeout_ms=30000,
                value_deserializer=lambda m: json.loads(m.decode('utf-8'))
            )
            logger.info(f"✅ Kafka consumer настроен для топика: {self.topic}")
        except Exception as e:
            logger.error(f"Ошибка настройки Kafka consumer: {e}")
            raise
    
    def set_message_handler(self, handler: Callable[[Dict[str, Any]], None]):
        """Установка обработчика сообщений"""
        self.message_handler = handler
        logger.info("Обработчик сообщений установлен")
    
    async def start_consuming(self):
        """Начало потребления сообщений"""
        if not self.consumer:
            self.setup_consumer()
        
        self.running = True
        logger.info("Начало потребления сообщений из Kafka")
        
        try:
            for message in self.consumer:
                if not self.running:
                    break
                
                try:
                    message_data = message.value
                    logger.info(f"Получено сообщение: {message_data}")
                    
                    if self.message_handler:
                        # Синхронная обработка сообщения
                        await self._handle_message(message_data)
                    
                except Exception as e:
                    logger.error(f"Ошибка обработки сообщения: {e}")
                
        except KeyboardInterrupt:
            logger.info("Получен сигнал остановки")
        except Exception as e:
            logger.error(f"Ошибка при потреблении сообщений: {e}")
        finally:
            await self.stop()
    
    async def _handle_message(self, message: Dict[str, Any]):
        """Асинхронная обработка сообщения"""
        try:
            if self.message_handler:
                await self.message_handler(message)
        except Exception as e:
            logger.error(f"Ошибка в обработчике сообщений: {e}")
    
    async def stop(self):
        """Остановка consumer"""
        self.running = False
        if self.consumer:
            self.consumer.close()
            logger.info("Kafka consumer остановлен")
    
    def send_message(self, topic: str, message: Dict[str, Any]):
        """Отправка сообщения в Kafka (для будущего использования)"""
        # TODO: Реализовать producer для отправки сообщений
        logger.info(f"Отправка сообщения в топик {topic}: {message}")
        pass
