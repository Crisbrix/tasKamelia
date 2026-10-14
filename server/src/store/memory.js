import bcrypt from 'bcryptjs';
import { SEED_PASSWORD, seedUsers, seedTasks } from '../seed.js';

const toPublicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  zone: u.zone,
  station: u.station,
  createdAt: u.createdAt,
});

const toPublicTask = (t, usersById, ratingsByTask) => {
  const rating = ratingsByTask.get(t.id);
  const assignee = t.assigneeId ? usersById.get(t.assigneeId) : null;
  const creator = usersById.get(t.createdBy);
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    zone: t.zone,
    area: t.area,
    status: t.status,
    priority: t.priority,
    assigneeId: t.assigneeId,
    assigneeName: assignee?.name ?? null,
    createdBy: t.createdBy,
    createdByName: creator?.name ?? null,
    completedAt: t.completedAt,
    createdAt: t.createdAt,
    rating: rating
      ? {
          stars: rating.stars,
          comment: rating.comment,
          ratedBy: rating.ratedBy,
          ratedByName: usersById.get(rating.ratedBy)?.name ?? null,
        }
      : null,
  };
};

export function createMemoryStore() {
  let nextUserId = 1;
  let nextTaskId = 1;
  let nextRatingId = 1;
  const users = [];
  const tasks = [];
  const ratings = [];
  const hash = bcrypt.hashSync(SEED_PASSWORD, 10);

  for (const u of seedUsers) {
    users.push({
      id: nextUserId++,
      name: u.name,
      email: u.email,
      passwordHash: hash,
      role: u.role,
      zone: u.zone,
      station: u.station,
      createdAt: new Date().toISOString(),
    });
  }
  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

  for (const t of seedTasks) {
    const creator = byEmail.get((t.createdBy || 'gerente@kamelia.com').toLowerCase());
    const assignee = t.assignee ? byEmail.get(t.assignee.toLowerCase()) : null;
    const task = {
      id: nextTaskId++,
      title: t.title,
      description: t.description,
      zone: t.zone,
      area: t.area,
      status: t.status,
      priority: t.priority,
      assigneeId: assignee?.id ?? null,
      createdBy: creator?.id ?? 1,
      completedAt: t.status === 'done' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    if (t.rating) {
      const rater = byEmail.get(t.rating.by.toLowerCase());
      ratings.push({
        id: nextRatingId++,
        taskId: task.id,
        stars: t.rating.stars,
        comment: t.rating.comment ?? null,
        ratedBy: rater?.id ?? 1,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const usersById = () => new Map(users.map((u) => [u.id, u]));
  const ratingsByTask = () => new Map(ratings.map((r) => [r.taskId, r]));

  return {
    mode: 'memory',

    listUsers({ zone, role } = {}) {
      return users
        .filter((u) => (!zone || u.zone === zone) && (!role || u.role === role))
        .map(toPublicUser)
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    findUserByEmail(email) {
      return users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || null;
    },

    findUserById(id) {
      return users.find((u) => u.id === Number(id)) || null;
    },

    createUser({ name, email, password, role, zone, station }) {
      if (this.findUserByEmail(email)) {
        const err = new Error('El correo ya está registrado');
        err.status = 409;
        throw err;
      }
      const user = {
        id: nextUserId++,
        name,
        email: email.toLowerCase(),
        passwordHash: bcrypt.hashSync(password, 10),
        role,
        zone: zone ?? null,
        station: station ?? null,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      return toPublicUser(user);
    },

    verifyPassword(user, password) {
      return bcrypt.compare(password, user.passwordHash);
    },

    deleteUser(id) {
      const numericId = Number(id);
      const idx = users.findIndex((u) => u.id === numericId);
      if (idx === -1) return false;
      users.splice(idx, 1);
      for (const task of tasks) if (task.assigneeId === numericId) task.assigneeId = null;
      return true;
    },

    deleteTask(id) {
      const numericId = Number(id);
      const idx = tasks.findIndex((t) => t.id === numericId);
      if (idx === -1) return false;
      tasks.splice(idx, 1);
      const rIdx = ratings.findIndex((r) => r.taskId === numericId);
      if (rIdx !== -1) ratings.splice(rIdx, 1);
      return true;
    },

    listTasks({ zone, area } = {}) {
      const uById = usersById();
      const rByTask = ratingsByTask();
      return tasks
        .filter((t) => (!zone || t.zone === zone) && (!area || t.area === area))
        .map((t) => toPublicTask(t, uById, rByTask))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },

    findTask(id) {
      const t = tasks.find((x) => x.id === Number(id));
      if (!t) return null;
      return toPublicTask(t, usersById(), ratingsByTask());
    },

    createTask({ title, description, zone, area, priority, assigneeId, createdBy }) {
      const task = {
        id: nextTaskId++,
        title,
        description: description ?? null,
        zone,
        area,
        status: 'todo',
        priority: priority || 'media',
        assigneeId: assigneeId ?? null,
        createdBy,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };
      tasks.push(task);
      return this.findTask(task.id);
    },

    updateTask(id, patch) {
      const task = tasks.find((x) => x.id === Number(id));
      if (!task) return null;
      Object.assign(task, patch);
      if (patch.status === 'done' && !task.completedAt) task.completedAt = new Date().toISOString();
      if (patch.status && patch.status !== 'done') task.completedAt = null;
      return this.findTask(task.id);
    },

    setRating({ taskId, stars, comment, ratedBy }) {
      const existing = ratings.find((r) => r.taskId === Number(taskId));
      if (existing) {
        existing.stars = stars;
        existing.comment = comment ?? null;
        existing.ratedBy = ratedBy;
        existing.createdAt = new Date().toISOString();
      } else {
        ratings.push({
          id: nextRatingId++,
          taskId: Number(taskId),
          stars,
          comment: comment ?? null,
          ratedBy,
          createdAt: new Date().toISOString(),
        });
      }
      return this.findTask(taskId);
    },

    async overview() {
      const uById = usersById();
      const rByTask = ratingsByTask();
      const zones = {};
      for (const zone of ['cocina', 'finca', 'comedor']) {
        const list = tasks.filter((t) => t.zone === zone);
        const done = list.filter((t) => t.status === 'done');
        const rated = done.filter((t) => rByTask.has(t.id)).map((t) => rByTask.get(t.id).stars);
        zones[zone] = {
          total: list.length,
          todo: list.filter((t) => t.status === 'todo').length,
          doing: list.filter((t) => t.status === 'doing').length,
          done: done.length,
          pendingReview: done.filter((t) => !rByTask.has(t.id)).length,
          avgStars: rated.length ? Number((rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1)) : null,
          staff: users.filter((u) => u.zone === zone).length,
        };
      }
      return { users: users.length, tasks: tasks.length, zones };
    },
  };
}
