// Suite E2E de RBAC y flujos de Tareas Kamelia.
// Requiere la API corriendo: npm run dev (o npm run dev:server)
// Uso: npm test   |   API_URL=http://localhost:4000 npm test

const BASE = process.env.API_URL || 'http://localhost:4000';
const TS = Date.now();
const tmp = (n) => `temp.${n}.${TS}@kamelia.com`;
let pass = 0;
let fail = 0;

const check = (name, cond, extra = '') => {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name} ${extra}`);
  }
};

async function login(email, password = 'kamelia123') {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`login ${email}: ${data.message}`);
  return data;
}

async function call(token, method, path, body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

console.log(`\nAPI: ${BASE}\n`);

const gerente = await login('kamelia@gmail.com', 'kamelia2026');
check('Login Gerente (Vanesa Diaz) + JWT', Boolean(gerente.token) && gerente.user?.role === 'gerente');

const mkRole = async (name, role, zone) => {
  const res = await call(gerente.token, 'POST', '/users', {
    name,
    email: tmp(role),
    password: 'secret123',
    role,
    ...(zone ? { zone } : {}),
  });
  return res;
};
const mkAuditor = await mkRole('Auditor Test', 'auditor');
const mkChef = await mkRole('Chef Test', 'chef', 'cocina');
const mkJefe = await mkRole('Jefe Test', 'jefe_meseros', 'comedor');
check(
  'Gerente crea cuentas de prueba (auditor/chef/jefe)',
  mkAuditor.status === 201 && mkChef.status === 201 && mkJefe.status === 201,
);
const auditor = await login(mkAuditor.data.email, 'secret123');
const chef = await login(mkChef.data.email, 'secret123');
const jefe = await login(mkJefe.data.email, 'secret123');
check('Login + JWT de los roles creados', Boolean(auditor.token && chef.token && jefe.token));

const noAuth = await call(null, 'GET', '/tasks?zone=cocina');
check('401 sin token', noAuth.status === 401);

const me = await call(auditor.token, 'GET', '/auth/me');
check('GET /auth/me devuelve el usuario', me.status === 200 && me.data.role === 'auditor');

// --- Creación de usuarios según rol ---
const g1 = await call(gerente.token, 'POST', '/users', {
  name: 'Usuario Gerencia',
  email: tmp('gerencia'),
  password: 'secret123',
  role: 'chef',
});
check('Gerente crea un Chef', g1.status === 201, JSON.stringify(g1.data));

const c1 = await call(chef.token, 'POST', '/users', {
  name: 'Cocinero Nuevo',
  email: tmp('cocinero'),
  password: 'secret123',
  role: 'cocinero',
  zone: 'cocina',
});
check('Chef crea cocinero en Cocina', c1.status === 201, JSON.stringify(c1.data));

const c2 = await call(chef.token, 'POST', '/users', {
  name: 'Mesero Intruso',
  email: tmp('mesero'),
  password: 'secret123',
  role: 'mesero',
  zone: 'comedor',
});
check('Chef NO puede crear personal de Comedor (403)', c2.status === 403, `status=${c2.status}`);

const j1 = await call(jefe.token, 'POST', '/users', {
  name: 'Mesero Nuevo',
  email: tmp('jefe'),
  password: 'secret123',
  role: 'mesero',
  zone: 'comedor',
  station: 'Derecho',
});
check('Jefe de Meseros crea mesero', j1.status === 201, JSON.stringify(j1.data));

const a1 = await call(auditor.token, 'POST', '/users', {
  name: 'Encargado Finca',
  email: tmp('finca'),
  password: 'secret123',
  role: 'encargado_finca',
  zone: 'finca',
});
check('Auditor crea encargado de Finca', a1.status === 201, JSON.stringify(a1.data));

const a2 = await call(auditor.token, 'POST', '/users', {
  name: 'No Debe',
  email: tmp('nodebe'),
  password: 'secret123',
  role: 'mesero',
  zone: 'comedor',
});
check('Auditor NO puede crear personal de Comedor (403)', a2.status === 403, `status=${a2.status}`);

const a3 = await call(auditor.token, 'POST', '/users', {
  name: 'Cocinero Auditor',
  email: tmp('audcoc'),
  password: 'secret123',
  role: 'cocinero',
  zone: 'cocina',
});
check('Auditor SI puede crear personal de Cocina', a3.status === 201, JSON.stringify(a3.data));

// --- Lectura de tareas por zona ---
const tasksCocina = await call(auditor.token, 'GET', '/tasks?zone=cocina');
check('Auditor lista tareas de Cocina', tasksCocina.status === 200 && Array.isArray(tasksCocina.data));

// --- Semilla de las listas físicas (idempotente por título) ---
const seedTitles = tasksCocina.data.map((t) => t.title);
check(
  'Seed de Cocina: ≥54 tareas de las listas físicas',
  tasksCocina.data.length >= 54 && ['Revisar Gas', 'Pedido Papa R12', 'Meter Facturas al Sistema', 'Limpiar Campanas'].every((x) => seedTitles.includes(x)),
  `total=${tasksCocina.data.length}`,
);
const seedAreas = new Set(tasksCocina.data.map((t) => t.area));
check(
  'Seed cubre áreas Inventario, Administrativo y Aseo',
  ['Inventario', 'Administrativo', 'Aseo'].every((a) => seedAreas.has(a)),
  JSON.stringify([...seedAreas]),
);

const comedorTasks = await call(jefe.token, 'GET', '/tasks?zone=comedor');
check('Jefe lista tareas de Comedor', comedorTasks.status === 200 && Array.isArray(comedorTasks.data));

// --- Alta de tareas y validación de áreas ---
const createTask = await call(chef.token, 'POST', '/tasks', {
  title: `Tarea E2E ${TS}`,
  description: 'Creada por la suite automatizada',
  zone: 'cocina',
  area: 'Neveras',
  priority: 'alta',
});
check('Chef crea tarea en Cocina', createTask.status === 201, JSON.stringify(createTask.data));

const badArea = await call(chef.token, 'POST', '/tasks', {
  title: 'Area invalida',
  zone: 'cocina',
  area: 'Jardineria',
});
check('Rechaza área que no pertenece a la zona (400)', badArea.status === 400, `status=${badArea.status}`);

// --- Flujo Hecho + auditoría por estrellas ---
if (createTask.status === 201) {
  const id = createTask.data.id;
  const move = await call(chef.token, 'PATCH', `/tasks/${id}`, { status: 'done' });
  check('Mover tarea a Hecho', move.status === 200 && move.data.status === 'done');

  const r2 = await call(chef.token, 'POST', `/tasks/${id}/rate`, { stars: 5 });
  check('Chef NO puede calificar (403)', r2.status === 403, `status=${r2.status}`);

  const r1 = await call(auditor.token, 'POST', `/tasks/${id}/rate`, { stars: 4, comment: 'OK E2E' });
  check('Auditor califica con estrellas', r1.status === 200 && r1.data.rating?.stars === 4, JSON.stringify(r1.data?.rating));

  const r3 = await call(auditor.token, 'POST', `/tasks/${id}/rate`, { stars: 9 });
  check('Rechaza estrellas fuera de 1-5 (400)', r3.status === 400, `status=${r3.status}`);

  const r5 = await call(gerente.token, 'POST', `/tasks/${id}/rate`, { stars: 5 });
  check('Gerente puede recalificar', r5.status === 200 && r5.data.rating?.stars === 5, JSON.stringify(r5.data?.rating));

  const personalMove = await call(auditor.token, 'PATCH', `/tasks/${id}`, { status: 'doing' });
  check('Auditor puede reposicionar en Cocina', personalMove.status === 200, `status=${personalMove.status}`);
}

// --- Columna "Auditado" (4ª columna: solo Gerente, solo desde Hecho y con estrellas) ---
const auditTask = await call(chef.token, 'POST', '/tasks', {
  title: `Auditoria E2E ${TS}`,
  zone: 'cocina',
  area: 'Aseo',
  priority: 'media',
});
if (auditTask.status === 201) {
  const aid = auditTask.data.id;

  const s1 = await call(gerente.token, 'PATCH', `/tasks/${aid}`, { status: 'auditado' });
  check('No se audita una tarea sin terminar (400)', s1.status === 400, `status=${s1.status}`);

  await call(chef.token, 'PATCH', `/tasks/${aid}`, { status: 'done' });
  const s2 = await call(gerente.token, 'PATCH', `/tasks/${aid}`, { status: 'auditado' });
  check('No se audita sin calificación (400)', s2.status === 400, `status=${s2.status}`);

  await call(auditor.token, 'POST', `/tasks/${aid}/rate`, { stars: 3 });
  const s3 = await call(auditor.token, 'PATCH', `/tasks/${aid}`, { status: 'auditado' });
  check('Auditor NO mueve a Auditado (403)', s3.status === 403, `status=${s3.status}`);

  const s4 = await call(gerente.token, 'PATCH', `/tasks/${aid}`, { status: 'auditado' });
  check(
    'Gerente mueve a Auditado conservando completedAt',
    s4.status === 200 && s4.data.status === 'auditado' && Boolean(s4.data.completedAt),
    JSON.stringify({ status: s4.data?.status, completedAt: s4.data?.completedAt }),
  );

  const s5 = await call(gerente.token, 'PATCH', `/tasks/${aid}`, { status: 'done' });
  check('Auditado vuelve a Hecho', s5.status === 200 && s5.data.status === 'done', `status=${s5.status}`);

  // El Gerente puede calificar también desde Auditado
  const s6 = await call(gerente.token, 'POST', `/tasks/${aid}/rate`, { stars: 5 });
  check('Se recalifica desde Auditado', s6.status === 200 && s6.data.rating?.stars === 5, `status=${s6.status}`);

  await call(gerente.token, 'DELETE', `/tasks/${aid}`);
}

// --- Reporte de calificaciones (solo Gerente) ---
const repAuditor = await call(auditor.token, 'GET', '/ratings/report');
check('Reporte NO disponible para Auditor (403)', repAuditor.status === 403, `status=${repAuditor.status}`);

const repGerente = await call(gerente.token, 'GET', '/ratings/report');
check(
  'Gerente obtiene el reporte con historial de 8 semanas',
  repGerente.status === 200 && Array.isArray(repGerente.data.history) && repGerente.data.history.length === 8,
  JSON.stringify(repGerente.data?.history?.length ?? repGerente.data),
);
check(
  'Reporte incluye promedio semanal y peores tareas',
  repGerente.status === 200 && 'weeklyAvg' in repGerente.data && Array.isArray(repGerente.data.worst) && typeof repGerente.data.total === 'number',
  JSON.stringify({ weeklyAvg: repGerente.data?.weeklyAvg, worst: repGerente.data?.worst?.length, total: repGerente.data?.total }),
);

// --- Comedor no admite calificación ---
const comedorTask = await call(jefe.token, 'POST', '/tasks', {
  title: `Servicio E2E ${TS}`,
  zone: 'comedor',
  area: 'Derecho',
});
if (comedorTask.status === 201) {
  await call(jefe.token, 'PATCH', `/tasks/${comedorTask.data.id}`, { status: 'done' });
  const r4 = await call(auditor.token, 'POST', `/tasks/${comedorTask.data.id}/rate`, { stars: 3 });
  check('Comedor no admite calificación (403)', r4.status === 403, `status=${r4.status}`);

  const rAudit = await call(gerente.token, 'PATCH', `/tasks/${comedorTask.data.id}`, { status: 'auditado' });
  check('Comedor no tiene columna Auditado (403)', rAudit.status === 403, `status=${rAudit.status}`);
}

// --- Baja de usuarios ---
const delUnauth = await call(null, 'DELETE', `/users/${c1.data.id}`);
check('Eliminar sin token (401)', delUnauth.status === 401, `status=${delUnauth.status}`);

const delMissing = await call(gerente.token, 'DELETE', '/users/999999');
check('Eliminar usuario inexistente (404)', delMissing.status === 404, `status=${delMissing.status}`);

const chefDeletesOwn = await call(chef.token, 'DELETE', `/users/${c1.data.id}`);
check('Chef elimina su cocinero', chefDeletesOwn.status === 200 && chefDeletesOwn.data.ok === true);

const chefCantDeleteComedor = await call(chef.token, 'DELETE', `/users/${j1.data.id}`);
check('Chef NO elimina mesero de Comedor (403)', chefCantDeleteComedor.status === 403, `status=${chefCantDeleteComedor.status}`);

const auditorDeletesCocina = await call(auditor.token, 'DELETE', `/users/${a3.data.id}`);
check('Auditor elimina personal de Cocina', auditorDeletesCocina.status === 200);

const auditorCantDeleteComedor = await call(auditor.token, 'DELETE', `/users/${j1.data.id}`);
check('Auditor NO elimina mesero de Comedor (403)', auditorCantDeleteComedor.status === 403, `status=${auditorCantDeleteComedor.status}`);

const jefeDeletesOwn = await call(jefe.token, 'DELETE', `/users/${j1.data.id}`);
check('Jefe elimina su mesero', jefeDeletesOwn.status === 200);

const meInfo = await call(gerente.token, 'GET', '/auth/me');
const selfDelete = await call(gerente.token, 'DELETE', `/users/${meInfo.data.id}`);
check('Nadie puede eliminarse a sí mismo (403)', selfDelete.status === 403, `status=${selfDelete.status}`);

const gone = await call(gerente.token, 'DELETE', `/users/${c1.data.id}`);
check('Eliminar dos veces devuelve 404', gone.status === 404, `status=${gone.status}`);

// --- Edición y baja de tareas ---
const editUnauth = await call(null, 'PATCH', `/tasks/${createTask.data.id}`, { title: 'X' });
check('Editar sin token (401)', editUnauth.status === 401, `status=${editUnauth.status}`);

const chefEditsOwn = await call(chef.token, 'PATCH', `/tasks/${createTask.data.id}`, { title: `Tarea E2E ${TS} (editada)`, priority: 'baja' });
check('Chef edita tarea de Cocina', chefEditsOwn.status === 200 && chefEditsOwn.data.title.includes('(editada)'), JSON.stringify(chefEditsOwn.data?.title));

const chefCantEditComedor = await call(chef.token, 'PATCH', `/tasks/${comedorTask.data.id}`, { title: 'X' });
check('Chef NO edita tarea de Comedor (403)', chefCantEditComedor.status === 403, `status=${chefCantEditComedor.status}`);

const delTaskUnauth = await call(null, 'DELETE', `/tasks/${createTask.data.id}`);
check('Eliminar tarea sin token (401)', delTaskUnauth.status === 401, `status=${delTaskUnauth.status}`);

const delTaskMissing = await call(gerente.token, 'DELETE', '/tasks/999999');
check('Eliminar tarea inexistente (404)', delTaskMissing.status === 404, `status=${delTaskMissing.status}`);

const chefCantDeleteComedorTask = await call(chef.token, 'DELETE', `/tasks/${comedorTask.data.id}`);
check('Chef NO elimina tarea de Comedor (403)', chefCantDeleteComedorTask.status === 403, `status=${chefCantDeleteComedorTask.status}`);

const auditorDeletesCocinaTask = await call(auditor.token, 'DELETE', `/tasks/${createTask.data.id}`);
check('Auditor elimina tarea de Cocina', auditorDeletesCocinaTask.status === 200 && auditorDeletesCocinaTask.data.ok === true);

const jefeDeletesComedor = await call(jefe.token, 'DELETE', `/tasks/${comedorTask.data.id}`);
check('Jefe elimina tarea de Comedor', jefeDeletesComedor.status === 200);

const goneTask = await call(gerente.token, 'DELETE', `/tasks/${comedorTask.data.id}`);
check('Eliminar tarea dos veces devuelve 404', goneTask.status === 404, `status=${goneTask.status}`);

// --- Métricas ---
const overview = await call(auditor.token, 'GET', '/overview');
check(
  'Overview con métricas por zona',
  overview.status === 200 && Boolean(overview.data.zones?.cocina),
  JSON.stringify(overview.data),
);

// --- Limpieza de cuentas de prueba ---
const clean = await Promise.all(
  [mkAuditor.data.id, mkChef.data.id, mkJefe.data.id].map((id) => call(gerente.token, 'DELETE', `/users/${id}`)),
);
check('Limpieza de cuentas de prueba', clean.every((r) => r.status === 200));

console.log(`\nResultado: ${pass} pass, ${fail} fail\n`);
process.exit(fail ? 1 : 0);
