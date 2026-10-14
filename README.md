# Tareas Kamelia

Aplicación web de **gestión operativa, control de roles (RBAC) y auditoría de tareas** dividida por zonas de importancia, con tablero Kanban arrastrable, calificación por estrellas y panel de administración de usuarios.

Interfaz **dark mode de alto contraste** (sin colores pastel) con **modo claro** alternable desde el header (☀/🌙, se guarda en `localStorage`), animaciones con **físicas de resorte (spring)**, **glassmorphism** sutil y transiciones dinámicas en pestañas, tarjetas y modales. Los menús desplegables usan fondo **sólido** (`.menu`) en ambos temas para máxima legibilidad, y los acentos de texto se oscurecen automáticamente en modo claro (`lib/theme.js`) para mantener el contraste.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite + Tailwind CSS 3 |
| Animaciones | Framer Motion (springs, `layoutId`, `AnimatePresence`) |
| Drag & Drop | `@dnd-kit/core` con `DragOverlay` y micro-feedback al soltar en "Hecho" |
| Backend | Node.js + Express (ESM) |
| Base de datos | **TiDB** (MySQL compatible vía `mysql2`) con **fallback automático a memoria** |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |

---

## Puesta en marcha

```bash
npm run install:all      # instala raíz, server y client
npm run dev              # levanta API (:4000) y Vite (:5173) en paralelo
```

- App: <http://localhost:5173>
- API: <http://localhost:4000/api/health>

### Credenciales

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Gerente (Super Admin) | `kamelia@gmail.com` (Vanesa Diaz) | `kamelia2026` |

Los demás roles (Auditor, Chef, Jefe de Meseros, personal) se crean desde el módulo **Personal**. Si la base de datos está vacía, la app siembra únicamente esta cuenta.

### Conectar TiDB (opcional)

Copia `server/.env.example` a `server/.env` y define `DATABASE_URL` (o `TIDB_HOST`, `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DATABASE`).
Si no hay credenciales o TiDB no responde, el servidor arranca con **store en memoria** sembrado con datos de demostración (el esquema SQL vive en `server/src/db/schema.sql`).

```bash
# Ejemplo
DATABASE_URL=mysql://usuario:clave@gateway01.xxx.tidbcloud.com:4006/kamelia?ssl=true npm run dev:server
```

---

## Sistema de roles (RBAC)

| Rol | Puede |
| --- | --- |
| **Gerente** | Control total: crea, visualiza y elimina **cualquier rol y zona**, gestiona las 3 zonas, califica tareas y administra usuarios |
| **Auditor** | Gestiona usuarios de **Cocina + Finca** (crear, ver, eliminar); gestiona tareas de **Finca** y **califica** tareas en "Hecho" de **Cocina** y **Finca** |
| **Chef** | Administra **Cocina**: crea, visualiza y elimina personal de cocina y asigna tareas |
| **Jefe de Meseros** | Administra **Comedor**: crea, visualiza y elimina meseros |
| Personal de zona | Solo arrastra/mueve sus propias tareas |

Nadie puede eliminarse a sí mismo. El módulo **Personal** (nav) muestra a cada gestor solo las zonas que administra; el Gerente además tiene el tab **Directorio** global.

La validación vive en **servidor** (`server/src/rbac.js`) y se replica en cliente (`client/src/lib/permissions.js`):

```js
canManageZone(user, zone)   // quién administra cada zona
canCreateUser(user, role, zone) // quién crea qué rol
canRate(user, task)         // if (role === 'Auditor' || role === 'Gerente') && zone.rating && status === 'done'
canEditTask(user, task)     // jefe de zona, gerente o encargado de la tarea
```

Los componentes de calificación y de creación de usuarios quedan **envueltos por estas validaciones** en UI y vuelven a validarse en la API.

---

## Zonas y flujos

1. **Cocina (prioridad máxima)** — sub-pestañas por área (*Mise en place, Neveras, Aseo, Picado*), cada una con su propio Kanban: las áreas no comparten tareas.
   Chef crea personal/tarea → el personal arrastra a **Hecho** → se desbloquea el **Star Rating** para Auditor/Gerente.
2. **Finca (mantenimiento y aseo)** — gestión exclusiva del **Auditor**: crea encargados, asigna trabajos y los califica al pasar a "Hecho".
3. **Comedor (servicio)** — estaciones: Derecho, Izquierdo, Palco y Chalet, Envase, Reciclaje, Carritos, Servilletero. El **Jefe de Meseros** crea y gestiona al personal de servicio.

---

## Cómo probarlo

### 1. Automatizado (31 aserciones de RBAC + flujos)

```bash
npm run dev      # terminal 1: API :4000 + app :5173
npm test         # terminal 2: suite E2E (idempotente, usa correos únicos)
```

Cubre: JWT/401, creación y eliminación de usuarios por rol (403 cruzados, 404, sin auto-eliminación), validación de áreas, mover a "Hecho", calificación 1–5, recalificación del Gerente y bloqueo de estrellas en Comedor.

