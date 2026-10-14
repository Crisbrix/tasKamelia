import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Loader2, Search, UserCog, UserPlus, Users } from 'lucide-react';
import { api } from '../lib/api';
import { ROLES, ROLE_LIST, ZONES, ZONE_LIST } from '../lib/constants';
import { canDeleteUser, isAdmin, manageableZones } from '../lib/permissions';
import { accentText } from '../lib/theme';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { UserManager } from '../components/users/UserManager';
import { DeleteUserButton } from '../components/users/DeleteUserButton';

const EMPTY = { name: '', email: '', password: '', role: '', zone: '', station: '' };

export function UsersPage({ user }) {
  const toast = useToast();
  const { isLight } = useTheme();
  const zones = manageableZones(user);
  const tabs = isAdmin(user) ? ['all', ...zones] : zones;
  const [tab, setTab] = useState(tabs[0]);

  if (!zones.length) {
    return (
      <div className="glass grid place-items-center rounded-2xl py-20 text-center">
        <Users className="mb-3 text-zinc-600" />
        <p className="text-lg font-extrabold text-white light:text-zinc-900">Sin módulo de personal</p>
        <p className="text-sm text-zinc-400 light:text-zinc-500">Tu rol no gestiona usuarios de ninguna zona.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white light:text-zinc-900">
            <UserCog size={22} className="text-neon-amber" /> Gestión de usuarios
          </h1>
          <p className="mt-1 text-sm text-zinc-400 light:text-zinc-500">
            {isAdmin(user)
              ? 'Crea, visualiza y elimina usuarios de cualquier rol y zona.'
              : `Crea, visualiza y elimina el personal de: ${zones.map((z) => ZONES[z].label).join(', ')}.`}
          </p>
        </div>
        <div className="glass flex gap-1 rounded-xl p-1">
          {tabs.map((t) => {
            const active = tab === t;
            const accent = accentText(t === 'all' ? '#FFC400' : ZONES[t].accent, isLight);
            return (
              <button key={t} type="button" onClick={() => setTab(t)} className="relative rounded-lg px-4 py-2 text-sm font-bold outline-none">
                {active && (
                  <motion.span
                    layoutId="users-tab"
                    transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                    className="absolute inset-0 rounded-lg"
                    style={{ background: `${accent}26`, boxShadow: `inset 0 0 0 1px ${accent}66` }}
                  />
                )}
                <span className="relative z-10" style={{ color: active ? accent : '#71717a' }}>
                  {t === 'all' ? 'Directorio' : ZONES[t].label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          {tab === 'all' ? <Directory user={user} /> : <UserManager user={user} zone={tab} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Directory({ user }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api.users().then(setUsers).catch((e) => toast.push(e.message, 'error'));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleOptions = ROLE_LIST.map((r) => ({ value: r.value, label: r.label, color: r.color }));
  const zoneOfRole = form.role ? ROLES[form.role]?.zone : null;
  const stationOptions = (form.zone ? ZONES[form.zone]?.areas : []) || [];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.push('Selecciona un rol', 'error');
    setLoading(true);
    try {
      await api.createUser({ ...form, zone: form.zone || null, station: form.station || null });
      toast.push(`${form.name} creado como ${ROLES[form.role].label}`, 'success');
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.push(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filterRole && u.role !== filterRole) return false;
      if (filterZone && u.zone !== filterZone) return false;
      if (query && !`${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [users, filterRole, filterZone, query]);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <section className="glass h-fit rounded-2xl p-5">
        <p className="mb-1 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-neon-amber">
          <Crown size={13} /> Super Admin
        </p>
        <h2 className="mb-4 text-lg font-extrabold tracking-tight text-white light:text-zinc-900">Crear usuario</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Nombre completo</label>
            <input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej. Ana Torres" required />
          </div>
          <div>
            <label className="label">Correo</label>
            <input className="field" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="ana@kamelia.com" required />
          </div>
          <div>
            <label className="label">Contraseña temporal</label>
            <input className="field" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="mín. 6 caracteres" required minLength={6} />
          </div>
          <div>
            <label className="label">Rol en el sistema</label>
            <Select
              value={form.role}
              onChange={(role) => setForm((f) => ({ ...f, role, zone: ROLES[role]?.zone || '', station: '' }))}
              options={roleOptions}
              placeholder="Seleccionar rol…"
              accent="#FFC400"
            />
          </div>
          <div>
            <label className="label">Zona</label>
            <Select
              value={form.zone}
              onChange={(zone) => setForm((f) => ({ ...f, zone, station: '' }))}
              options={[{ value: '', label: 'Sin zona (global)', color: '#FFC400' }, ...ZONE_LIST.map((z) => ({ value: z.id, label: z.label, color: z.accent }))]}
              accent={form.zone ? ZONES[form.zone]?.accent : '#FFC400'}
            />
            {zoneOfRole && form.zone !== zoneOfRole && (
              <p className="mt-1.5 text-[11px] font-semibold text-neon-orange">Este rol pertenece a la zona {ZONES[zoneOfRole].label}</p>
            )}
          </div>
          {stationOptions.length > 0 && (
            <div>
              <label className="label">Estación / área</label>
              <Select
                value={form.station}
                onChange={(station) => setForm((f) => ({ ...f, station }))}
                options={stationOptions.map((a) => ({ value: a, label: a, color: ZONES[form.zone].accent }))}
                placeholder="Opcional…"
                accent={ZONES[form.zone]?.accent}
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || !form.role}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Crear usuario
          </Button>
        </form>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold tracking-tight text-white light:text-zinc-900">
            {users.length} usuarios <span className="text-sm font-semibold text-zinc-500">· {filtered.length} visibles</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-zinc-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" className="field w-40 pl-8" />
            </div>
            <div className="w-40">
              <Select value={filterRole} onChange={setFilterRole} options={[{ value: '', label: 'Todos los roles' }, ...roleOptions]} />
            </div>
            <div className="w-36">
              <Select
                value={filterZone}
                onChange={setFilterZone}
                options={[{ value: '', label: 'Todas las zonas' }, ...ZONE_LIST.map((z) => ({ value: z.id, label: z.label, color: z.accent }))]}
              />
            </div>
          </div>
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((u, i) => {
              const role = ROLES[u.role];
              const zone = u.zone ? ZONES[u.zone] : null;
              return (
                <motion.li
                  key={u.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 40 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 32, delay: Math.min(i * 0.02, 0.3) }}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20 light:border-black/10 light:bg-white light:hover:border-black/25"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold text-night-950"
                      style={{ background: role?.color || '#71717a' }}
                    >
                      {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white light:text-zinc-900">{u.name}</p>
                      <p className="truncate text-[11px] text-zinc-500">{u.email}</p>
                    </div>
                    {canDeleteUser(user, u) && <DeleteUserButton user={user} target={u} onDeleted={load} />}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="chip border" style={{ color: role?.color, borderColor: `${role?.color}55`, background: `${role?.color}18` }}>
                      {role?.label || u.role}
                    </span>
                    {zone && (
                      <span className="chip border" style={{ color: zone.accent, borderColor: `${zone.accent}55`, background: `${zone.accent}18` }}>
                        {zone.label}
                      </span>
                    )}
                    {u.station && <span className="chip bg-white/5 text-zinc-400 light:bg-black/[0.05] light:text-zinc-600">{u.station}</span>}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        {!filtered.length && (
          <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500 light:border-black/15">
            Ningún usuario coincide con los filtros
          </p>
        )}
      </section>
    </div>
  );
}
