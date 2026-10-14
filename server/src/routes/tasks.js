import { Router } from 'express';
import { getStore } from '../store/index.js';
import { asyncHandler } from '../auth.js';
import { canCreateTask, canEditTask, canRate, canManageZone, canDeleteTask, HttpError } from '../rbac.js';
import { PRIORITIES, STATUSES, ZONES } from '../constants.js';

export const tasksRouter = Router();

tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { zone, area } = req.query;
    if (zone && !ZONES[zone]) throw new HttpError(400, 'Zona no reconocida', 'validation');
    res.json(await getStore().listTasks({ zone, area }));
  }),
);

tasksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, description, zone, area, priority, assigneeId } = req.body || {};
    if (!title || !zone || !area) throw new HttpError(400, 'Título, zona y área son obligatorios', 'validation');
    if (!ZONES[zone]) throw new HttpError(400, 'Zona no reconocida', 'validation');
    if (!ZONES[zone].areas.includes(area)) throw new HttpError(400, 'El área no pertenece a la zona', 'validation');
    if (priority && !PRIORITIES.includes(priority)) throw new HttpError(400, 'Prioridad no válida', 'validation');
    if (!canCreateTask(req.user, zone)) throw new HttpError(403, 'No puedes crear tareas en esta zona', 'forbidden');
    if (assigneeId) {
      const assignee = await getStore().findUserById(assigneeId);
      if (!assignee) throw new HttpError(400, 'Encargado inexistente', 'validation');
      if (assignee.zone !== zone) throw new HttpError(400, 'El encargado no pertenece a esta zona', 'validation');
    }
    const task = await getStore().createTask({
      title,
      description,
      zone,
      area,
      priority,
      assigneeId: assigneeId || null,
      createdBy: req.user.id,
    });
    res.status(201).json(task);
  }),
);

tasksRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const store = getStore();
    const task = await store.findTask(req.params.id);
    if (!task) throw new HttpError(404, 'Tarea no encontrada', 'not_found');
    if (!canEditTask(req.user, task)) throw new HttpError(403, 'No puedes modificar esta tarea', 'forbidden');

    const patch = {};
    if (req.body.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) throw new HttpError(400, 'Estado no válido', 'validation');
      patch.status = req.body.status;
    }
    for (const key of ['title', 'description', 'area', 'priority']) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (req.body.assigneeId !== undefined) {
      if (!canManageZone(req.user, task.zone)) throw new HttpError(403, 'Solo el jefe de zona reasigna tareas', 'forbidden');
      patch.assigneeId = req.body.assigneeId;
      if (patch.assigneeId) {
        const assignee = await store.findUserById(patch.assigneeId);
        if (!assignee || assignee.zone !== task.zone) throw new HttpError(400, 'Encargado inválido para la zona', 'validation');
      }
    }
    res.json(await store.updateTask(task.id, patch));
  }),
);

tasksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const store = getStore();
    const task = await store.findTask(req.params.id);
    if (!task) throw new HttpError(404, 'Tarea no encontrada', 'not_found');
    if (!canDeleteTask(req.user, task)) {
      throw new HttpError(403, 'No puedes eliminar tareas de esta zona', 'forbidden');
    }
    await store.deleteTask(task.id);
    res.json({ ok: true, deleted: task.id });
  }),
);

tasksRouter.post(
  '/:id/rate',
  asyncHandler(async (req, res) => {
    const store = getStore();
    const task = await store.findTask(req.params.id);
    if (!task) throw new HttpError(404, 'Tarea no encontrada', 'not_found');
    if (!canRate(req.user, task)) {
      throw new HttpError(403, 'Solo Auditor o Gerente califican tareas completadas de Cocina/Finca', 'forbidden');
    }
    const stars = Number(req.body?.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw new HttpError(400, 'La calificación debe ser un entero de 1 a 5', 'validation');
    }
    const updated = await store.setRating({
      taskId: task.id,
      stars,
      comment: req.body?.comment ?? null,
      ratedBy: req.user.id,
    });
    res.json(updated);
  }),
);
