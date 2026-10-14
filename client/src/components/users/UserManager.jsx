import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Search, UserPlus, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { ROLES, ZONES } from '../../lib/constants';
import { assignableRoles, canManageUsers } from '../../lib/permissions';
import { accentText } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DeleteUserButton } from './DeleteUserButton';

const initials = (name = '?') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

const EMPTY = { name: '', email: '', password: '', role: '', station: '' };

export function UserManager({ user, zone }) {
  const toast = useToast();
  const { isLight } = useTheme();
  const zoneInfo = ZONES[zone];
  const accent = accentText(zoneInfo.accent, isLight);
  const [staff, setStaff] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const roleOptions = assignableRoles(user, zone).map((r) => ({ value: r.value, label: r.label, color: r.color }));

  const load = async () => {
    setFetching(true);
    try {
      setStaff(await api.users({ zone }));
    } catch (err) {
      toast.push(err.message, 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    setForm(EMPTY);
    setQuery('');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone]);

  if (!canManageUsers(user, zone)) {
    return (
      <div className="glass grid place-items-center rounded-2xl py-16 text-center">
        <p className="text-sm font-bold text-zinc-400 light:text-zinc-500">No gestionas usuarios en {zoneInfo.label}</p>
      </div>
    );
  }

  const visible = staff.filter((m) => !query || `${m.name} ${m.email}`.toLowerCase().includes(query.toLowerCase()));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.push('Selecciona un rol', 'error');
    setLoading(true);
    try {
      await api.createUser({ ...form, zone, station: form.station || null });
      toast.push(`${form.name} fue añadido a ${zoneInfo.label}`, 'success');
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.push(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="glass min-w-0 rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            <span className="h-2 w-2 rounded-full" style={{ background: zoneInfo.accent, boxShadow: `0 0 10px ${zoneInfo.accent}` }} />
            {staff.length} usuarios en {zoneInfo.label}
          </p>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" className="field w-44 pl-8" />
          </div>
        </div>

        {fetching ? (
          <div className="grid animate-pulse gap-2.5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <ul className="grid gap-2.5 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {visible.map((member) => {
                const role = ROLES[member.role];
                return (
                  <motion.li
                    key={member.id}
                    layout
                    initial={{ opacity: 0, scale: 0.94, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 40 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20 light:border-black/10 light:bg-white light:hover:border-black/25"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold text-night-950"
                        style={{ background: role?.color || '#71717a' }}
                      >
                        {initials(member.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white light:text-zinc-900">{member.name}</p>
                        <p className="truncate text-[11px] text-zinc-500">{member.email}</p>
                      </div>
                      <DeleteUserButton user={user} target={member} onDeleted={load} />
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className="chip border"
                        style={{ color: role?.color, borderColor: `${role?.color}55`, background: `${role?.color}18` }}
                      >
                        {role?.label || member.role}
                      </span>
                      {member.station && <span className="chip bg-white/5 text-zinc-400 light:bg-black/[0.05] light:text-zinc-600">{member.station}</span>}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
        {!fetching && !visible.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500 light:border-black/15">
            {query ? 'Sin resultados para la búsqueda' : `Sin personal en ${zoneInfo.label}`}
          </p>
        )}
      </section>

      <section className="glass h-fit rounded-2xl border-t-2 p-5" style={{ borderTopColor: zoneInfo.accent }}>
        <p className="mb-1 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: accent }}>
          <Users size={13} /> Gestión de usuarios
        </p>
        <h3 className="mb-4 text-lg font-extrabold tracking-tight text-white light:text-zinc-900">Crear en {zoneInfo.label}</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Nombre completo</label>
            <input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej. Camila Ruiz" required />
          </div>
          <div>
            <label className="label">Correo</label>
            <input className="field" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="nombre@kamelia.com" required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="field" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="mín. 6 caracteres" required minLength={6} />
          </div>
          <div>
            <label className="label">Rol</label>
            <Select value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} options={roleOptions} placeholder="Seleccionar rol…" accent={zoneInfo.accent} />
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
  );
}
