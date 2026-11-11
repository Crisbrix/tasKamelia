import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, ShieldHalf, Users } from 'lucide-react';
import { api } from '../lib/api';
import { STATUSES, ZONES } from '../lib/constants';
import { canCreateTask, canManageZone, canManageUsers, canMoveToAudit } from '../lib/permissions';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { ZoneTabs, StatsBar } from '../components/ZoneTabs';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskModal } from '../components/kanban/TaskModal';
import { TeamPanel } from '../components/team/TeamPanel';
import { RatingModal } from '../components/audit/RatingModal';

export function BoardPage({ user }) {
  const toast = useToast();
  const [zoneId, setZoneId] = useState('cocina');
  const [cache, setCache] = useState({});
  const [overview, setOverview] = useState(null);
  const [area, setArea] = useState(ZONES.cocina.areas[0]);
  const [flashId, setFlashId] = useState(null);
  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [teamOpen, setTeamOpen] = useState(false);
  const [ratingTask, setRatingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const versionRef = useRef({});
  const loadedRef = useRef({});

  const zone = ZONES[zoneId];
  // La columna "Auditado" solo existe en zonas con auditoría (Cocina y Finca).
  const statuses = useMemo(() => STATUSES.filter((s) => s.id !== 'auditado' || zone.rating), [zone]);
  const gridClass = statuses.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';

  const loadOverview = useCallback(() => {
    api.overview().then(setOverview).catch(() => {});
  }, []);

  const patchZone = useCallback((z, patch) => {
    setCache((c) => ({ ...c, [z]: { tasks: [], staff: [], ...(c[z] || {}), ...patch } }));
  }, []);

  const loadZone = useCallback(
    async (z, { silent = false } = {}) => {
      const v = (versionRef.current[z] || 0) + 1;
      versionRef.current[z] = v;
      if (!silent) setLoading(true);
      try {
        const data = await api.board({ zone: z });
        if (versionRef.current[z] !== v) return;
        loadedRef.current[z] = true;
        setCache((c) => ({ ...c, [z]: { tasks: data.tasks, staff: data.staff } }));
        setOverview((prev) => ({ ...(prev || {}), zones: data.zones }));
      } catch (err) {
        if (versionRef.current[z] === v) toast.push(err.message || 'Error al cargar la zona', 'error');
      } finally {
        if (versionRef.current[z] === v && !silent) setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadZone('cocina').finally(() => {
      for (const z of ['finca', 'comedor']) loadZone(z, { silent: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setArea(ZONES[zoneId].areas[0]);
    loadZone(zoneId, { silent: Boolean(loadedRef.current[zoneId]) });
  }, [zoneId, loadZone]);

  const zoneCache = cache[zoneId] || { tasks: [], staff: [] };
  const visibleTasks = useMemo(() => zoneCache.tasks.filter((t) => t.area === area), [zoneCache.tasks, area]);
  const countByArea = useMemo(() => {
    const map = {};
    for (const t of zoneCache.tasks) map[t.area] = (map[t.area] || 0) + 1;
    return map;
  }, [zoneCache.tasks]);

  // Al entrar a una zona, abrir la primera área que tenga tareas (una sola vez por zona).
  const autoAreaRef = useRef({});
  useEffect(() => {
    if (autoAreaRef.current[zoneId] || !loadedRef.current[zoneId]) return;
    autoAreaRef.current[zoneId] = true;
    if (countByArea[zone.areas[0]]) return;
    const first = zone.areas.find((a) => countByArea[a]);
    if (first) setArea(first);
  }, [zoneId, zone, countByArea]);

  const handleMove = async (task, status) => {
    if (task.status === status) return;
    if (status === 'auditado') {
      if (!canMoveToAudit(user, task)) {
        toast.push('Solo el Gerente mueve tareas a la columna Auditado', 'error');
        return;
      }
      if (!task.rating) {
        toast.push('Califica la tarea con estrellas antes de auditarla', 'error');
        return;
      }
    }
    const previous = zoneCache.tasks;
    patchZone(zoneId, {
      tasks: previous.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status,
              completedAt:
                status === 'done'
                  ? new Date().toISOString()
                  : status === 'auditado'
                    ? t.completedAt || new Date().toISOString()
                    : null,
            }
          : t,
      ),
    });

    if (status === 'done' && task.status !== 'done') {
      setFlashId(task.id);
      setTimeout(() => setFlashId((id) => (id === task.id ? null : id)), 1400);
      toast.push(
        zone.rating && canManageZone(user, zoneId)
          ? `"${task.title}" está en Hecho: queda pendiente de auditoría`
          : `"${task.title}" completada`,
        zone.rating ? 'audit' : 'success',
      );
    }
    if (status === 'doing' && task.status === 'todo') {
      toast.push(`"${task.title}" en Haciendo`, 'info');
    }
    if (status === 'auditado' && task.status !== 'auditado') {
      toast.push(`"${task.title}" auditada y cerrada`, 'audit');
    }

    try {
      const updated = await api.updateTask(task.id, { status });
      patchZone(zoneId, { tasks: zoneCache.tasks.map((t) => (t.id === task.id ? updated : t)) });
      loadOverview();
    } catch (err) {
      patchZone(zoneId, { tasks: previous });
      toast.push(err.message, 'error');
    }
  };

  const handleRate = async (task, stars, comment = null, moveToAudit = false) => {
    try {
      const updated = await api.rateTask(task.id, stars, comment);
      patchZone(zoneId, { tasks: zoneCache.tasks.map((t) => (t.id === task.id ? updated : t)) });
      toast.push(`${stars} ★ asignadas a "${task.title}"`, 'audit');
      if (moveToAudit && canMoveToAudit(user, updated)) {
        const moved = await api.updateTask(task.id, { status: 'auditado' });
        patchZone(zoneId, { tasks: zoneCache.tasks.map((t) => (t.id === task.id ? moved : t)) });
        toast.push(`"${task.title}" movida a la columna Auditado`, 'audit');
      }
      loadOverview();
    } catch (err) {
      toast.push(err.message, 'error');
      throw err;
    }
  };

  const handleDelete = async (task) => {
    const previous = zoneCache.tasks;
    patchZone(zoneId, { tasks: previous.filter((t) => t.id !== task.id) });
    try {
      await api.deleteTask(task.id);
      toast.push(`"${task.title}" eliminada`, 'success');
      loadOverview();
    } catch (err) {
      patchZone(zoneId, { tasks: previous });
      toast.push(err.message, 'error');
    }
  };

  const showTeam = canManageUsers(user, zoneId);
  const showCreate = canCreateTask(user, zoneId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <ZoneTabs value={zoneId} onChange={setZoneId} overview={overview} />
        </div>
        <div className="flex items-center gap-2">
          {showTeam && (
            <Button variant="outline" size="md" className="flex-1 lg:flex-none" onClick={() => setTeamOpen(true)}>
              <Users size={15} /> Personal
            </Button>
          )}
          {showCreate && (
            <Button
              size="md"
              className="flex-1 lg:flex-none"
              onClick={() => {
                setEditingTask(null);
                setTaskModal(true);
              }}
            >
              <Plus size={15} /> Nueva tarea
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={zoneId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 40 }}
          className="space-y-4"
        >
          <div className="hidden flex-col gap-3 sm:flex xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-white light:text-zinc-900">
                {zone.label}
                {zoneId === 'cocina' && (
                  <span className="chip border border-kamelia/30 text-kamelia light:text-kamelia-deep">
                    <ShieldHalf size={11} /> Prioridad máxima
                  </span>
                )}
              </h1>
              <p className="mt-0.5 hidden text-sm text-zinc-500 sm:block">{zone.description}</p>
            </div>
            <StatsBar zone={zone} overview={overview} />
          </div>

          <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-1 border-b border-white/[0.07] light:border-black/[0.08] sm:w-full" role="tablist" aria-label={`Áreas de ${zone.label}`}>
              {zone.areas.map((a) => {
                const active = area === a;
                return (
                  <button
                    key={a}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setArea(a)}
                    className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 pb-2.5 pt-1.5 text-[13px] font-medium outline-none transition focus-visible:text-white ${
                      active ? 'text-zinc-50 light:text-zinc-900' : 'text-zinc-500 hover:text-zinc-300 light:hover:text-zinc-700'
                    }`}
                  >
                    {a}
                    <span className="tabular-nums text-xs text-zinc-500">{countByArea[a] || 0}</span>
                    {active && (
                      <motion.span
                        layoutId="area-tab-line"
                        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                        style={{ background: zone.accent }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className={`grid gap-3 ${gridClass}`}>
              {statuses.map((s, i) => (
                <div key={s.id} className={`h-[360px] animate-pulse rounded-xl bg-white/[0.03] light:bg-black/[0.04] ${i > 0 ? 'hidden md:block' : ''}`} />
              ))}
            </div>
          ) : (
            <KanbanBoard
              key={zoneId}
              tasks={visibleTasks}
              user={user}
              statuses={statuses}
              flashId={flashId}
              onMove={handleMove}
              onOpenRating={setRatingTask}
              onEdit={(task) => {
                setEditingTask(task);
                setTaskModal(true);
              }}
              onDelete={handleDelete}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <TaskModal
        open={taskModal}
        onClose={() => {
          setTaskModal(false);
          setEditingTask(null);
        }}
        zone={zoneId}
        defaultArea={area}
        staff={zoneCache.staff}
        task={editingTask}
        onSaved={(saved, wasEditing) => {
          patchZone(zoneId, {
            tasks: wasEditing
              ? zoneCache.tasks.map((t) => (t.id === saved.id ? saved : t))
              : [...zoneCache.tasks, saved],
          });
          setEditingTask(null);
          loadOverview();
        }}
      />

      <RatingModal
        task={ratingTask}
        user={user}
        onClose={() => setRatingTask(null)}
        onSubmit={handleRate}
      />

      <TeamPanel
        open={teamOpen}
        onClose={() => setTeamOpen(false)}
        zone={zoneId}
        user={user}
        staff={zoneCache.staff}
        onRefresh={() => loadZone(zoneId, { silent: true })}
      />
    </div>
  );
}
