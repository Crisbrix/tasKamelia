import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KanbanSquare, LogOut, Users, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { accentText } from '../../lib/theme';
import { ROLES, ZONES } from '../../lib/constants';
import { manageableZones } from '../../lib/permissions';
import { BoardPage } from '../../pages/BoardPage';
import { UsersPage } from '../../pages/UsersPage';

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        whileHover={{ rotate: 45, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        className="grid h-9 w-9 place-items-center rounded-xl bg-kamelia shadow-glow-brand"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M12 2c1.8 2.2 2.7 4 2.7 5.6 1.6-1 3.5-1.4 5.6-1.2-.4 2.1-1.4 3.8-2.9 5 1.5 1.2 2.5 2.9 2.9 5-2.1.2-4-.2-5.6-1.2 0 1.6-.9 3.4-2.7 5.6-1.8-2.2-2.7-4-2.7-5.6-1.6 1-3.5 1.4-5.6 1.2.4-2.1 1.4-3.8 2.9-5-1.5-1.2-2.5-2.9-2.9-5 2.1-.2 4 .2 5.6 1.2C9.3 6 10.2 4.2 12 2Z" />
        </svg>
      </motion.div>
      <div className="leading-tight">
        <p className="text-sm font-extrabold tracking-tight text-white light:text-zinc-900">Tareas Kamelia</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Control operativo</p>
      </div>
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggle, isLight } = useTheme();
  const [page, setPage] = useState('board');
  if (!user) return null;
  const role = ROLES[user.role];
  const zone = user.zone ? ZONES[user.zone] : null;
  const roleColor = accentText(role?.color, isLight);

  const navItems = [
    { id: 'board', label: 'Tablero', Icon: KanbanSquare },
    ...(manageableZones(user).length ? [{ id: 'users', label: 'Personal', Icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen">
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="sticky top-0 z-50 border-b border-white/[0.07] bg-night-950/80 backdrop-blur-xl light:border-black/10 light:bg-white/85"
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Brand />
            <nav className="hidden items-center gap-1.5 sm:flex">
              {navItems.map(({ id, label, Icon }) => {
                const active = page === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPage(id)}
                    className="relative rounded-lg px-3.5 py-2 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                        className="absolute inset-0 rounded-lg border border-white/15 bg-white/[0.09] light:border-black/10 light:bg-black/[0.06]"
                      />
                    )}
                    <span className={`relative z-10 flex items-center gap-2 ${active ? 'text-white light:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200 light:text-zinc-500 light:hover:text-zinc-800'}`}>
                      <Icon size={15} />
                      {label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold text-white light:text-zinc-900">{user.name}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: roleColor }}>
                {role?.label}
                {zone ? ` · ${zone.label}` : ''}
              </p>
            </div>
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-xs font-extrabold text-night-950"
              style={{ background: role?.color || '#FF2E63', boxShadow: `0 10px 26px -12px ${role?.color}` }}
            >
              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggle}
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              aria-label="Alternar modo claro/oscuro"
              className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-neon-amber/60 hover:text-neon-amber light:border-black/10 light:text-zinc-500"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                  className="block"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={logout}
              title="Cerrar sesión"
              className="rounded-lg border border-white/10 p-2 text-zinc-400 transition hover:border-kamelia/50 hover:text-kamelia light:border-black/10 light:text-zinc-500"
            >
              <LogOut size={16} />
            </motion.button>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 border-t border-white/[0.06] px-4 py-2 light:border-black/10 sm:hidden">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold ${
                page === id ? 'bg-white/10 text-white light:bg-black/[0.06] light:text-zinc-900' : 'text-zinc-500'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      </motion.header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            {page === 'board' ? <BoardPage user={user} /> : <UsersPage user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-6 pb-8 text-[11px] text-zinc-600 light:text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-kamelia" /> Tareas Kamelia · RBAC + auditoría por zonas
        </span>
        <span>Gerente · Auditor · Chef · Jefe de Meseros</span>
      </footer>
    </div>
  );
}
