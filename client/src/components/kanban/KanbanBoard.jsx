import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { STATUSES } from '../../lib/constants';
import { useIsMobile } from '../../lib/hooks';
import { Column } from './Column';
import { TaskCardView } from './TaskCard';
import { TaskActionsSheet } from './TaskActionsSheet';

const gridClass = (n) => (n === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3');

export function KanbanBoard({ tasks, user, statuses = STATUSES, flashId, onMove, onOpenRating, onEdit, onDelete }) {
  const [activeTask, setActiveTask] = useState(null);
  const [actionsId, setActionsId] = useState(null);
  const [tab, setTab] = useState(statuses[0].id);
  const [direction, setDirection] = useState(0);
  const isMobile = useIsMobile();

  // Escritorio/tablet: arrastrar y soltar. En mobile no hay drag: se mueve con
  // el botón de avance de la tarjeta o desde la hoja de acciones.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const byStatus = (status) => tasks.filter((t) => t.status === status);
  const actionsTask = tasks.find((t) => t.id === actionsId) || null;
  const current = statuses.find((s) => s.id === tab) || statuses[0];
  const tabIndex = statuses.indexOf(current);

  const goTo = (i) => {
    const next = statuses[Math.max(0, Math.min(statuses.length - 1, i))];
    if (!next || next.id === current.id) return;
    setDirection(i > tabIndex ? 1 : -1);
    setTab(next.id);
  };

  const cardProps = {
    user,
    flashId,
    onMove,
    onOpenRating,
    onEdit,
    onDelete,
    onOpenActions: (task) => setActionsId(task.id),
  };

  const sheet = (
    <TaskActionsSheet
      task={actionsTask}
      user={user}
      statuses={statuses}
      onClose={() => setActionsId(null)}
      onMove={onMove}
      onOpenRating={onOpenRating}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );

  if (isMobile) {
    return (
      <div>
        <div
          className="glass mb-3 flex gap-1 rounded-lg p-1"
          role="tablist"
          aria-label="Columnas"
        >
          {statuses.map((status, i) => {
            const active = status.id === current.id;
            return (
              <button
                key={status.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => goTo(i)}
                className="relative min-w-0 flex-1 rounded-md px-1 py-1.5 outline-none"
              >
                {active && (
                  <motion.span
                    layoutId="status-tab"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    className="absolute inset-0 rounded-md bg-white/[0.08] light:bg-black/[0.06]"
                  />
                )}
                <span className={`relative block text-base font-semibold tabular-nums leading-tight ${active ? 'text-zinc-50 light:text-zinc-900' : 'text-zinc-500'}`}>
                  {byStatus(status.id).length}
                </span>
                <span className="relative flex items-center justify-center gap-1 text-[11px] font-medium leading-tight">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: status.accent }} />
                  <span className={`truncate ${active ? 'text-zinc-300 light:text-zinc-700' : 'text-zinc-500'}`}>{status.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              variants={{
                enter: (d) => ({ x: d * 40, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d) => ({ x: d * -40, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                // Deslizar a los lados cambia de columna.
                if (info.offset.x < -70 || info.velocity.x < -450) goTo(tabIndex + 1);
                else if (info.offset.x > 70 || info.velocity.x > 450) goTo(tabIndex - 1);
              }}
            >
              <DndContext sensors={[]}>
                <Column status={current} tasks={byStatus(current.id)} hideHeader className="!border-transparent !bg-transparent" {...cardProps} />
              </DndContext>
            </motion.div>
          </AnimatePresence>
        </div>
        {sheet}
      </div>
    );
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const task = active.data?.current?.task;
    if (!task) return;
    const target = String(over.id).startsWith('col:') ? String(over.id).slice(4) : null;
    if (!target || target === task.status) return;
    onMove(task, target);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveTask(active.data?.current?.task || null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className={`grid items-start gap-3 ${gridClass(statuses.length)}`}>
        {statuses.map((status) => (
          <Column key={status.id} status={status} tasks={byStatus(status.id)} className="min-h-[360px]" {...cardProps} />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeTask ? <TaskCardView task={activeTask} user={user} overlay /> : null}
      </DragOverlay>
      {sheet}
    </DndContext>
  );
}
