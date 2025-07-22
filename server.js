const express = require('express');
const path = require('path');
const app = express();

// Настройка статических файлов
app.use(express.static(path.join(__dirname, 'build')));

// Настройка для SPA (возвращаем index.html для всех маршрутов)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Получаем порт из переменных окружения или используем 8080 по умолчанию
const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