| # | Rol | Qué verificar |
| --- | --- | --- |
| 8 | Auditor | Menú **Personal** → tabs Cocina/Finca (sin Directorio): crea un cocinero y elimínalo con el botón 🗑 (confirma en 2 pasos: *Eliminar*) |
| 9 | Gerente | **Personal → Directorio**: crea cualquier rol, filtra por rol/zona y elimina usuarios |
| 10 | Jefe de Meseros | **Personal** → solo tab Comedor; el personal de base no lo ve (sin nav) |

### 2. Manual en el navegador

Abre <http://localhost:5173> y recorre estos casos (entra como `kamelia@gmail.com` / `kamelia2026` y crea cada rol desde **Personal**):

| # | Rol | Qué verificar |
| --- | --- | --- |
| 1 | Chef | Pestaña **Cocina** → botón *Nueva tarea* y *Personal* visibles; crea personal y tareas; arrastra una tarjeta a **Hecho** → micro-feedback (anillo verde + check) |
| 2 | Chef | En tarjetas "Hecho" de Cocina aparece **"Pendiente"** con candado (no puedes calificar) |
| 3 | Auditor | Entra a **Cocina**, tarjeta "Hecho" → las 5 estrellas se activan; al puntuar aparece toast ámbar y badge con tu nombre |
| 4 | Auditor | Pestaña **Finca** → crea encargados desde *Personal*, asigna tarea y califícala al pasarla a Hecho |
| 5 | Jefe de Meseros | **Comedor**: conforma el personal por estación (Derecho, Izquierdo, Palco y Chalet, Envase, Reciclaje, Carritos, Servilletero); las tarjetas Hecho **no** muestran estrellas |
| 6 | Gerente | Menú **Personal → Directorio** → dropdown de rol + zona + estación; crea usuarios de cualquier rol y filtra el directorio |
| 7 | Cualquiera | Cambia de pestaña → transición con blur/spring; el contador ámbar marca tareas sin revisar |
| 11 | Cualquiera | Botón ☀/🌙 en el header → modo claro con tarjetas blancas y mismo contraste; la elección persiste al recargar |

Acceso rápido en el login con la cuenta de Vanesa Diaz (`kamelia@gmail.com` / `kamelia2026`).

### 3. Producción

```bash
npm run build    # genera client/dist
npm start        # API (sirve opcionalmente el build si se configura)
```

---

## Estructura

```
task/
├── package.json            # scripts raíz (dev con concurrently)
├── server/
│   └── src/
│       ├── index.js        # Express + rutas + error handler
│       ├── config.js       # variables de entorno
│       ├── rbac.js         # permisos (fuente de verdad)
│       ├── constants.js    # zonas, roles, estados
│       ├── seed.js         # datos demo (incluye Comedor)
│       ├── auth.js         # JWT + middleware requireAuth
│       ├── db/{pool.js,schema.sql}
│       ├── store/{index.js,memory.js,mysql.js}
│       └── routes/{auth.js,users.js,tasks.js}
└── client/
    └── src/
        ├── App.jsx / main.jsx / index.css
        ├── lib/{api.js,constants.js,permissions.js}
        ├── context/AuthContext.jsx
        ├── pages/{BoardPage.jsx,AdminUsers.jsx}
        └── components/
            ├── shell/AppShell.jsx
            ├── ui/{Button,Select,Modal,Toast}
            ├── ZoneTabs.jsx        # pestañas animadas + métricas
            ├── kanban/{KanbanBoard,Column,TaskCard,TaskModal}
            ├── audit/StarRating.jsx
            ├── team/TeamPanel.jsx
            └── Login.jsx
```

---

## API

| Método | Ruta | Auth | Notas |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | – | devuelve `{ token, user }` |
| GET | `/api/auth/me` | ✓ | usuario del token |
| GET | `/api/users?zone=` | ✓ | filtrado por permisos de zona |
| GET | `/api/users/roles` | ✓ | roles que el usuario puede asignar |
| POST | `/api/users` | ✓ | `canCreateUser` (403 si no aplica) |
| DELETE | `/api/users/:id` | ✓ | `canDeleteUser`: solo personal gestionable, nunca a sí mismo |
| GET | `/api/tasks?zone=&area=` | ✓ | tareas con rating embebido |
| POST | `/api/tasks` | ✓ | solo jefe de zona/gerente |
| PATCH | `/api/tasks/:id` | ✓ | mover entre columnas, reasignar |
| DELETE | `/api/tasks/:id` | ✓ | `canDeleteTask`: Gerente todo; gestores solo en sus zonas |
| POST | `/api/tasks/:id/rate` | ✓ | estrellas 1–5, solo Auditor/Gerente en Cocina/Finca |
| GET | `/api/overview` | ✓ | métricas por zona |

---

## Verificación

- `npm run build --prefix client` → build de producción OK.
- `npm test` → suite E2E (`scripts/rbac-test.mjs`), 43 aserciones, ejecutable de forma repetida.
- Flujos de navegador verificados con automatización (drag Por Hacer→Haciendo con PATCH 200; CRUD de usuarios por rol; consola sin errores).
