import { AnimatePresence, motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { canEditTask } from '../../lib/permissions';

export function Column({ status, tasks, user, flashId, hideHeader = false, className = '', ...cardProps }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status.id}` });

  return (
    <section
      ref={setNodeRef}
      className={`relative flex flex-col rounded-xl border transition-colors duration-150 ${hideHeader ? '' : 'p-2'} ${
        isOver
          ? 'border-white/20 bg-white/[0.04] light:border-black/20 light:bg-black/[0.04]'
          : 'border-transparent bg-white/[0.02] light:bg-black/[0.025]'
      } ${className}`}
    >
      {!hideHeader && (
        <header className="mb-2 flex items-center gap-2 px-1.5 py-1">
          <span className="h-2 w-2 rounded-full" style={{ background: status.accent }} />
          <h3 className="text-[13px] font-medium text-zinc-200 light:text-zinc-800">{status.label}</h3>
          <span className="text-[13px] tabular-nums text-zinc-500">{tasks.length}</span>
        </header>
      )}

      <div className="flex flex-1 flex-col gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              user={user}
              flash={flashId === task.id}
              draggable={canEditTask(user, task)}
              {...cardProps}
            />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid min-h-[120px] flex-1 place-items-center rounded-lg border border-dashed border-white/[0.08] px-4 py-8 text-center light:border-black/[0.1]"
          >
            <p className="text-xs text-zinc-500">{isOver ? 'Suelta aquí' : 'Sin tareas'}</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
