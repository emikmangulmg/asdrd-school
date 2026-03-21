// ============================================================
//  utils/logger.js — Логгер с временными метками
// ============================================================

const colors = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  gray:   '\x1b[90m',
};

function ts() {
  return new Date().toLocaleTimeString('ru-RU');
}

const logger = {
  info:  (msg) => console.log(`${colors.gray}[${ts()}]${colors.reset} ${colors.blue}ℹ${colors.reset}  ${msg}`),
  ok:    (msg) => console.log(`${colors.gray}[${ts()}]${colors.reset} ${colors.green}✓${colors.reset}  ${msg}`),
  warn:  (msg) => console.log(`${colors.gray}[${ts()}]${colors.reset} ${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.gray}[${ts()}]${colors.reset} ${colors.red}✗${colors.reset}  ${msg}`),
};

module.exports = logger;
