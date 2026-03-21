// ============================================================
//  middleware/authMiddleware.js — Проверка JWT токена
// ============================================================

const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    logger.warn(`[AUTH] Запрос без токена: ${req.method} ${req.path}`);
    return res.status(401).json({ success: false, message: 'Токен отсутствует' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'Неверный формат токена' });
  }

  const token = parts[1];

  try {
    // JWT_SECRET берётся из переменных окружения
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.info(`[AUTH] Доступ разрешён: ${decoded.login}`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Токен истёк, войдите снова' });
    }
    logger.warn('[AUTH] Невалидный токен');
    return res.status(401).json({ success: false, message: 'Невалидный токен' });
  }
}

module.exports = { authMiddleware };
