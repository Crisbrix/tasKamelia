import bcrypt from 'bcryptjs';
import { getPool } from '../db/pool.js';
import { SEED_PASSWORD, seedUsers, seedTasks } from '../seed.js';

/* Esquema embebido (copia de db/schema.sql) para entornos serverless
   donde los .sql no se empaquetan junto a la función. */
const SCHEMA_SQL = `
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
`;

const rowToUser = (r) => ({
  id: Number(r.id),
  name: r.name,
  email: r.email,
  role: r.role,
  zone: r.zone,
  station: r.station,
  createdAt: r.created_at,
});

const rowToTask = (r) => ({
  id: Number(r.id),
  title: r.title,
  description: r.description,
  zone: r.zone,
  area: r.area,
  status: r.status,
  priority: r.priority,
  assigneeId: r.assignee_id ? Number(r.assignee_id) : null,
  assigneeName: r.assignee_name ?? null,
  createdBy: Number(r.created_by),
  createdByName: r.created_by_name ?? null,
  completedAt: r.completed_at,
  createdAt: r.created_at,
  rating: r.stars
    ? { stars: Number(r.stars), comment: r.comment ?? null, ratedBy: Number(r.rated_by), ratedByName: r.rated_by_name ?? null }
    : null,
});

const TASK_SELECT = `
  SELECT t.*, u.name AS assignee_name, cu.name AS created_by_name,
         r.stars, r.comment, r.rated_by, ru.name AS rated_by_name
  FROM tasks t
  LEFT JOIN users u  ON u.id  = t.assignee_id
  LEFT JOIN users cu ON cu.id = t.created_by
  LEFT JOIN ratings r ON r.task_id = t.id
  LEFT JOIN users ru ON ru.id = r.rated_by
`;

