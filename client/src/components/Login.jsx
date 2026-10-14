import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { accentText } from '../lib/theme';
import { Button } from './ui/Button';
import { ROLES } from '../lib/constants';

const DEMO = [{ email: 'kamelia@gmail.com', password: 'kamelia2026', role: 'gerente' }];

export function Login() {
  const { login } = useAuth();
  const { isLight } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const fill = (mail, pwd) => {
    setEmail(mail);
    setPassword(pwd || 'kamelia123');
    setError('');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-radial-fade" />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="glass relative z-10 w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-kamelia shadow-glow-brand">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
              <path d="M12 2c1.8 2.2 2.7 4 2.7 5.6 1.6-1 3.5-1.4 5.6-1.2-.4 2.1-1.4 3.8-2.9 5 1.5 1.2 2.5 2.9 2.9 5-2.1.2-4-.2-5.6-1.2 0 1.6-.9 3.4-2.7 5.6-1.8-2.2-2.7-4-2.7-5.6-1.6 1-3.5 1.4-5.6 1.2.4-2.1 1.4-3.8 2.9-5-1.5-1.2-2.5-2.9-2.9-5 2.1-.2 4 .2 5.6 1.2C9.3 6 10.2 4.2 12 2Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white light:text-zinc-900">Tareas Kamelia</h1>
            <p className="text-xs font-medium text-zinc-400 light:text-zinc-500">Operación · Roles · Auditoría</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Correo</label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-3 text-zinc-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@kamelia.com"
                className="field pl-9"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3 top-3 text-zinc-500" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field pl-9"
                autoComplete="current-password"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-kamelia/40 bg-kamelia/10 px-3 py-2 text-xs font-semibold text-kamelia-soft light:text-kamelia-deep"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {loading ? 'Verificando…' : 'Ingresar al tablero'}
          </Button>
        </form>

        <div className="mt-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            Acceso · Gerente
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map((d) => {
              const role = ROLES[d.role];
              return (
                <motion.button
                  key={d.email}
                  type="button"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 480, damping: 26 }}
                  onClick={() => fill(d.email, d.password)}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left text-xs font-semibold text-zinc-300 transition hover:border-white/25 hover:text-white light:border-black/10 light:bg-white light:text-zinc-700 light:hover:border-black/25 light:hover:text-zinc-900"
                >
                  <span className="block" style={{ color: accentText(role.color, isLight) }}>{role.label}</span>
                  <span className="block truncate text-[10px] font-medium text-zinc-500">{d.email}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
