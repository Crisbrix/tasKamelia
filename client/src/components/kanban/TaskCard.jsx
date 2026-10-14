import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { Check, Flame, Lock, Pencil, Sparkles, Trash2, X } from 'lucide-react';
import { PRIORITY_MAP, ZONES } from '../../lib/constants';
import { canEditTask, canDeleteTask, canRate } from '../../lib/permissions';
import { StarRating } from '../audit/StarRating';

const initials = (name = '?') =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

function Avatar({ name }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-extrabold text-white ring-1 ring-white/15 light:bg-zinc-900 light:text-white light:ring-black/10">
      {initials(name || '?')}
    </span>
  );
}

export function TaskCardView({ task, user, flash = false, overlay = false, dimmed = false, onRate, onEdit, onDelete }) {
  const zone = ZONES[task.zone];
  const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP.media;
  const auditable = task.status === 'done' && zone.rating;
  const mayRate = auditable && canRate(user, task);
  const mayEdit = !overlay && canEditTask(user, task);
  const mayDelete = !overlay && canDeleteTask(user, task);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.article
      layout={!overlay}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: dimmed ? 0.32 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      whileHover={overlay ? undefined : { y: -4, scale: 1.015 }}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 backdrop-blur-xl transition-colors hover:border-white/20 light:border-black/10 light:bg-white light:hover:border-black/25 ${
        overlay ? 'w-[280px] rotate-[-2deg] shadow-pop ring-2 ring-kamelia/60' : ''
      }`}
      style={{ boxShadow: `inset 3px 0 0 ${zone.accent}` }}
    >
      {(mayEdit || mayDelete) && !flash && (
        <div
          className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/60 p-0.5 opacity-0 backdrop-blur-md transition group-hover:opacity-100 light:border-black/10 light:bg-white/90"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {mayEdit && (
            <button
              type="button"
              title="Editar tarea"
              aria-label="Editar tarea"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(task);
              }}
              className="rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white light:hover:bg-black/5 light:hover:text-zinc-900"
            >
              <Pencil size={13} />
            </button>
          )}
          {mayDelete &&
            (confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                    onDelete?.(task);
                  }}
                  className="rounded-md bg-kamelia px-2 py-1 text-[10px] font-extrabold uppercase text-white"
                >
                  Sí
                </button>
                <button
                  type="button"
                  aria-label="Cancelar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="rounded-md p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white light:hover:bg-black/5 light:hover:text-zinc-900"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <button
                type="button"
                title="Eliminar tarea"
                aria-label="Eliminar tarea"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="rounded-md p-1.5 text-zinc-400 transition hover:bg-kamelia/15 hover:text-kamelia"
              >
                <Trash2 size={13} />
              </button>
            ))}
        </div>
      )}
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="chip border" style={{ color: zone.accent, borderColor: `${zone.accent}55`, background: `${zone.accent}15` }}>
          {task.area}
        </span>
        <span className="chip shrink-0" style={{ color: priority.color, background: `${priority.color}1A` }}>
          {task.priority === 'alta' && <Flame size={11} />}
          {priority.label}
        </span>
      </div>

      <h3 className="text-[13.5px] font-bold leading-snug text-white light:text-zinc-900">{task.title}</h3>
      {task.description && <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-zinc-400 light:text-zinc-500">{task.description}</p>}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar name={task.assigneeName || 'Sin'} />
          <span className="truncate text-[11px] font-semibold text-zinc-300 light:text-zinc-600">{task.assigneeName || 'Sin asignar'}</span>
        </span>
        {task.status === 'done' && !zone.rating && <span className="chip bg-neon-green/15 text-neon-green light:text-[#00875A]">Listo</span>}
      </div>

      {auditable && (
        <div className="mt-3 border-t border-white/10 pt-2.5 light:border-black/10">
          {mayRate ? (
            <div className="flex items-center justify-between gap-2">
              <StarRating value={task.rating?.stars || 0} onChange={(stars) => onRate?.(task, stars)} size={15} />
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neon-amber light:text-amber-700">
                <Sparkles size={11} /> Calificar
              </span>
            </div>
          ) : task.rating ? (
            <div className="flex items-center justify-between gap-2">
              <StarRating value={task.rating.stars} size={14} />
              <span className="text-[10px] font-semibold text-zinc-500">por {task.rating.ratedByName || 'Auditoría'}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-zinc-500">
                <Sparkles size={12} className="text-neon-amber" /> Auditoría
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500">
                <Lock size={11} /> Pendiente
              </span>
            </div>
          )}
        </div>
      )}

      {flash && (
        <>
          <motion.span
            initial={{ opacity: 0.95, scale: 0.82 }}
            animate={{ opacity: 0, scale: 1.14 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-neon-green"
          />
          <motion.span
            initial={{ scale: 0, rotate: -50 }}
            animate={{ scale: [0, 1.3, 1], rotate: 0 }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-neon-green text-night-950 shadow-[0_0_24px_rgba(0,230,118,0.8)]"
          >
            <Check size={16} strokeWidth={3.5} />
          </motion.span>
        </>
      )}
    </motion.article>
  );
}

export const TaskCard = forwardRef(function TaskCard({ task, draggable = true, ...rest }, ref) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task:${task.id}`,
    data: { task },
    disabled: !draggable,
  });

  const setRefs = (node) => {
    setNodeRef(node);
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div
      ref={setRefs}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${!draggable ? 'cursor-default' : ''}`}
    >
      <TaskCardView task={task} dimmed={isDragging} {...rest} />
    </div>
  );
});
