export const ZONES = {
  cocina: {
    id: 'cocina',
    label: 'Cocina',
    subtitle: 'Prioridad máxima',
    accent: '#F43F5E',
    rating: true,
    areas: ['Mise en place', 'Neveras', 'Aseo', 'Picado', 'Inventario', 'Administrativo'],
    description: 'Chef administra el personal y las tareas. El Auditor califica en "Hecho".',
  },
  finca: {
    id: 'finca',
    label: 'Finca',
    subtitle: 'Mantenimiento y aseo',
    accent: '#10B981',
    rating: true,
    areas: ['Mantenimiento', 'Aseo', 'Cultivos', 'Infraestructura'],
    description: 'El Auditor crea a los encargados, asigna trabajos y los califica.',
  },
  comedor: {
    id: 'comedor',
    label: 'Comedor',
    subtitle: 'Servicio',
    accent: '#3B82F6',
    rating: false,
    areas: ['Derecho', 'Izquierdo', 'Palco y Chalet', 'Envase', 'Reciclaje', 'Carritos', 'Servilletero'],
    description: 'El Jefe de Meseros gestiona al personal de servicio del comedor.',
  },
};

export const ZONE_LIST = Object.values(ZONES);

export const STATUSES = [
  { id: 'todo', label: 'Por hacer', accent: '#94A3B8' },
  { id: 'doing', label: 'Haciendo', accent: '#3B82F6' },
  { id: 'done', label: 'Hecho', accent: '#10B981' },
  { id: 'auditado', label: 'Auditado', accent: '#F59E0B' },
];

export const PRIORITIES = [
  { id: 'alta', label: 'Alta', color: '#F43F5E' },
  { id: 'media', label: 'Media', color: '#F59E0B' },
  { id: 'baja', label: 'Baja', color: '#94A3B8' },
];

export const ROLES = {
  gerente: { value: 'gerente', label: 'Gerente', color: '#F59E0B', zone: null },
  auditor: { value: 'auditor', label: 'Auditor', color: '#F97316', zone: null },
  chef: { value: 'chef', label: 'Chef', color: '#F43F5E', zone: 'cocina' },
  jefe_meseros: { value: 'jefe_meseros', label: 'Jefe de Meseros', color: '#3B82F6', zone: 'comedor' },
  cocinero: { value: 'cocinero', label: 'Cocinero', color: '#F43F5E', zone: 'cocina' },
  ayudante_cocina: { value: 'ayudante_cocina', label: 'Ayudante de Cocina', color: '#FB7185', zone: 'cocina' },
  encargado_finca: { value: 'encargado_finca', label: 'Encargado de Finca', color: '#10B981', zone: 'finca' },
  mesero: { value: 'mesero', label: 'Mesero', color: '#3B82F6', zone: 'comedor' },
  auxiliar_comedor: { value: 'auxiliar_comedor', label: 'Auxiliar de Comedor', color: '#60A5FA', zone: 'comedor' },
};

export const ROLE_LIST = Object.values(ROLES);

export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.id, s]));
export const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map((p) => [p.id, p]));
