import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

export function Login() {
  const { login } = useAuth();
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-radial-fade" />
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
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
      </motion.div>
    </div>
  );
}
