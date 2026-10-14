-- Tareas Kamelia · Esquema de referencia para TiDB/MySQL.
-- NOTA: el runtime serverless usa la copia embebida en store/mysql.js
-- (los .sql no se empaquetan en la función de Vercel).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120)    NOT NULL,
  email         VARCHAR(160)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  role          VARCHAR(40)     NOT NULL,
  zone          VARCHAR(20)     NULL,
  station       VARCHAR(60)     NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_zone (zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title        VARCHAR(180)    NOT NULL,
  description  TEXT            NULL,
  zone         VARCHAR(20)     NOT NULL,
  area         VARCHAR(60)     NOT NULL,
  status       VARCHAR(12)     NOT NULL DEFAULT 'todo',
  priority     VARCHAR(12)     NOT NULL DEFAULT 'media',
  assignee_id  BIGINT UNSIGNED NULL,
  created_by   BIGINT UNSIGNED NOT NULL,
  completed_at TIMESTAMP       NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_zone_status (zone, status),
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ratings (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    BIGINT UNSIGNED NOT NULL,
  stars      TINYINT         NOT NULL,
  comment    VARCHAR(255)    NULL,
  rated_by   BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ratings_task (task_id),
  CONSTRAINT fk_ratings_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
