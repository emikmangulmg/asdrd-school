// ============================================================
//  controllers/authController.js — Авторизация через JWT
// ============================================================

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');

// Данные админа — пароль хранится как bcrypt-хеш
// Чтобы сгенерировать свой хеш для нового пароля:
//   node -e "require('bcrypt').hash('ВАШ_ПАРОЛЬ', 10).then(console.log)"
const ADMIN = {
  login:        'admin',
  passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  // ↑ bcrypt-хеш строки "password" — замените на свой!
};

async function login(req, res) {
  const { login, password } = req.body;

  logger.info(`[AUTH] Попытка входа: "${login}"`);

  if (!login || !password) {
    return res.status(400).json({ success: false, message: 'Введите логин и пароль' });
  }

  if (login !== ADMIN.login) {
    logger.warn('[AUTH] Неверный логин');
    return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
  }

  try {
    const isValid = await bcrypt.compare(password, ADMIN.passwordHash);

    if (!isValid) {
      logger.warn('[AUTH] Неверный пароль');
      return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }

    // JWT_SECRET берётся из .env — никогда не хардкодим в коде!
    const token = jwt.sign(
      { login: ADMIN.login, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '2h' },
    );

    logger.ok(`[AUTH] Успешный вход: "${login}"`);
    return res.json({ success: true, token });

  } catch (err) {
    logger.error(`[AUTH] Ошибка: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}

module.exports = { login };
