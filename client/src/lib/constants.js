export const ZONES = {
  cocina: {
    id: 'cocina',
    label: 'Cocina',
    subtitle: 'Prioridad máxima',
    accent: '#FF2E63',
    rating: true,
    areas: ['Mise en place', 'Neveras', 'Aseo', 'Picado'],
    description: 'Chef administra el personal y las tareas. El Auditor califica en "Hecho".',
  },
  finca: {
    id: 'finca',
    label: 'Finca',
    subtitle: 'Mantenimiento y aseo',
    accent: '#00E676',
    rating: true,
    areas: ['Mantenimiento', 'Aseo', 'Cultivos', 'Infraestructura'],
    description: 'El Auditor crea a los encargados, asigna trabajos y los califica.',
  },
  comedor: {
    id: 'comedor',
    label: 'Comedor',
    subtitle: 'Servicio',
    accent: '#00B0FF',
    rating: false,
    areas: ['Derecho', 'Izquierdo', 'Palco y Chalet', 'Envase', 'Reciclaje', 'Carritos', 'Servilletero'],
    description: 'El Jefe de Meseros gestiona al personal de servicio del comedor.',
  },
};

export const ZONE_LIST = Object.values(ZONES);

export const STATUSES = [
  { id: 'todo', label: 'Por Hacer', accent: '#7C4DFF' },
  { id: 'doing', label: 'Haciendo', accent: '#00B0FF' },
  { id: 'done', label: 'Hecho', accent: '#00E676' },
];

export const PRIORITIES = [
  { id: 'alta', label: 'Alta', color: '#FF2E63' },
  { id: 'media', label: 'Media', color: '#FFC400' },
  { id: 'baja', label: 'Baja', color: '#00B0FF' },
];

export const ROLES = {
  gerente: { value: 'gerente', label: 'Gerente', color: '#FFC400', zone: null },
  auditor: { value: 'auditor', label: 'Auditor', color: '#FF6B00', zone: null },
  chef: { value: 'chef', label: 'Chef', color: '#FF2E63', zone: 'cocina' },
  jefe_meseros: { value: 'jefe_meseros', label: 'Jefe de Meseros', color: '#00B0FF', zone: 'comedor' },
  cocinero: { value: 'cocinero', label: 'Cocinero', color: '#FF2E63', zone: 'cocina' },
  ayudante_cocina: { value: 'ayudante_cocina', label: 'Ayudante de Cocina', color: '#FF7A9C', zone: 'cocina' },
  encargado_finca: { value: 'encargado_finca', label: 'Encargado de Finca', color: '#00E676', zone: 'finca' },
  mesero: { value: 'mesero', label: 'Mesero', color: '#00B0FF', zone: 'comedor' },
  auxiliar_comedor: { value: 'auxiliar_comedor', label: 'Auxiliar de Comedor', color: '#57D3FF', zone: 'comedor' },
};

export const ROLE_LIST = Object.values(ROLES);

export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.id, s]));
export const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map((p) => [p.id, p]));
