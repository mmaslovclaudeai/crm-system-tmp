"""
Telegram Client Module
Модуль для работы с Telegram Bot API
"""

import asyncio
import os
from typing import Dict, Any, Optional
from loguru import logger
import aiohttp

class TelegramClient:
    """Клиент для работы с Telegram Bot API"""
    
    def __init__(self, token: str, chat_id: str):
        self.token = token
        self.chat_id = chat_id
        self.base_url = f"https://api.telegram.org/bot{token}"
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def setup(self):
        """Настройка HTTP сессии"""
        if not self.session:
            self.session = aiohttp.ClientSession()
            logger.info("HTTP сессия для Telegram API создана")
    
    async def close(self):
        """Закрытие HTTP сессии"""
        if self.session:
            await self.session.close()
            self.session = None
            logger.info("HTTP сессия для Telegram API закрыта")
    
    async def send_message(self, text: str, parse_mode: str = "HTML", message_thread_id: int = None) -> bool:
        """Отправка текстового сообщения"""
        if not self.token or not self.chat_id:
            logger.warning("Не удалось отправить сообщение: не настроен Telegram бот")
            return False
        
        await self.setup()
        
        try:
            url = f"{self.base_url}/sendMessage"
            data = {
                "chat_id": self.chat_id,
                "text": text,
                "parse_mode": parse_mode
            }
            
            # Добавляем message_thread_id если указан (для форумов)
            if message_thread_id:
                data["message_thread_id"] = message_thread_id
            
            async with self.session.post(url, json=data) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("ok"):
                        logger.info(f"Сообщение отправлено в Telegram: {text[:50]}...")
                        return True
                    else:
                        logger.error(f"Ошибка Telegram API: {result}")
                        return False
                else:
                    logger.error(f"HTTP ошибка при отправке сообщения: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Ошибка отправки сообщения в Telegram: {e}")
            return False
    
    async def send_photo(self, photo_url: str, caption: str = "", parse_mode: str = "HTML") -> bool:
        """Отправка фото с подписью"""
        if not self.token or not self.chat_id:
            logger.warning("Не удалось отправить фото: не настроен Telegram бот")
            return False
        
        await self.setup()
        
        try:
            url = f"{self.base_url}/sendPhoto"
            data = {
                "chat_id": self.chat_id,
                "photo": photo_url,
                "caption": caption,
                "parse_mode": parse_mode
            }
            
            async with self.session.post(url, json=data) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("ok"):
                        logger.info(f"Фото отправлено в Telegram: {caption[:50]}...")
                        return True
                    else:
                        logger.error(f"Ошибка Telegram API: {result}")
                        return False
                else:
                    logger.error(f"HTTP ошибка при отправке фото: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Ошибка отправки фото в Telegram: {e}")
            return False
    
    async def send_document(self, document_url: str, caption: str = "") -> bool:
        """Отправка документа"""
        if not self.token or not self.chat_id:
            logger.warning("Не удалось отправить документ: не настроен Telegram бот")
            return False
        
        await self.setup()
        
        try:
            url = f"{self.base_url}/sendDocument"
            data = {
                "chat_id": self.chat_id,
                "document": document_url,
                "caption": caption
            }
            
            async with self.session.post(url, json=data) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("ok"):
                        logger.info(f"Документ отправлен в Telegram: {caption[:50]}...")
                        return True
                    else:
                        logger.error(f"Ошибка Telegram API: {result}")
                        return False
                else:
                    logger.error(f"HTTP ошибка при отправке документа: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"Ошибка отправки документа в Telegram: {e}")
            return False
    
    async def get_me(self) -> Optional[Dict[str, Any]]:
        """Получение информации о боте"""
        if not self.token:
            logger.warning("Не удалось получить информацию о боте: токен не настроен")
            return None
        
        await self.setup()
        
        try:
            url = f"{self.base_url}/getMe"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("ok"):
                        bot_info = result.get("result", {})
                        logger.info(f"Информация о боте: {bot_info.get('username', 'Unknown')}")
                        return bot_info
                    else:
                        logger.error(f"Ошибка Telegram API: {result}")
                        return None
                else:
                    logger.error(f"HTTP ошибка при получении информации о боте: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Ошибка получения информации о боте: {e}")
            return None
    
    async def create_forum_topic(self, name: str, icon_color: int = 13338331, icon_custom_emoji_id: str = "5960716412669399009") -> Optional[int]:
        """Создание топика в форуме"""
        if not self.token or not self.chat_id:
            logger.warning("Не удалось создать топик: не настроен Telegram бот")
            return None
        
        await self.setup()
        
        try:
            url = f"{self.base_url}/createForumTopic"
            data = {
                "chat_id": self.chat_id,
                "name": name,
                "icon_color": icon_color,
                "icon_custom_emoji_id": icon_custom_emoji_id
            }
            
            async with self.session.post(url, json=data) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get("ok"):
                        message_thread_id = result.get("result", {}).get("message_thread_id")
                        logger.info(f"Топик '{name}' создан с ID: {message_thread_id}")
                        return message_thread_id
                    else:
                        logger.error(f"Ошибка Telegram API при создании топика: {result}")
                        return None
                else:
                    logger.error(f"HTTP ошибка при создании топика: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Ошибка создания топика: {e}")
            return None
    
    async def send_message_to_topic(self, text: str, topic_name: str = "Alerts", parse_mode: str = "HTML") -> bool:
        """Отправка сообщения в конкретный топик форума"""
        # Для топика "Alerts" используем ID 2 (из вашего примера)
        message_thread_id = 2
        
        return await self.send_message(text, parse_mode, message_thread_id)
    
    def format_notification(self, event_type: str, data: Dict[str, Any]) -> str:
        """Форматирование уведомления для Telegram (только клиенты)"""
        if event_type == "client_created":
            status = data.get('status', 'Не указан')
            
            return f"""
🆕 <b>Новый клиент создан</b>

👤 <b>Имя:</b> {data.get('full_name', 'Не указано')}
📧 <b>Email:</b> {data.get('email', 'Не указан')}
📱 <b>Телефон:</b> {data.get('phone', 'Не указан')}
📊 <b>Статус:</b> ✅ {status}
🆔 <b>ID:</b> {data.get('client_id', 'Не указан')}
            """.strip()
        
        elif event_type == "client_status_changed":
            old_status = data.get('old_status', 'Не указан')
            new_status = data.get('new_status', 'Не указан')
            
            return f"""
🔄 <b>Изменение статуса клиента</b>

👤 <b>Имя:</b> {data.get('full_name', 'Не указано')}
📧 <b>Email:</b> {data.get('email', 'Не указан')}
📱 <b>Телефон:</b> {data.get('phone', 'Не указан')}
🔄 <b>Изменение:</b> {old_status} → {new_status}
🆔 <b>ID:</b> {data.get('client_id', 'Не указан')}
            """.strip()
        
        else:
            return f"""
📢 <b>Уведомление о клиенте</b>

Тип: {event_type}
Данные: {data}
            """.strip()
