# EcoBazar Frontend

Telegram Mini App для сервиса доставки с полной админ-панелью.

## Возможности

- 🛒 Каталог товаров с поиском и категориями
- 🛍️ Корзина покупок с учетом остатков
- 📱 Профиль пользователя и адреса доставки
- 📦 Отслеживание заказов в реальном времени
- 👨‍💼 Админ-панель для управления товарами, заказами, категориями
- 🔐 Авторизация через Telegram WebApp API

## Установка и запуск

### Предварительные требования

- Node.js >= 16
- npm или yarn
- Backend API сервер

### Настройка переменных окружения

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Отредактируйте `.env` и укажите адрес вашего API:
```env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_TEST_VALUE=2
```

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm start
# или
npm run dev
```

Откроется [http://localhost:3000](http://localhost:3000) для просмотра в браузере.

### Сборка для продакшена

```bash
npm run build
```

Сборка будет создана в папке `build/`.

### Линтинг кода

```bash
npm run lint
```

## Развертывание

### DigitalOcean App Platform (рекомендуется)

1. **Автоматический деплой через GitHub**:
   ```bash
   # Убедитесь что код загружен в GitHub репозиторий
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Создание приложения в DigitalOcean**:
   - Войдите в [DigitalOcean Control Panel](https://cloud.digitalocean.com)
   - Перейдите в раздел Apps
   - Нажмите "Create App"
   - Выберите GitHub и ваш репозиторий `ecobazar-frontend`
   - Выберите ветку `main`

3. **Настройка переменных окружения**:
   В настройках App добавьте:
   ```
   NODE_ENV=production
   REACT_APP_API_URL=https://your-api-domain.com/api
   REACT_APP_TEST_VALUE=2
   ```

4. **Деплой**:
   App Platform автоматически:
   - Установит зависимости (`npm install`)
   - Соберет приложение (`npm run build`)
   - Развернет статические файлы
   - Предоставит HTTPS URL

### Используя app.yaml (автоматическая настройка)

1. Файл `.do/app.yaml` уже настроен в проекте
2. При создании приложения выберите "Import from app spec"
3. Загрузите `.do/app.yaml`
4. Измените переменные окружения под ваши нужды

### Docker деплой

1. **Сборка образа**:
   ```bash
   docker build -t ecobazar-frontend .
   ```

2. **Запуск контейнера**:
   ```bash
   docker run -p 80:80 ecobazar-frontend
   ```

### Другие платформы

Приложение совместимо с любой платформой, поддерживающей статические сайты:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## Telegram WebApp настройка

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Установите WebApp URL через команду `/setmenubutton`
3. Укажите URL вашего развернутого приложения
4. Настройте webhook для бота (опционально)

## Архитектура

```
src/
├── admin/           # Компоненты админ-панели
├── components/      # Переиспользуемые компоненты
├── pages/          # Основные страницы приложения
├── api.ts          # Все API вызовы
├── TelegramMiniApp.tsx  # Основной компонент приложения
└── App.tsx         # Точка входа
```

## API Endpoints

Приложение ожидает следующие эндпоинты от backend:

- `POST /auth` - Авторизация по telegram_user_id
- `GET /user/me` - Получение профиля пользователя
- `GET /categories` - Получение категорий
- `GET /products` - Получение товаров
- `GET /orders/all` - Получение заказов пользователя
- `POST /orders` - Создание заказа
- И другие для админ-функций

## Troubleshooting

### Проблема: "We encountered an error when trying to load your application"

Это означает проблему с деплоем на DigitalOcean. Проверьте:

1. **Build логи**: В DigitalOcean Console → Apps → Your App → Activity → Build logs
2. **Runtime логи**: Apps → Your App → Runtime → View logs

**Частые решения**:
- Убедитесь что в `package.json` есть скрипт `"start": "node server.js"`
- Убедитесь что в зависимостях есть `express`
- Проверьте что port настроен через переменную `PORT`

### Проблема: "API_URL не определён"

Убедитесь, что:
1. Файл `.env` создан и содержит `REACT_APP_API_URL`
2. Переменная окружения начинается с `REACT_APP_`
3. После изменения `.env` перезапустите dev-сервер

### Проблема: "Cannot read properties of undefined (reading 'user')"

Убедитесь, что:
1. В `public/index.html` подключен скрипт Telegram WebApp
2. Приложение запущено внутри Telegram (не в обычном браузере)
3. Бот настроен корректно в BotFather

### Проблема: Бесконечная загрузка в Telegram

Приложение имеет fallback механизм для демонстрации:
- Автоматически использует тестовый userId если Telegram данные недоступны
- Время ожидания инициализации сокращено до 500ms
- В продакшене показывает тестовый интерфейс для демонстрации

## Лицензия

MIT

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
