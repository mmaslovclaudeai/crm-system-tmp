FROM python:3.11-alpine

# Установка системных зависимостей
RUN apk add --no-cache \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    openssl-dev \
    librdkafka-dev \
    librdkafka

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY requirements.txt .

# Установка Python зависимостей с обходом прокси
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt

# Копирование исходного кода
COPY . .

# Создание директории для логов
RUN mkdir -p logs && chmod 755 logs

# Создание пользователя для безопасности (Alpine Linux)
RUN adduser -D -s /bin/sh app && chown -R app:app /app
USER app

# Открытие порта
EXPOSE 8000

# Команда запуска
CMD ["python", "main.py"]
