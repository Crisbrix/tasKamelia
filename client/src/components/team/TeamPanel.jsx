import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, UserPlus, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { ZONES, ROLES } from '../../lib/constants';
import { assignableRoles, canManageUsers } from '../../lib/permissions';
import { accentText } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DeleteUserButton } from '../users/DeleteUserButton';

const initials = (name = '?') =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function TeamPanel({ open, onClose, zone, user, staff, onRefresh }) {
  const toast = useToast();
  const { isLight } = useTheme();
  const zoneInfo = ZONES[zone];
  const accent = accentText(zoneInfo.accent, isLight);
  const allowed = canManageUsers(user, zone);
  const roleOptions = assignableRoles(user, zone).map((r) => ({ value: r.value, label: r.label, color: r.color }));

  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', station: '' });
  const [loading, setLoading] = useState(false);

  if (!allowed) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setRole = (role) =>
    setForm((f) => ({
      ...f,
      role,
      station: ROLES[role]?.zone === zone ? f.station : '',
    }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.push('Selecciona un rol para la persona', 'error');
    setLoading(true);
    try {
      await api.createUser({ ...form, zone, station: form.station || null });
      toast.push(`${form.name} fue añadido al equipo de ${zoneInfo.label}`, 'success');
      setForm({ name: '', email: '', password: '', role: '', station: '' });
      onRefresh?.();
    } catch (err) {
      toast.push(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="glass-strong relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden border-l"
            style={{ borderColor: `${zoneInfo.accent}44` }}
          >
            <header
              className="flex items-center justify-between border-b border-white/10 px-5 py-4"
              style={{ background: `linear-gradient(135deg, ${zoneInfo.accent}22, transparent)` }}
            >
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: accent }}>
                  Personal · {zoneInfo.label}
                </p>
                <h2 className="text-lg font-extrabold text-white light:text-zinc-900">Equipo de zona</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white light:hover:bg-black/5 light:hover:text-zinc-900"
                aria-label="Cerrar panel"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              <section>
                <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                  <Users size={13} /> {staff.length} en activo
                </p>
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {staff.map((member, i) => {
                      const role = ROLES[member.role];
                      return (
                        <motion.li
                          key={member.id}
                          layout
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 32, delay: i * 0.03 }}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 light:border-black/10 light:bg-white"
                        >
                          <span
                            className="grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold text-night-950"
                            style={{ background: role?.color || '#888' }}
                          >
                            {initials(member.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-white light:text-zinc-900">{member.name}</span>
                            <span className="block truncate text-[11px] text-zinc-500">
                              {role?.label || member.role}
                              {member.station ? ` · ${member.station}` : ''}
                            </span>
                          </span>
                          <span
                            className="chip shrink-0 border"
                            style={{ color: role?.color, borderColor: `${role?.color}55`, background: `${role?.color}18` }}
                          >
                            {role?.label || member.role}
                          </span>
                          <DeleteUserButton user={user} target={member} onDeleted={onRefresh} />
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                  {!staff.length && (
                    <li className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-zinc-500 light:border-black/15">
                      Aún no hay personal en {zoneInfo.label}
                    </li>
                  )}
                </ul>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/25 p-4 light:border-black/10 light:bg-white">
                <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                  <UserPlus size={13} /> Añadir personal
                </p>
                <form onSubmit={submit} className="space-y-3">
                  <div>
                    <label className="label">Nombre completo</label>
                    <input className="field" value={form.name} onChange={set('name')} placeholder="Ej. Camila Ruiz" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Correo</label>
                      <input className="field" type="email" value={form.email} onChange={set('email')} placeholder="nombre@kamelia.com" required />
                    </div>
                    <div>
                      <label className="label">Contraseña</label>
                      <input className="field" type="password" value={form.password} onChange={set('password')} placeholder="mín. 6" required minLength={6} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Rol</label>
                    <Select value={form.role} onChange={setRole} options={roleOptions} placeholder="Seleccionar rol…" accent={zoneInfo.accent} />
                  </div>
                  <div>
                    <label className="label">Estación / área</label>
                    <Select
                      value={form.station}
                      onChange={(station) => setForm((f) => ({ ...f, station }))}
                      options={zoneInfo.areas.map((a) => ({ value: a, label: a, color: zoneInfo.accent }))}
                      placeholder="Asignar estación…"
                      accent={zoneInfo.accent}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} style={{ background: zoneInfo.accent }}>
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                    Crear usuario
                  </Button>
                </form>
              </section>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
