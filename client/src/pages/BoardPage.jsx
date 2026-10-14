import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ListTodo, Plus, ShieldHalf, Users } from 'lucide-react';
import { api } from '../lib/api';
import { ZONES } from '../lib/constants';
import { canCreateTask, canManageZone, canManageUsers, canListUsers } from '../lib/permissions';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { ZoneTabs, StatsBar } from '../components/ZoneTabs';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskModal } from '../components/kanban/TaskModal';
import { TeamPanel } from '../components/team/TeamPanel';

export function BoardPage({ user }) {
  const toast = useToast();
  const [zoneId, setZoneId] = useState('cocina');
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [overview, setOverview] = useState(null);
  const [area, setArea] = useState('all');
  const [flashId, setFlashId] = useState(null);
  const [taskModal, setTaskModal] = useState(false);
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
    setArea('all');
  }, [zoneId, loadZone]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const visibleTasks = useMemo(
    () => (area === 'all' ? tasks : tasks.filter((t) => t.area === area)),
    [tasks, area],
  );

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
            <Button size="md" onClick={() => setTaskModal(true)}>
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setArea('all')}
              className={`chip border transition ${area === 'all' ? 'text-white light:text-zinc-900' : 'border-white/10 text-zinc-500 hover:text-zinc-300 light:border-black/10 light:hover:text-zinc-800'}`}
              style={
                area === 'all'
                  ? { background: `${zone.accent}26`, borderColor: `${zone.accent}77`, color: zone.accent }
                  : undefined
              }
            >
              Todas
            </button>
            {zone.areas.map((a) => {
              const active = area === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(active ? 'all' : a)}
                  className="chip border transition"
                  style={
                    active
                      ? { background: `${zone.accent}26`, borderColor: `${zone.accent}77`, color: zone.accent }
                      : { borderColor: 'rgba(255,255,255,0.1)', color: '#71717a' }
                  }
                >
                  {a}
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
          ) : visibleTasks.length === 0 && area !== 'all' ? (
            <div className="glass grid place-items-center rounded-2xl py-14 text-center">
              <ListTodo className="mb-2 text-zinc-600 light:text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-400 light:text-zinc-600">No hay tareas en esta área</p>
              <p className="text-xs text-zinc-600 light:text-zinc-400">Cambia de área o crea una nueva tarea</p>
            </div>
          ) : (
            <KanbanBoard
              tasks={visibleTasks}
              user={user}
              flashId={flashId}
              onMove={handleMove}
              onRate={handleRate}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <TaskModal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        zone={zoneId}
        staff={staff}
        onCreated={(task) => {
          setTasks((list) => [...list, task]);
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
