import { ZONES } from './constants.js';

export class HttpError extends Error {
  constructor(status, message, code = 'error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const isZone = (zone) => Boolean(ZONES[zone]);

/** Gerente: control total. Cada jefe de zona solo administra su zona. */
export function canManageZone(user, zone) {
  if (!user || !isZone(zone)) return false;
  if (user.role === 'gerente') return true;
  if (user.role === 'auditor' && zone === 'finca') return true;
  if (user.role === 'chef' && zone === 'cocina') return true;
  if (user.role === 'jefe_meseros' && zone === 'comedor') return true;
  return false;
}

/** Gestión de usuarios: Auditor cubre Cocina + Finca, Gerente todo, jefes su zona. */
export function canManageUsers(user, zone) {
  if (!user || !isZone(zone)) return false;
  if (user.role === 'gerente') return true;
  if (user.role === 'auditor') return zone === 'finca' || zone === 'cocina';
  if (user.role === 'chef') return zone === 'cocina';
  if (user.role === 'jefe_meseros') return zone === 'comedor';
  return false;
}

export function manageableZones(user) {
  if (!user) return [];
  if (user.role === 'gerente') return ['cocina', 'finca', 'comedor'];
  if (user.role === 'auditor') return ['cocina', 'finca'];
  if (user.role === 'chef') return ['cocina'];
  if (user.role === 'jefe_meseros') return ['comedor'];
  return [];
}

export function canCreateTask(user, zone) {
  return canManageZone(user, zone);
}

export function canEditTask(user, task) {
  if (!user || !task) return false;
  if (user.role === 'gerente') return true;
  if (canManageZone(user, task.zone)) return true;
  if (task.assignee_id === user.id || task.assigneeId === user.id) return true;
  if (user.role === 'auditor' && task.zone !== 'comedor') return true;
  return false;
}

/** El módulo de auditoría solo aplica a Cocina y Finca y solo a Auditor/Gerente. */
export function canRate(user, task) {
  if (!user || !task) return false;
  if (!ZONES[task.zone]?.rating) return false;
  if (task.status !== 'done') return false;
  return user.role === 'auditor' || user.role === 'gerente';
}

/** Alta de usuarios: el Gerente crea cualquier rol; los jefes solo su personal. */
export function canCreateUser(user, targetRole, zone) {
  if (!user) return false;
  if (user.role === 'gerente') return true;
  if (user.role === 'chef') return zone === 'cocina' && ZONES.cocina.createRoles.includes(targetRole);
  if (user.role === 'jefe_meseros') return zone === 'comedor' && ZONES.comedor.createRoles.includes(targetRole);
  if (user.role === 'auditor') {
    return (
      (zone === 'finca' && ZONES.finca.createRoles.includes(targetRole)) ||
      (zone === 'cocina' && ZONES.cocina.createRoles.includes(targetRole))
    );
  }
  return false;
}

/** Baja de usuarios: solo personal de las zonas que gestiona; nunca a sí mismo. */
export function canDeleteUser(user, target) {
  if (!user || !target) return false;
  if (user.id === target.id) return false;
  if (user.role === 'gerente') return true;
  if (user.role === 'chef') return target.zone === 'cocina' && ZONES.cocina.createRoles.includes(target.role);
  if (user.role === 'jefe_meseros') {
    return target.zone === 'comedor' && ZONES.comedor.createRoles.includes(target.role);
  }
  if (user.role === 'auditor') {
    return (
      (target.zone === 'finca' && ZONES.finca.createRoles.includes(target.role)) ||
      (target.zone === 'cocina' && ZONES.cocina.createRoles.includes(target.role))
    );
  }
  return false;
}

export function canListUsers(user, zone) {
  if (!user) return false;
  if (user.role === 'gerente') return true;
  if (!zone) return true;
  return canManageZone(user, zone) || canManageUsers(user, zone) || zone === user.zone;
}

export function canAccessAdmin(user) {
  return user?.role === 'gerente';
}
