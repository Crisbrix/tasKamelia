import { useEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Moon, ShieldCheck, Star, Sun, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { STATUS_MAP, ZONES } from '../lib/constants';

function Logo({ className = 'h-10 w-10', icon = 'h-[22px] w-[22px]' }) {
  return (
    <div className={`grid shrink-0 place-items-center rounded-xl bg-kamelia ${className}`}>
      <svg viewBox="0 0 24 24" className={`${icon} text-white`} fill="currentColor">
        <path d="M12 2c1.8 2.2 2.7 4 2.7 5.6 1.6-1 3.5-1.4 5.6-1.2-.4 2.1-1.4 3.8-2.9 5 1.5 1.2 2.5 2.9 2.9 5-2.1.2-4-.2-5.6-1.2 0 1.6-.9 3.4-2.7 5.6-1.8-2.2-2.7-4-2.7-5.6-1.6 1-3.5 1.4-5.6 1.2.4-2.1 1.4-3.8 2.9-5-1.5-1.2-2.5-2.9-2.9-5 2.1-.2 4 .2 5.6 1.2C9.3 6 10.2 4.2 12 2Z" />
      </svg>
    </div>
  );
}

// --- Vista previa animada del tablero (panel de marca) ---
const DEMO_COLUMNS = ['todo', 'doing', 'done'];
const DEMO_TASKS = [
  { id: 1, title: 'Limpiar campanas', zone: 'cocina', status: 'done', stars: 5 },
  { id: 2, title: 'Pedido de verduras', zone: 'cocina', status: 'doing' },
  { id: 3, title: 'Revisar riego', zone: 'finca', status: 'todo' },
  { id: 4, title: 'Montaje Palco y Chalet', zone: 'comedor', status: 'todo' },
  { id: 5, title: 'Temperatura neveras', zone: 'cocina', status: 'doing' },
];
const NEXT = { todo: 'doing', doing: 'done', done: 'todo' };

function BoardPreview() {
  const reduce = useReducedMotion();
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, [reduce]);

  // Cada ciclo avanza una tarea distinta; al llegar a Hecho recibe estrellas.
  useEffect(() => {
    if (!tick) return;
    setTasks((prev) => {
      const i = tick % prev.length;
      return prev.map((t, j) => {
        if (j !== i) return t;
        const status = NEXT[t.status];
        return { ...t, status, stars: status === 'done' ? 4 + (tick % 2) : undefined };
      });
    });
  }, [tick]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-night-900/80 p-3 shadow-pop light:border-black/[0.08] light:bg-white/80">
      <div className="mb-3 flex items-center gap-1.5 px-1">
        <span className="h-2.5 w-2.5 rounded-full bg-white/10 light:bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10 light:bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10 light:bg-black/10" />
        <span className="ml-2 text-[11px] text-zinc-500">Tablero · Hoy</span>
      </div>
      <LayoutGroup>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_COLUMNS.map((col) => {
            const status = STATUS_MAP[col];
            const items = tasks.filter((t) => t.status === col);
            return (
              <div key={col} className="min-h-[188px] rounded-lg bg-white/[0.025] p-1.5 light:bg-black/[0.03]">
                <div className="mb-1.5 flex items-center gap-1.5 px-1 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.accent }} />
                  <span className="text-[11px] font-medium text-zinc-300 light:text-zinc-700">{status.label}</span>
                  <span className="text-[11px] tabular-nums text-zinc-500">{items.length}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {items.map((t) => (
                    <motion.div
                      key={t.id}
                      layoutId={`demo-${t.id}`}
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      className="rounded-md border border-white/[0.07] bg-night-800 px-2 py-1.5 light:border-black/[0.07] light:bg-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ZONES[t.zone].accent }} />
                        <span className="truncate text-[11px] text-zinc-200 light:text-zinc-800">{t.title}</span>
                      </div>
                      {t.status === 'done' && t.stars && (
                        <motion.div
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                          className="mt-1 flex gap-0.5 pl-3"
                        >
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={9}
                              strokeWidth={2}
                              fill={s <= t.stars ? '#F59E0B' : 'transparent'}
                              stroke={s <= t.stars ? '#F59E0B' : 'rgba(127,127,140,0.5)'}
                            />
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

const FEATURES = [
  { Icon: ShieldCheck, text: 'Cada rol ve y gestiona solo lo que le corresponde' },
  { Icon: Star, text: 'Auditoría con estrellas en Cocina y Finca' },
  { Icon: UsersRound, text: 'Personal organizado por zona y estación' },
];

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden border-r border-white/[0.06] bg-night-900 lg:flex lg:flex-col lg:justify-between lg:p-12 light:border-black/[0.06] light:bg-white">
      {/* Retícula de puntos + halo de marca (estáticos). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 light:opacity-80"
        style={{
          backgroundImage: 'radial-gradient(rgba(127,127,140,0.22) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 75%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.16), transparent 65%)' }}
      />

      <div className="relative flex items-center gap-3">
        <Logo className="h-9 w-9" icon="h-5 w-5" />
        <span className="text-[15px] font-semibold tracking-tight text-white light:text-zinc-900">Tareas Kamelia</span>
      </div>

      <div className="relative mx-auto w-full max-w-[520px]">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 28, delay: 0.1 }}
          className="text-[32px] font-semibold leading-[1.15] tracking-tight text-white light:text-zinc-900"
        >
          La operación del día,
          <br />
          <span className="text-zinc-500">en un solo tablero.</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 28, delay: 0.2 }}
          className="mt-8"
        >
          <BoardPreview />
        </motion.div>
        <ul className="mt-8 space-y-3">
          {FEATURES.map(({ Icon, text }, i) => (
            <motion.li
              key={text}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30, delay: 0.3 + i * 0.07 }}
              className="flex items-center gap-3 text-sm text-zinc-400 light:text-zinc-600"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.08] bg-white/[0.03] text-zinc-300 light:border-black/[0.08] light:bg-black/[0.02] light:text-zinc-700">
                <Icon size={14} />
              </span>
              {text}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-4 text-xs text-zinc-500">
        {Object.values(ZONES).map((z) => (
          <span key={z.id} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: z.accent }} />
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({ id, label, icon: Icon, children }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className="group relative">
        <Icon
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-zinc-200 light:group-focus-within:text-zinc-800"
        />
        {children}
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const shake = useAnimationControls();

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
      shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.4 } });
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => setCapsLock(Boolean(e.getModifierState?.('CapsLock')));
  const inputClass = 'field h-11 pl-10';

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <div className="relative flex flex-col overflow-hidden px-5 py-6 sm:px-10">
        {/* En mobile el panel de marca no se muestra: mismo fondo de puntos y halo, más tenue. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] lg:hidden"
          style={{
            backgroundImage: 'radial-gradient(rgba(127,127,140,0.2) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-[380px] w-[380px] rounded-full lg:hidden"
          style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.18), transparent 65%)' }}
        />
        <div className="relative flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Logo className="h-8 w-8" icon="h-[18px] w-[18px]" />
            <span className="text-sm font-semibold tracking-tight text-white light:text-zinc-900">Tareas Kamelia</span>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label="Alternar modo claro/oscuro"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            className="rounded-md p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-100 light:hover:bg-black/[0.05] light:hover:text-zinc-900"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            className="w-full max-w-[380px]"
          >
            <h1 className="text-2xl font-semibold tracking-tight text-white light:text-zinc-900">Bienvenido de nuevo</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Ingresa con tu cuenta para ver el tablero de tu zona.</p>
            <div className="mt-4 flex flex-wrap gap-1.5 lg:hidden">
              {Object.values(ZONES).map((z) => (
                <span
                  key={z.id}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-night-900/70 px-2.5 py-1 text-xs text-zinc-400 light:border-black/[0.08] light:bg-white/70 light:text-zinc-600"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: z.accent }} />
                  {z.label}
                </span>
              ))}
            </div>

            <motion.form animate={shake} onSubmit={submit} className="mt-7 space-y-4">
              <Field id="email" label="Correo" icon={Mail}>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className={inputClass}
                  autoComplete="username"
                  inputMode="email"
                />
              </Field>

              <Field id="password" label="Contraseña" icon={Lock}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={onKey}
                  onKeyDown={onKey}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-zinc-500 transition hover:text-zinc-200 light:hover:text-zinc-800"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              <AnimatePresence initial={false}>
                {capsLock && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-neon-amber light:text-amber-700"
                  >
                    Bloq Mayús está activado
                  </motion.p>
                )}
                {error && (
                  <motion.p
                    key="error"
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg border border-kamelia/30 bg-kamelia/10 px-3 py-2.5 text-[13px] text-kamelia-soft light:text-kamelia-deep"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={loading ? undefined : { scale: 0.98 }}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-50 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-70 light:bg-zinc-900 light:text-white light:hover:bg-zinc-800"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verificando…
                  </>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>
            </motion.form>

            <p className="mt-8 flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck size={14} className="shrink-0" />
              ¿No puedes ingresar? Pide ayuda al Gerente o a tu jefe de zona.
            </p>
          </motion.div>
        </div>

        <p className="relative text-center text-[11px] text-zinc-600 lg:text-left light:text-zinc-400">Tareas Kamelia · Cocina, Finca y Comedor</p>
      </div>
    </div>
  );
}
