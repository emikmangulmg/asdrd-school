// ============================================================
//  controllers/applicationController.js — CRUD заявок
// ============================================================

const pool   = require('../models/db');
const logger = require('../utils/logger');

const ALLOWED_STATUSES = ['new', 'accepted', 'rejected'];

async function createApplication(req, res) {
  const { name, age, city, email, motivation } = req.body;
  logger.info(`[APP] Новая заявка: ${name}, ${email}`);

  const errors = [];
  if (!name || String(name).trim().length < 2)             errors.push('Укажите имя (мин. 2 символа)');
  if (!age || isNaN(age) || +age < 18 || +age > 35)        errors.push('Возраст от 18 до 35 лет');
  if (!city || String(city).trim().length < 2)             errors.push('Укажите город');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Некорректный email');
  if (!motivation || String(motivation).trim().length < 10) errors.push('Расскажите подробнее (мин. 10 символов)');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO applications (name, age, city, email, motivation) VALUES (?, ?, ?, ?, ?)',
      [String(name).trim(), parseInt(age, 10), String(city).trim(),
       String(email).trim().toLowerCase(), String(motivation).trim()]
    );
    logger.ok(`[APP] Сохранена заявка ID: ${result.insertId}`);
    return res.status(201).json({ success: true, message: 'Заявка сохранена', id: result.insertId });
  } catch (err) {
    logger.error(`[APP] Ошибка сохранения: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

async function getAllApplications(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, age, city, email, motivation, status, created_at FROM applications ORDER BY created_at DESC'
    );
    logger.ok(`[APP] Список заявок: ${rows.length} шт.`);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    logger.error(`[APP] Ошибка получения: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

async function deleteApplication(req, res) {
  const { id } = req.params;
  if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Неверный ID' });

  try {
    const [result] = await pool.execute('DELETE FROM applications WHERE id = ?', [parseInt(id, 10)]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Заявка не найдена' });
    logger.ok(`[APP] Удалена заявка ID: ${id}`);
    return res.json({ success: true, message: 'Заявка удалена' });
  } catch (err) {
    logger.error(`[APP] Ошибка удаления: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Неверный ID' });
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Допустимые статусы: ${ALLOWED_STATUSES.join(', ')}` });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE applications SET status = ? WHERE id = ?', [status, parseInt(id, 10)]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Заявка не найдена' });
    logger.ok(`[APP] Статус ID ${id} → "${status}"`);
    return res.json({ success: true, message: 'Статус обновлён' });
  } catch (err) {
    logger.error(`[APP] Ошибка статуса: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

module.exports = { createApplication, getAllApplications, deleteApplication, updateStatus };
