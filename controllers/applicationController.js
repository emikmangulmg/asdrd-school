// ============================================================
//  controllers/applicationController.js — Обновлено под новую форму
// ============================================================

const pool   = require('../models/db');
const logger = require('../utils/logger');

const ALLOWED_STATUSES = ['new', 'accepted', 'rejected'];

/**
 * POST /api/apply — сохранить заявку
 */
async function createApplication(req, res) {
  const {
    name, birthdate, city, languages, marital,
    email, phone,
    church_member, church_member_other,
    prev_school,
    ministry, ministry_other,
    health, health_other,
    motivation,
  } = req.body;

  logger.info(`[APP] Новая заявка от: ${name}, ${email}`);

  // Валидация обязательных полей
  const errors = [];
  if (!name || name.trim().length < 2)            errors.push('Укажите ФИО');
  if (!birthdate)                                  errors.push('Укажите дату рождения');
  if (!city || city.trim().length < 2)             errors.push('Укажите страну и город');
  if (!languages || languages.trim().length < 2)   errors.push('Укажите языки общения');
  if (!marital)                                    errors.push('Укажите семейное положение');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Некорректный email');
  if (!phone || phone.trim().length < 5)           errors.push('Укажите номер телефона');
  if (!church_member)                              errors.push('Укажите членство в церкви');
  if (!prev_school)                                errors.push('Ответьте про другие школы');
  if (!ministry || ministry.trim().length < 2)     errors.push('Укажите сферы служения');
  if (!health)                                     errors.push('Ответьте про здоровье');
  if (!motivation || motivation.trim().length < 10) errors.push('Расскажите о мотивации');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    const sql = `
      INSERT INTO applications
        (name, birthdate, city, languages, marital,
         email, phone,
         church_member, church_member_other,
         prev_school, ministry, ministry_other,
         health, health_other, motivation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
      name.trim(),
      birthdate || null,
      city.trim(),
      languages.trim(),
      marital,
      email.trim().toLowerCase(),
      phone.trim(),
      church_member,
      church_member_other?.trim() || null,
      prev_school,
      ministry.trim(),
      ministry_other?.trim() || null,
      health,
      health_other?.trim() || null,
      motivation.trim(),
    ]);

    logger.ok(`[APP] Заявка сохранена ID: ${result.insertId}`);
    return res.status(201).json({ success: true, message: 'Заявка сохранена', id: result.insertId });

  } catch (err) {
    logger.error(`[APP] Ошибка сохранения: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

/**
 * GET /api/applications — список заявок (только для админа)
 */
async function getAllApplications(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT id, name, birthdate, city, languages, marital,
             email, phone, church_member, church_member_other,
             prev_school, ministry, ministry_other,
             health, health_other, motivation, status, created_at
      FROM applications
      ORDER BY created_at DESC
    `);
    logger.ok(`[APP] Список заявок: ${rows.length} шт.`);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    logger.error(`[APP] Ошибка: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

/**
 * DELETE /api/applications/:id
 */
async function deleteApplication(req, res) {
  const { id } = req.params;
  if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Неверный ID' });

  try {
    const [result] = await pool.execute('DELETE FROM applications WHERE id = ?', [parseInt(id, 10)]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Не найдена' });
    logger.ok(`[APP] Удалена заявка ID: ${id}`);
    return res.json({ success: true, message: 'Заявка удалена' });
  } catch (err) {
    logger.error(`[APP] Ошибка удаления: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

/**
 * PUT /api/applications/:id — изменить статус
 */
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
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Не найдена' });
    logger.ok(`[APP] Статус ID ${id} → "${status}"`);
    return res.json({ success: true, message: 'Статус обновлён' });
  } catch (err) {
    logger.error(`[APP] Ошибка: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

module.exports = { createApplication, getAllApplications, deleteApplication, updateStatus };
