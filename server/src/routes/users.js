import { Router } from 'express';
import { getStore } from '../store/index.js';
import { asyncHandler } from '../auth.js';
import { canCreateUser, canDeleteUser, canListUsers, HttpError } from '../rbac.js';
import { ROLES, ZONES } from '../constants.js';

export const usersRouter = Router();

usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { zone, role } = req.query;
    if (zone && !canListUsers(req.user, zone)) throw new HttpError(403, 'No tienes acceso a esta zona', 'forbidden');
    const list = await getStore().listUsers({ zone, role });
    if (req.user.role !== 'gerente' && !zone) {
      return res.json(list.filter((u) => u.zone === req.user.zone));
    }
    res.json(list);
  }),
);

usersRouter.get(
  '/roles',
  asyncHandler(async (req, res) => {
    const user = req.user;
    const roles = Object.values(ROLES).filter((r) => {
      if (user.role === 'gerente') return true;
      if (user.role === 'chef') return r.zone === 'cocina';
      if (user.role === 'jefe_meseros') return r.zone === 'comedor';
      if (user.role === 'auditor') return r.zone === 'finca' || r.zone === 'cocina';
      return false;
    });
    res.json(roles);
  }),
);

usersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, password, role, zone, station } = req.body || {};
    if (!name || !email || !password || !role) {
      throw new HttpError(400, 'Nombre, correo, contraseña y rol son obligatorios', 'validation');
    }
    if (password.length < 6) throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres', 'validation');
    if (!ROLES[role]) throw new HttpError(400, 'Rol no reconocido', 'validation');

    const targetZone = zone || ROLES[role].zone || null;
    if (targetZone && !ZONES[targetZone]) throw new HttpError(400, 'Zona no reconocida', 'validation');
    if (ROLES[role].zone && targetZone !== ROLES[role].zone) {
      throw new HttpError(400, `El rol ${ROLES[role].label} pertenece a la zona ${ZONES[ROLES[role].zone].label}`, 'validation');
    }
    if (!canCreateUser(req.user, role, targetZone)) {
      throw new HttpError(403, 'No tienes permisos para crear este rol', 'forbidden');
    }

    const user = await getStore().createUser({ name, email, password, role, zone: targetZone, station });
    res.status(201).json(user);
  }),
);

usersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const store = getStore();
    const target = await store.findUserById(req.params.id);
    if (!target) throw new HttpError(404, 'Usuario no encontrado', 'not_found');
    if (!canDeleteUser(req.user, target)) {
      throw new HttpError(403, 'No tienes permisos para eliminar este usuario', 'forbidden');
    }
    await store.deleteUser(target.id);
    const { passwordHash, ...publicTarget } = target;
    res.json({ ok: true, deleted: publicTarget });
  }),
);
