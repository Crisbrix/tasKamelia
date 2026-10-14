import { AnimatePresence, motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { canEditTask } from '../../lib/permissions';

export function Column({ status, tasks, user, flashId, onRate }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status.id}` });

  return (
    <motion.section
      layout
      ref={setNodeRef}
      className="relative flex min-h-[420px] flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 transition-colors light:border-black/10 light:bg-black/[0.02]"
      style={
        isOver
          ? {
              borderColor: `${status.accent}88`,
              background: `linear-gradient(180deg, ${status.accent}1A, transparent 55%)`,
              boxShadow: `0 0 0 1px ${status.accent}55, 0 24px 60px -32px ${status.accent}`,
            }
          : undefined
      }
      animate={{ scale: isOver ? 1.012 : 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <header className="mb-3 flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <motion.span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: status.accent, boxShadow: `0 0 12px ${status.accent}` }}
            animate={isOver ? { scale: [1, 1.6, 1] } : { scale: 1 }}
            transition={{ repeat: isOver ? Infinity : 0, duration: 0.9 }}
          />
          <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-zinc-200 light:text-zinc-800">{status.label}</h3>
        </div>
        <span
          className="grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[11px] font-extrabold"
          style={{ background: `${status.accent}22`, color: status.accent }}
        >
          {tasks.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              user={user}
              onRate={onRate}
              flash={flashId === task.id}
              draggable={canEditTask(user, task)}
            />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid flex-1 place-items-center rounded-xl border border-dashed border-white/10 px-4 py-8 text-center light:border-black/15"
          >
            <div>
              <p className="text-xs font-semibold text-zinc-500 light:text-zinc-500">Suelta aquí</p>
              <p className="mt-1 text-[11px] text-zinc-600 light:text-zinc-400">Las tarjetas caen con física de resorte</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
