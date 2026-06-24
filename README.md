# Автоматический Kaspi-парсер

NestJS-приложение каждые 5 секунд добавляет задачу парсинга в BullMQ/Redis.
Worker получает задачу, загружает товары Kaspi и сохраняет снимок данных в
MongoDB. NestJS пишет в Docker-логи добавление, запуск, завершение и ошибки job.

## Запуск в Docker

Нужен только Docker Desktop:

```bash
docker compose up --build
```

Будут запущены три сервиса: `app`, `redis`, `mongodb`. Данные Redis и MongoDB
сохраняются в Docker volumes после перезапуска контейнеров.

MongoDB и Redis также публикуются на хосте:

- MongoDB: `mongodb://localhost:27017`
- Redis: `localhost:6379`

Посмотреть логи приложения:

```bash
docker compose logs -f app
```

Остановить проект:

```bash
docker compose down
```

## Проверка

Не нужно ждать 30 минут: ручной запрос добавляет такую же задачу в Redis:

```bash
curl -X POST "http://localhost:3000/parse-queue?query=iphone"
```

Ответ содержит `jobId` и статус `queued`. После выполнения получить сохранённые
товары можно так:

```bash
curl "http://localhost:3000/products"
```

Старый синхронный endpoint также доступен:

```bash
curl -X POST "http://localhost:3000/products/parse?query=iphone"
```

## Настройки

Переменные можно указать в `.env` рядом с `docker-compose.yml`:

```dotenv
PARSE_QUERY=iphone
PARSE_CRON=*/5 * * * * *
PARSE_SLOT_MS=5000
```

`PARSE_CRON` — стандартное cron-выражение. Значение по умолчанию запускает
задачу каждые 5 секунд, что удобно для демонстрации. Если нужно вернуть
медленный режим, поменяйте выражение и `PARSE_SLOT_MS` вместе, например на
`*/30 * * * *` и `1800000`.

## Разработка

После изменения кода пересоберите и перезапустите приложение:

```bash
docker compose up -d --build app
```
