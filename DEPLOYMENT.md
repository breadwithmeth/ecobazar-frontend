# Инструкция по деплою EcoBazar Frontend

## Подготовка к деплою

### 1. Проверка кода
```bash
# Проверка сборки
npm run build

# Проверка работы в продакшн режиме
npm run preview
```

### 2. Настройка переменных окружения
Убедитесь что файл `.env.production` содержит правильные значения:
```
NODE_ENV=production
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_TEST_VALUE=2
```

## Деплой на DigitalOcean App Platform

### Автоматический деплой

1. **Подготовка репозитория**:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Создание приложения**:
   - Перейдите в [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Нажмите "Create App"
   - Выберите GitHub и репозиторий `ecobazar-frontend`
   - Выберите ветку `main`

3. **Настройка конфигурации**:
   - DigitalOcean автоматически обнаружит React приложение
   - Убедитесь что Build Command: `npm run build`
   - Run Command: `serve -s build -l 3000`

4. **Установка переменных окружения**:
   В разделе Environment Variables добавьте:
   ```
   NODE_ENV=production
   REACT_APP_API_URL=https://eco-b-6sgyz.ondigitalocean.app/api
   REACT_APP_TEST_VALUE=2
   ```

5. **Деплой**:
   - Нажмите "Create Resources"
   - Дождитесь завершения сборки (5-10 минут)
   - Получите URL приложения

### Использование app.yaml (рекомендуется)

1. **Импорт спецификации**:
   - При создании приложения выберите "Import from App Spec"
   - Загрузите файл `.do/app.yaml`
   - Измените URL API в переменных окружения если необходимо

2. **Автоматическое развертывание**:
   - App Platform будет автоматически пересобирать при пуше в main
   - Настроены правильные команды сборки и запуска
   - Переменные окружения настроены по умолчанию

## Настройка Telegram Bot

После успешного деплоя:

1. **Получите URL приложения** (например: `https://ecobazar-frontend-abc123.ondigitalocean.app`)

2. **Настройте WebApp в боте**:
   ```
   /setmenubutton
   Выберите бота
   Введите текст кнопки: "🛒 Открыть EcoBazar"
   Введите URL: https://ecobazar-frontend-abc123.ondigitalocean.app
   ```

3. **Проверьте работу**:
   - Откройте бота в Telegram
   - Нажмите кнопку Menu
   - Убедитесь что Mini App загружается

## Мониторинг и обслуживание

### Логи приложения
```bash
# Просмотр логов сборки и выполнения в DigitalOcean Console
# Apps > Your App > Runtime Logs
```

### Автоматические пересборки
- При каждом пуше в `main` приложение автоматически пересобирается
- Время сборки: 3-5 минут
- Время развертывания: 1-2 минуты

### Обновление переменных окружения
1. Перейдите в Apps > Your App > Settings
2. Environment Variables
3. Измените значения
4. Нажмите "Update"
5. Приложение автоматически перезапустится

## Troubleshooting

### Ошибки сборки
- Проверьте логи сборки в консоли DigitalOcean
- Убедитесь что все зависимости установлены
- Проверьте синтаксис в коде

### Проблемы с переменными окружения
- Убедитесь что переменные начинаются с `REACT_APP_`
- Проверьте что API URL доступен
- Перезапустите приложение после изменения переменных

### Проблемы с Telegram WebApp
- Убедитесь что URL настроен в BotFather
- Проверьте что сертификат HTTPS валиден
- Убедитесь что приложение отвечает на запросы

## Альтернативные варианты деплоя

### Docker
```bash
# Сборка образа
docker build -t ecobazar-frontend .

# Запуск контейнера
docker run -p 80:80 ecobazar-frontend
```

### Другие платформы
- Vercel: автоматический деплой из GitHub
- Netlify: поддержка React из коробки
- AWS S3 + CloudFront: для больших нагрузок
- GitHub Pages: для простых случаев