export async function createMysqlStore() {
  const pool = getPool();
  for (const stmt of SCHEMA_SQL.split(';').map((s) => s.trim()).filter(Boolean)) {
    await pool.query(stmt);
  }
  await seed(pool);

  return {
    mode: 'tidb',

    async listUsers({ zone, role } = {}) {
      const [rows] = await pool.query(
        `SELECT * FROM users ${zone || role ? 'WHERE' : ''} ${zone ? 'zone = ?' : ''} ${zone && role ? 'AND' : ''} ${role ? 'role = ?' : ''} ORDER BY name`,
        [zone, role].filter(Boolean),
      );
      return rows.map(rowToUser);
    },

    async findUserByEmail(email) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      return rows[0] ? { ...rowToUser(rows[0]), passwordHash: rows[0].password_hash } : null;
    },

    async findUserById(id) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
      return rows[0] ? { ...rowToUser(rows[0]), passwordHash: rows[0].password_hash } : null;
    },

    async createUser({ name, email, password, role, zone, station }) {
      try {
        const [res] = await pool.query(
          'INSERT INTO users (name, email, password_hash, role, zone, station) VALUES (?, ?, ?, ?, ?, ?)',
          [name, email.toLowerCase(), bcrypt.hashSync(password, 10), role, zone ?? null, station ?? null],
        );
        return rowToUser({ id: res.insertId, name, email: email.toLowerCase(), role, zone, station, created_at: new Date() });
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          const e = new Error('El correo ya está registrado');
          e.status = 409;
          throw e;
        }
        throw err;
      }
    },

    async verifyPassword(user, password) {
      return bcrypt.compare(password, user.passwordHash);
    },

    async deleteUser(id) {
      const [res] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return res.affectedRows > 0;
    },

    async listTasks({ zone, area } = {}) {
      const where = [];
      const params = [];
      if (zone) {
        where.push('t.zone = ?');
        params.push(zone);
      }
      if (area) {
        where.push('t.area = ?');
        params.push(area);
      }
      const [rows] = await pool.query(
        `${TASK_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY t.created_at`,
        params,
      );
      return rows.map(rowToTask);
    },

    async findTask(id) {
      const [rows] = await pool.query(`${TASK_SELECT} WHERE t.id = ? LIMIT 1`, [id]);
      return rows[0] ? rowToTask(rows[0]) : null;
    },

    async createTask({ title, description, zone, area, priority, assigneeId, createdBy }) {
      const [res] = await pool.query(
        'INSERT INTO tasks (title, description, zone, area, status, priority, assignee_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description ?? null, zone, area, 'todo', priority || 'media', assigneeId ?? null, createdBy],
      );
      return this.findTask(res.insertId);
    },

    async updateTask(id, patch) {
      const current = await this.findTask(id);
      if (!current) return null;
      const next = {
        title: patch.title ?? current.title,
        description: patch.description ?? current.description,
        area: patch.area ?? current.area,
        priority: patch.priority ?? current.priority,
        assigneeId: patch.assigneeId !== undefined ? patch.assigneeId : current.assigneeId,
        status: patch.status ?? current.status,
      };
      await pool.query(
        'UPDATE tasks SET title = ?, description = ?, area = ?, priority = ?, assignee_id = ?, status = ?, completed_at = ? WHERE id = ?',
        [
          next.title,
          next.description,
          next.area,
          next.priority,
          next.assigneeId,
          next.status,
          next.status === 'done' ? new Date() : null,
          id,
        ],
      );
      return this.findTask(id);
    },

    async setRating({ taskId, stars, comment, ratedBy }) {
      await pool.query(
        `INSERT INTO ratings (task_id, stars, comment, rated_by) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE stars = VALUES(stars), comment = VALUES(comment), rated_by = VALUES(rated_by)`,
        [taskId, stars, comment ?? null, ratedBy],
      );
      return this.findTask(taskId);
    },

    async overview() {
      const [statRows] = await pool.query(
        `SELECT zone, status, COUNT(*) AS total FROM tasks GROUP BY zone, status`,
      );
      const [ratingRows] = await pool.query(
        `SELECT t.zone, AVG(r.stars) AS avg_stars, COUNT(r.id) AS rated
         FROM ratings r JOIN tasks t ON t.id = r.task_id GROUP BY t.zone`,
      );
      const [doneRows] = await pool.query(
        `SELECT t.zone, SUM(r.id IS NULL) AS pending FROM tasks t LEFT JOIN ratings r ON r.task_id = t.id
         WHERE t.status = 'done' GROUP BY t.zone`,
      );
      const [pendingTasks] = await pool.query(`SELECT zone, COUNT(*) AS total FROM tasks GROUP BY zone`);
      const [staffRows] = await pool.query(`SELECT zone, COUNT(*) AS total FROM users WHERE zone IS NOT NULL GROUP BY zone`);
      const [counts] = await pool.query(`SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM tasks) AS tasks`);

      const zones = {};
      for (const zone of ['cocina', 'finca', 'comedor']) {
        const byStatus = Object.fromEntries(statRows.filter((r) => r.zone === zone).map((r) => [r.status, Number(r.total)]));
        const rating = ratingRows.find((r) => r.zone === zone);
        zones[zone] = {
          total: Number(pendingTasks.find((r) => r.zone === zone)?.total || 0),
          todo: byStatus.todo || 0,
          doing: byStatus.doing || 0,
          done: byStatus.done || 0,
          pendingReview: Number(doneRows.find((r) => r.zone === zone)?.pending || 0),
          avgStars: rating ? Number(Number(rating.avg_stars).toFixed(1)) : null,
          staff: Number(staffRows.find((r) => r.zone === zone)?.total || 0),
        };
      }
      return { users: Number(counts[0].users), tasks: Number(counts[0].tasks), zones };
    },
  };
}

async function seed(pool) {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM users');
  if (Number(n) > 0) return;

  const hash = bcrypt.hashSync(SEED_PASSWORD, 10);
  const ids = new Map();
  for (const u of seedUsers) {
    const [res] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, zone, station) VALUES (?, ?, ?, ?, ?, ?)',
      [u.name, u.email, hash, u.role, u.zone, u.station],
    );
    ids.set(u.email, res.insertId);
  }
  for (const t of seedTasks) {
    const [res] = await pool.query(
      `INSERT INTO tasks (title, description, zone, area, status, priority, assignee_id, created_by, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.title,
        t.description,
        t.zone,
        t.area,
        t.status,
        t.priority,
        t.assignee ? ids.get(t.assignee) : null,
        ids.get(t.createdBy || 'gerente@kamelia.com'),
        t.status === 'done' ? new Date() : null,
      ],
    );
    if (t.rating) {
      await pool.query('INSERT INTO ratings (task_id, stars, comment, rated_by) VALUES (?, ?, ?, ?)', [
        res.insertId,
        t.rating.stars,
        t.rating.comment ?? null,
        ids.get(t.rating.by),
      ]);
    }
  }
  console.log('[db] Esquema creado y datos sembrados en TiDB.');
}
