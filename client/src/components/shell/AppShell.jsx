import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, KanbanSquare, LogOut, Users, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { accentText } from '../../lib/theme';
import { ROLES, ZONES } from '../../lib/constants';
import { manageableZones } from '../../lib/permissions';
import { BoardPage } from '../../pages/BoardPage';
import { UsersPage } from '../../pages/UsersPage';
import { ReportPage } from '../../pages/ReportPage';

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-kamelia">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-white" fill="currentColor">
          <path d="M12 2c1.8 2.2 2.7 4 2.7 5.6 1.6-1 3.5-1.4 5.6-1.2-.4 2.1-1.4 3.8-2.9 5 1.5 1.2 2.5 2.9 2.9 5-2.1.2-4-.2-5.6-1.2 0 1.6-.9 3.4-2.7 5.6-1.8-2.2-2.7-4-2.7-5.6-1.6 1-3.5 1.4-5.6 1.2.4-2.1 1.4-3.8 2.9-5-1.5-1.2-2.5-2.9-2.9-5 2.1-.2 4 .2 5.6 1.2C9.3 6 10.2 4.2 12 2Z" />
        </svg>
      </div>
      <p className="text-sm font-semibold tracking-tight text-white light:text-zinc-900">Tareas Kamelia</p>
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
    ...(user.role === 'gerente' ? [{ id: 'report', label: 'Reportes', Icon: BarChart3 }] : []),
  ];

  const iconButton =
    'rounded-md p-2 text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-100 light:text-zinc-500 light:hover:bg-black/[0.05] light:hover:text-zinc-900';

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-night-950/90 backdrop-blur-md light:border-black/[0.08] light:bg-[#F4F4F5]/90">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Brand />
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map(({ id, label, Icon }) => {
                const active = page === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPage(id)}
                    className="relative rounded-md px-3 py-1.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                        className="absolute inset-0 rounded-md bg-white/[0.08] light:bg-black/[0.06]"
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

          <div className="flex items-center gap-1.5">
            <div className="mr-1.5 hidden text-right sm:block">
              <p className="text-[13px] font-medium leading-tight text-zinc-100 light:text-zinc-900">{user.name}</p>
              <p className="text-[11px] leading-tight text-zinc-500">
                {role?.label}
                {zone ? ` · ${zone.label}` : ''}
              </p>
            </div>
            <span
              title={`${user.name} · ${role?.label || ''}`}
              className="mr-1 grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold"
              style={{ background: `${role?.color || '#F43F5E'}26`, color: roleColor }}
            >
              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </span>
            <button
              type="button"
              onClick={toggle}
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              aria-label="Alternar modo claro/oscuro"
              className={iconButton}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -60, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 60, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="block"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </motion.span>
              </AnimatePresence>
            </button>
            <button type="button" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión" className={iconButton}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {navItems.length > 1 && (
        <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-white/[0.07] bg-night-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md light:border-black/[0.08] light:bg-white/95 sm:hidden">
          {navItems.map(({ id, label, Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPage(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-zinc-50 light:text-zinc-900' : 'text-zinc-500'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </nav>
      )}

      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-8">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          >
            {page === 'board' ? (
              <BoardPage user={user} />
            ) : page === 'report' ? (
              <ReportPage />
            ) : (
              <UsersPage user={user} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
