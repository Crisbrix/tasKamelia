import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { ArrowRight, Check, Pencil, Sparkles, Trash2, X } from 'lucide-react';
import { PRIORITY_MAP, STATUS_MAP, ZONES } from '../../lib/constants';
import { canEditTask, canDeleteTask, canRate, nextStatus } from '../../lib/permissions';
import { useIsMobile } from '../../lib/hooks';
import { StarRating } from '../audit/StarRating';

const initials = (name = '?') =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Avatar({ name, size = 'h-6 w-6 text-[10px]' }) {
  return (
    <span
      title={name}
      className={`grid shrink-0 place-items-center rounded-full bg-zinc-700 font-semibold text-zinc-100 light:bg-zinc-200 light:text-zinc-700 ${size}`}
    >
      {initials(name || '?')}
    </span>
  );
}

/** Texto del botón de avance según el estado destino. */
export const STEP_LABEL = {
  doing: 'Empezar',
  done: 'Terminar',
  auditado: 'Auditar',
};

const iconBtn =
  'rounded-md p-1.5 text-zinc-500 transition hover:bg-white/[0.08] hover:text-zinc-100 light:hover:bg-black/5 light:hover:text-zinc-900';

export function TaskCardView({ task, user, flash = false, overlay = false, dimmed = false, onMove, onOpenRating, onOpenActions, onEdit, onDelete }) {
  const zone = ZONES[task.zone];
  const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP.media;
  const auditable = (task.status === 'done' || task.status === 'auditado') && zone.rating;
  const mayRate = auditable && canRate(user, task);
  const mayEdit = !overlay && canEditTask(user, task);
  const mayDelete = !overlay && canDeleteTask(user, task);
  const next = overlay ? null : nextStatus(user, task);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isMobile = useIsMobile();
  const finished = task.status === 'done' || task.status === 'auditado';

  // En mobile tocar la tarjeta abre la hoja de acciones (mover, calificar, editar).
  const openActions = () => {
    if (isMobile && !overlay) onOpenActions?.(task);
  };

  const stepButton = next && !flash && (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onMove?.(task, next);
      }}
      className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-white/[0.09] bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-200 transition hover:border-white/[0.18] hover:bg-white/[0.08] active:scale-[0.96] light:border-black/[0.09] light:bg-black/[0.02] light:text-zinc-700 light:hover:bg-black/[0.05] md:h-7 md:px-2"
    >
      {STEP_LABEL[next]}
      <ArrowRight size={13} style={{ color: STATUS_MAP[next].accent }} />
    </button>
  );

  const hoverTools = !isMobile && (mayEdit || mayDelete) && !flash && (
    <span className="flex items-center" onPointerDown={(e) => e.stopPropagation()}>
      {mayEdit && (
        <button type="button" title="Editar tarea" aria-label="Editar tarea" onClick={() => onEdit?.(task)} className={iconBtn}>
          <Pencil size={13} />
        </button>
      )}
      {mayDelete &&
        (confirmDelete ? (
          <>
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                onDelete?.(task);
              }}
              className="rounded bg-kamelia-deep px-2 py-1 text-[11px] font-semibold text-white"
            >
              Eliminar
            </button>
            <button type="button" aria-label="Cancelar" onClick={() => setConfirmDelete(false)} className={iconBtn}>
              <X size={13} />
            </button>
          </>
        ) : (
          <button
            type="button"
            title="Eliminar tarea"
            aria-label="Eliminar tarea"
            onClick={() => setConfirmDelete(true)}
            className={`${iconBtn} hover:!text-kamelia`}
          >
            <Trash2 size={13} />
          </button>
        ))}
    </span>
  );

  return (
    <motion.article
      layout={!overlay}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: dimmed ? 0.35 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
      onClick={openActions}
      className={`group relative rounded-lg border border-white/[0.07] bg-night-800 px-3 py-2.5 transition-colors hover:border-white/[0.14] light:border-black/[0.08] light:bg-white light:hover:border-black/[0.16] ${
        overlay ? 'w-[280px] rotate-[-1.5deg] border-white/20 shadow-pop light:border-black/20' : 'shadow-glow light:shadow-[0_1px_2px_rgba(9,9,11,0.05)]'
      }`}
    >
      <div className="flex min-h-[32px] items-center gap-2 md:min-h-[28px]">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: priority.color }} title={`Prioridad ${priority.label.toLowerCase()}`} />
        <h3
          className={`min-w-0 flex-1 text-[13.5px] font-medium leading-snug ${
            finished ? 'text-zinc-400 light:text-zinc-500' : 'text-zinc-100 light:text-zinc-900'
          }`}
        >
          {task.title}
        </h3>
        {task.assigneeName && <Avatar name={task.assigneeName} size="h-6 w-6 text-[9px]" />}
        {(stepButton || hoverTools) && (
          <span className="flex items-center gap-1 transition md:hidden md:group-hover:flex md:group-focus-within:flex">
            {hoverTools}
            {stepButton}
          </span>
        )}
      </div>

      {task.description && (
        <p className="mt-0.5 line-clamp-2 pl-4 text-xs leading-relaxed text-zinc-500">{task.description}</p>
      )}

      {(task.priority === 'alta' || task.status === 'auditado') && (
        <div className="mt-2 flex items-center gap-1.5 pl-4">
          {task.priority === 'alta' && (
            <span className="chip" style={{ color: priority.color, background: `${priority.color}1A` }}>
              Urgente
            </span>
          )}
          {task.status === 'auditado' && (
            <span className="chip bg-neon-amber/10 text-neon-amber light:text-amber-700">
              <Check size={11} /> Auditada
            </span>
          )}
        </div>
      )}

      {auditable && (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.06] pl-4 pt-2 light:border-black/[0.06]">
          <StarRating value={task.rating?.stars || 0} size={13} />
          {mayRate ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenRating?.(task);
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neon-amber transition hover:bg-neon-amber/10 light:text-amber-700"
            >
              <Sparkles size={12} /> {task.rating ? 'Recalificar' : 'Calificar'}
            </button>
          ) : (
            <span className="text-[11px] text-zinc-500">
              {task.rating ? `por ${task.rating.ratedByName || 'Auditoría'}` : 'Pendiente de auditoría'}
            </span>
          )}
        </div>
      )}

      {flash && (
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-neon-green"
        />
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
      className={draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
    >
      <TaskCardView task={task} dimmed={isDragging} {...rest} />
    </div>
  );
});
