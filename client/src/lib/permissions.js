import { ZONES, ROLES } from './constants';

const hasRole = (user, ...roles) => Boolean(user && roles.includes(user.role));

export function canManageZone(user, zone) {
  if (!user || !ZONES[zone]) return false;
  if (user.role === 'gerente') return true;
  if (user.role === 'auditor' && zone === 'finca') return true;
  if (user.role === 'chef' && zone === 'cocina') return true;
  if (user.role === 'jefe_meseros' && zone === 'comedor') return true;
  return false;
}

export function canCreateTask(user, zone) {
  return canManageZone(user, zone);
}

export function canEditTask(user, task) {
  if (!user || !task) return false;
  if (user.role === 'gerente') return true;
  if (canManageZone(user, task.zone)) return true;
  if (task.assigneeId === user.id) return true;
  if (user.role === 'auditor' && task.zone !== 'comedor') return true;
  return false;
}

/** Módulo de auditoría: solo Auditor/Gerente y solo en tareas "Hecho" de Cocina/Finca. */
export function canRate(user, task) {
  if (!user || !task) return false;
  if (!ZONES[task.zone]?.rating) return false;
  if (task.status !== 'done') return false;
  return hasRole(user, 'auditor', 'gerente');
}

/** Gestión de usuarios: Auditor cubre Cocina + Finca, Gerente todo, jefes su zona. */
export function canManageUsers(user, zone) {
  if (!user || !ZONES[zone]) return false;
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

export function canCreateUser(user, role, zone) {
  if (!user || !ROLES[role]) return false;
  if (user.role === 'gerente') return true;
  if (user.role === 'chef') return zone === 'cocina' && ROLES[role].zone === 'cocina';
  if (user.role === 'jefe_meseros') return zone === 'comedor' && ROLES[role].zone === 'comedor';
  if (user.role === 'auditor') {
    return (zone === 'finca' && ROLES[role].zone === 'finca') || (zone === 'cocina' && ROLES[role].zone === 'cocina');
  }
  return false;
}

/** Baja de usuarios: solo personal de las zonas que gestiona; nunca a sí mismo. */
export function canDeleteUser(user, target) {
  if (!user || !target) return false;
  if (user.id === target.id) return false;
  if (user.role === 'gerente') return true;
  const inZone = (zone) => target.zone === zone && ROLES[target.role]?.zone === zone;
  if (user.role === 'chef') return inZone('cocina');
  if (user.role === 'jefe_meseros') return inZone('comedor');
  if (user.role === 'auditor') return inZone('finca') || inZone('cocina');
  return false;
}

/** Roles que el usuario actual puede asignar dentro de una zona. */
export function assignableRoles(user, zone) {
  if (!user) return [];
  if (user.role === 'gerente') {
    return zone ? Object.values(ROLES).filter((r) => r.zone === zone || !r.zone) : Object.values(ROLES);
  }
  return Object.values(ROLES).filter((r) => r.zone === zone && canCreateUser(user, r.value, zone));
}

export function canListUsers(user, zone) {
  if (!user) return false;
  if (user.role === 'gerente') return true;
  if (!zone) return true;
  return canManageZone(user, zone) || canManageUsers(user, zone) || zone === user.zone;
}

/** Baja de tareas: Gerente todo; gestores solo en sus zonas. */
export function canDeleteTask(user, task) {
  if (!user || !task) return false;
  if (user.role === 'gerente') return true;
  if (user.role === 'auditor') return task.zone === 'finca' || task.zone === 'cocina';
  if (user.role === 'chef') return task.zone === 'cocina';
  if (user.role === 'jefe_meseros') return task.zone === 'comedor';
  return false;
}

export const isAdmin = (user) => user?.role === 'gerente';
