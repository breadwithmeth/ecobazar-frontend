# 🚀 Быстрый деплой на DigitalOcean

## Пошаговая инструкция

### 1. Подготовка репозитория
```bash
# Убедитесь что все изменения зафиксированы
git add .
git commit -m "Ready for DigitalOcean deployment"
git push origin main
```

### 2. Создание приложения в DigitalOcean

1. Перейдите на [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Нажмите **"Create App"**
3. Выберите **"Import from App Spec"**
4. Загрузите файл `.do/app.yaml` из корня проекта
5. Измените переменную `REACT_APP_API_URL` на ваш API URL
6. Нажмите **"Create Resources"**

### 3. Мониторинг деплоя

- Процесс деплоя займет 5-10 минут
- Следите за логами в разделе **Activity**
- После завершения получите публичный URL

### 4. Настройка Telegram Bot

```
1. Откройте @BotFather в Telegram
2. Выберите /setmenubutton
3. Выберите вашего бота
4. Введите:
   - Текст кнопки: "🛒 EcoBazar"
   - URL: ваш DigitalOcean URL
```

## Альтернативный способ (ручная настройка)

Если app.yaml не работает:

### 1. Создание через GitHub
- GitHub Source
- Выберите репозиторий: `breadwithmeth/ecobazar-frontend`
- Branch: `main`

### 2. Настройки сборки
- **Build Command**: `npm ci && npm run build`
- **Run Command**: `node server.js`
- **Environment**: Node.js
- **Instance Size**: Basic ($5/месяц)

### 3. Переменные окружения
```
NODE_ENV=production
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_TEST_VALUE=2
```

## Проверка работоспособности

1. **Откройте ваш URL** - должна загружаться страница приложения
2. **Проверьте в Telegram** - откройте бота и нажмите Menu
3. **Проверьте логи** - Apps → Your App → Runtime Logs

## Обновление после изменений

Любой push в ветку `main` автоматически запускает пересборку приложения.

---

**Готово! 🎉 Ваш EcoBazar Mini App развернут и готов к использованию.**
