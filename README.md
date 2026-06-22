# Kaspi product parser

Минимальное тестовое задание на NestJS. Приложение получает первую страницу
товаров из поиска Kaspi и сохраняет в MongoDB:

- название (`name`);
- цену в тенге (`price`);
- полную ссылку (`link`);
- дату парсинга (`parsedAt`).

## Запуск

Нужны Node.js 20+ и запущенная MongoDB.

```bash
npm install
export MONGODB_URI=mongodb://localhost:27017/kaspi-parser
npm run start:dev
```

Если `MONGODB_URI` не задан, используется адрес из примера выше.

## API

Запустить парсинг (по умолчанию запрос `iphone`):

```bash
curl -X POST "http://localhost:3000/products/parse?query=iphone"
```

Получить сохранённые товары:

```bash
curl "http://localhost:3000/products"
```

Каждый запуск создаёт новый снимок данных. Это сохраняет историю изменения цен
вместе с датой парсинга.
