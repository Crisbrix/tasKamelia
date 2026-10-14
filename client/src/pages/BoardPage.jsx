import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, ShieldHalf, Users } from 'lucide-react';
import { api } from '../lib/api';
import { ZONES } from '../lib/constants';
import { accentText } from '../lib/theme';
import { useTheme } from '../context/ThemeContext';
import { canCreateTask, canManageZone, canManageUsers, canListUsers } from '../lib/permissions';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { ZoneTabs, StatsBar } from '../components/ZoneTabs';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskModal } from '../components/kanban/TaskModal';
import { TeamPanel } from '../components/team/TeamPanel';

export function BoardPage({ user }) {
  const toast = useToast();
  const { isLight } = useTheme();
  const [zoneId, setZoneId] = useState('cocina');
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [overview, setOverview] = useState(null);
  const [area, setArea] = useState(ZONES.cocina.areas[0]);
  const [flashId, setFlashId] = useState(null);
  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [teamOpen, setTeamOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const zone = ZONES[zoneId];

  const loadOverview = useCallback(() => {
    api.overview().then(setOverview).catch(() => {});
  }, []);

  const loadZone = useCallback(
    async (z) => {
      setLoading(true);
      try {
        const [taskList, staffList] = await Promise.all([
          api.tasks({ zone: z }),
          canListUsers(user, z) ? api.users({ zone: z }) : Promise.resolve([]),
        ]);
        setTasks(taskList);
        setStaff(staffList);
      } catch (err) {
        toast.push(err.message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [toast, user],
  );

  useEffect(() => {
    loadZone(zoneId);
    setArea(ZONES[zoneId].areas[0]);
  }, [zoneId, loadZone]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const visibleTasks = useMemo(() => tasks.filter((t) => t.area === area), [tasks, area]);
  const countByArea = useMemo(() => {
    const map = {};
    for (const t of tasks) map[t.area] = (map[t.area] || 0) + 1;
    return map;
  }, [tasks]);

  const handleMove = async (task, status) => {
    if (task.status === status) return;
    const previous = tasks;
    setTasks((list) =>
      list.map((t) =>
        t.id === task.id ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : null } : t,
      ),
    );

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

    try {
      const updated = await api.updateTask(task.id, { status });
      setTasks((list) => list.map((t) => (t.id === task.id ? updated : t)));
      loadOverview();
    } catch (err) {
      setTasks(previous);
      toast.push(err.message, 'error');
    }
  };

  const handleRate = async (task, stars) => {
    try {
      const updated = await api.rateTask(task.id, stars);
      setTasks((list) => list.map((t) => (t.id === task.id ? updated : t)));
      toast.push(`${stars} ★ asignadas a "${task.title}"`, 'audit');
      loadOverview();
    } catch (err) {
      toast.push(err.message, 'error');
    }
  };

  const handleDelete = async (task) => {
    const previous = tasks;
    setTasks((list) => list.filter((t) => t.id !== task.id));
    try {
      await api.deleteTask(task.id);
      toast.push(`"${task.title}" eliminada`, 'success');
      loadOverview();
    } catch (err) {
      setTasks(previous);
      toast.push(err.message, 'error');
    }
  };

  const showTeam = canManageUsers(user, zoneId);
  const showCreate = canCreateTask(user, zoneId);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <ZoneTabs value={zoneId} onChange={setZoneId} overview={overview} />
        <div className="flex flex-wrap items-center gap-2">
          {showTeam && (
            <Button variant="outline" size="md" onClick={() => setTeamOpen(true)}>
              <Users size={15} /> Personal
            </Button>
          )}
          {showCreate && (
            <Button
              size="md"
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

      <AnimatePresence mode="wait">
        <motion.div
          key={zoneId}
          initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
          transition={{
            default: { type: 'spring', stiffness: 340, damping: 32 },
            filter: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white light:text-zinc-900">
                <span className="h-3 w-3 rounded-full" style={{ background: zone.accent, boxShadow: `0 0 16px ${zone.accent}` }} />
                Zona {zone.label}
                {zoneId === 'cocina' && (
                  <span className="chip border border-kamelia/50 bg-kamelia/15 text-kamelia light:text-kamelia-deep">
                    <ShieldHalf size={11} /> Prioridad máxima
                  </span>
                )}
              </h1>
              <p className="mt-1 text-sm text-zinc-400 light:text-zinc-500">{zone.description}</p>
            </div>
            <StatsBar zone={zone} overview={overview} />
          </div>

          <div className="glass flex flex-wrap gap-1 rounded-2xl p-1.5" role="tablist" aria-label={`Áreas de ${zone.label}`}>
            {zone.areas.map((a) => {
              const active = area === a;
              return (
                <button
                  key={a}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setArea(a)}
                  className="relative flex-1 whitespace-nowrap rounded-xl px-4 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  {active && (
                    <motion.span
                      layoutId="area-tab-pill"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute inset-0 rounded-xl"
                      style={{ background: `${zone.accent}26`, boxShadow: `inset 0 0 0 1px ${zone.accent}66` }}
                    />
                  )}
                  <span
                    className="relative z-10 flex items-center justify-center gap-2 text-[13px] font-extrabold"
                    style={{ color: active ? accentText(zone.accent, isLight) : '#71717a' }}
                  >
                    {a}
                    <span
                      className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px]"
                      style={
                        active
                          ? { background: zone.accent, color: '#06070A' }
                          : { background: 'rgba(127,127,140,0.18)', color: '#8A90A2' }
                      }
                    >
                      {countByArea[a] || 0}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass h-[420px] animate-pulse rounded-2xl opacity-60" />
              ))}
            </div>
          ) : (
            <KanbanBoard
              tasks={visibleTasks}
              user={user}
              flashId={flashId}
              onMove={handleMove}
              onRate={handleRate}
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
        staff={staff}
        task={editingTask}
        onSaved={(saved, wasEditing) => {
          setTasks((list) => (wasEditing ? list.map((t) => (t.id === saved.id ? saved : t)) : [...list, saved]));
          setEditingTask(null);
          loadOverview();
        }}
      />

      <TeamPanel
        open={teamOpen}
        onClose={() => setTeamOpen(false)}
        zone={zoneId}
        user={user}
        staff={staff}
        onRefresh={async () => {
          const staffList = await api.users({ zone: zoneId }).catch(() => []);
          setStaff(staffList);
          loadOverview();
        }}
      />
    </div>
  );
}
