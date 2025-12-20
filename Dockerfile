# Базовый образ
FROM nginx:alpine

# Установка рабочей директории
WORKDIR /usr/share/nginx/html

# Копирование статических файлов
COPY public/ .

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Настройка прав
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Открытие порта
EXPOSE 80

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]
