// ============================================================
//  models/db.js — Подключение к MySQL через переменные окружения
//  Работает как локально (.env), так и в облаке (Railway)
// ============================================================

const mysql  = require('mysql2/promise');
const logger = require('../utils/logger');

// Конфигурация из переменных окружения
const dbConfig = {
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  // SSL нужен для Railway и большинства облачных провайдеров
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
};

// Проверяем что все обязательные переменные заданы
const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing  = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  logger.error(`[DB] Отсутствуют переменные окружения: ${missing.join(', ')}`);
  logger.error('[DB] Проверьте файл .env или настройки облака');
  process.exit(1);
}

const pool = mysql.createPool(dbConfig);

// Проверяем соединение при старте
(async () => {
  try {
    const conn = await pool.getConnection();
    logger.ok(`[DB] Подключено к MySQL: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    conn.release();
  } catch (err) {
    logger.error(`[DB] Ошибка подключения: ${err.message}`);
    logger.error('[DB] Проверьте DB_HOST, DB_USER, DB_PASSWORD, DB_NAME в .env');
    process.exit(1);
  }
})();

module.exports = pool;
