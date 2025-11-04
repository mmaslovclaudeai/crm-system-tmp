# Этап сборки
FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем переменные окружения для сборки
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая devDependencies для сборки)
RUN npm ci --no-audit --no-fund

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Проверяем, что сборка прошла успешно
RUN test -d dist && test -d dist/assets && echo "Build successful" || (echo "Build failed: dist directory is empty or missing assets" && exit 1)

# Этап продакшена
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx (будет перезаписана volume mount в docker-compose, если есть)
COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
