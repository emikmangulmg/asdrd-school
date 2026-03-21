-- ============================================================
--  schema.sql — Создание таблицы в облачной БД
--  Выполни один раз после создания БД на Railway
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
  id         INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(150) NOT NULL,
  age        INT          NOT NULL,
  city       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  motivation TEXT         NOT NULL,
  status     VARCHAR(50)  NOT NULL DEFAULT 'new',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email   (email),
  INDEX idx_status  (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
