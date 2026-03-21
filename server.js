// ============================================================
//  server.js — Продакшн-версия с dotenv
//  Миссионерская школа АСДРД v4.0
// ============================================================

// dotenv загружает переменные из .env файла в process.env
// В облаке (Railway) переменные задаются в панели — .env не нужен
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const path     = require('path');
const logger   = require('./utils/logger');

const authRoutes        = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

const app  = express();

// Порт берётся из переменной окружения (Railway ставит свой)
// Если переменной нет — используем 3000 для локальной разработки
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────

// Логируем HTTP-запросы (в продакшне краткий формат)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — разрешаем запросы с любых источников
// В продакшне можно ограничить: origin: 'https://your-domain.com'
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы из папки public/
// index.html, admin.html, style.css, script.js, admin.js
app.use(express.static(path.join(__dirname, 'public')));

// ── Маршруты API ─────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', applicationRoutes);

// ── Health check — Railway проверяет этот маршрут ────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, time: new Date().toISOString() });
});

// ── Fallback: все GET → index.html ───────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Маршрут не найден' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Глобальный обработчик ошибок ─────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Необработанная ошибка: ${err.message}`);
  res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
});

// ── Запуск ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Миссионерская школа АСДРД v4.0         ║');
  console.log(`║   Среда:  ${(process.env.NODE_ENV || 'development').padEnd(30)} ║`);
  console.log(`║   Порт:   ${String(PORT).padEnd(30)} ║`);
  console.log(`║   БД:     ${(process.env.DB_HOST || 'не задан').padEnd(30)} ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
