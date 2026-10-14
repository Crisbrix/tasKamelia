export const ZONES = {
  cocina: {
    id: 'cocina',
    label: 'Cocina',
    subtitle: 'Prioridad máxima',
    accent: '#FF2E63',
    rating: true,
    areas: ['Mise en place', 'Neveras', 'Aseo', 'Picado'],
    managerRoles: ['gerente', 'chef'],
    createRoles: ['cocinero', 'ayudante_cocina'],
  },
  finca: {
    id: 'finca',
    label: 'Finca',
    subtitle: 'Mantenimiento y aseo',
    accent: '#00E676',
    rating: true,
    areas: ['Mantenimiento', 'Aseo', 'Cultivos', 'Infraestructura'],
    managerRoles: ['gerente', 'auditor'],
    createRoles: ['encargado_finca'],
  },
  comedor: {
    id: 'comedor',
    label: 'Comedor',
    subtitle: 'Servicio',
    accent: '#00B0FF',
    rating: false,
    areas: ['Derecho', 'Izquierdo', 'Palco y Chalet', 'Envase', 'Reciclaje', 'Carritos', 'Servilletero'],
    managerRoles: ['gerente', 'jefe_meseros'],
    createRoles: ['mesero', 'auxiliar_comedor'],
  },
};

export const STATUSES = ['todo', 'doing', 'done'];
export const PRIORITIES = ['alta', 'media', 'baja'];

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
