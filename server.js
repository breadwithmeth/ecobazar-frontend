const express = require('express');
const path = require('path');
const app = express();

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0'
  });
});

// Настройка статических файлов
app.use(express.static(path.join(__dirname, 'build')));

// Настройка для SPA (возвращаем index.html для всех маршрутов)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Получаем порт из переменных окружения или используем 8080 по умолчанию
const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 EcoBazar server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${port}/health`);
});
