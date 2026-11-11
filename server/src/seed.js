export const SEED_PASSWORD = 'kamelia123';

export const seedUsers = [
  {
    name: 'Vanesa Diaz',
    email: 'kamelia@gmail.com',
    password: 'kamelia2026',
    role: 'gerente',
    zone: null,
    station: null,
  },
];

/* Listas físicas del Rancho Criadero La Kamelia (Cocina).
   Áreas: Inventario (Pedidos), Administrativo y Aseo (check list). */
const PEDIDOS_INVENTARIO = [
  'Revisar Gas',
  'Pedido Papa R12',
  'Pedido Carne Don leo',
  'Pedido Riwo kar',
  'Pedido Sopa',
  'Pedido Morcilla',
  'Pedido Chorizo',
  'Pedido hiper marfish',
  'Pedir Bolsas',
  'Pedir Guantes - Botas',
  'Pedir Colanta',
  'Pedir Desengrasante',
  'Pedir Bolsa Selladora',
  'Pedir tocineta',
  'Pedir Carbon',
  'Pedir Pollo',
  'Pedir Cajas y Vasos kamelia',
  'Hacer Mercado',
  'Pedir Coca-Cola',
  'Pedir Postobon',
  'Pedir Sabor Suizo',
  'Pedir Makro',
];

const ADMINISTRATIVO = ['Meter Facturas al Sistema', 'Actualizar Formatos'];

const ASEO_COCINA = [
  'Limpiar Campanas',
  'Neveras',
  'Horno',
  'Wok',
  'Estufas-planchas',
  'Broiler',
  'Plancha',
  'Parrilla-Carbonera',
  'Estufa',
  'Freidoras',
  'Mueble Apanado',
  'Mueble Entradas',
  'Conservador Ent',
  'Baño Maria',
  'Entrega Ent',
  'Entregas Fuertes',
  'Conservadores',
  'Mueble Neveras',
  'Mueble Parrilla',
  'Mueble Ensamble',
  'Poso',
  'Trampas Grasa',
  'Lavado Canastillas',
  'Lockers',
  'Carcamos',
  'Baño Personal',
  'Pasar tablas',
  'Pasar menaje',
  'Escabiladero',
  'Pasillo Casa',
];

const seed = (titles, area, priority) =>
  titles.map((title) => ({
    title,
    description: null,
    zone: 'cocina',
    area,
    status: 'todo',
    priority,
    assignee: null,
    createdBy: 'kamelia@gmail.com',
  }));

export const seedTasks = [
  ...seed(PEDIDOS_INVENTARIO, 'Inventario', 'media'),
  ...seed(ADMINISTRATIVO, 'Administrativo', 'media'),
  ...seed(ASEO_COCINA, 'Aseo', 'baja'),
];
