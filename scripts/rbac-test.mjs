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

const gerente = await login('gerente@kamelia.com');
const auditor = await login('auditor@kamelia.com');
const chef = await login('chef@kamelia.com');
const jefe = await login('jefe.meseros@kamelia.com');
check('Login + JWT emitido para los 4 roles base', Boolean(gerente.token && auditor.token && chef.token && jefe.token));

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
check('Auditor ve tareas de Cocina', tasksCocina.status === 200 && tasksCocina.data.length > 0);

const comedorTasks = await call(jefe.token, 'GET', '/tasks?zone=comedor');
check('Jefe ve tareas de Comedor (mock)', comedorTasks.status === 200 && comedorTasks.data.length > 0);

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

// --- Métricas ---
const overview = await call(auditor.token, 'GET', '/overview');
check(
  'Overview con métricas por zona',
  overview.status === 200 && Boolean(overview.data.zones?.cocina),
  JSON.stringify(overview.data),
);

console.log(`\nResultado: ${pass} pass, ${fail} fail\n`);
process.exit(fail ? 1 : 0);
