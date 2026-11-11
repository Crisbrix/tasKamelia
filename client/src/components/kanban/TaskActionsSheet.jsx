import { useEffect, useState } from 'react';
import { Check, Lock, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { ZONES } from '../../lib/constants';
import { canDeleteTask, canEditTask, canMoveToAudit, canRate } from '../../lib/permissions';
import { Modal } from '../ui/Modal';
import { StarRating } from '../audit/StarRating';

/** Por qué no se puede mover a una columna (null = permitido). */
function blockedReason(user, task, statusId) {
  if (statusId !== 'auditado') return null;
  if (!canMoveToAudit(user, task)) return 'Solo el Gerente';
  if (task.status !== 'done' && task.status !== 'auditado') return 'Primero debe estar en Hecho';
  if (!task.rating) return 'Califícala primero';
  return null;
}

const rowClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition hover:bg-white/[0.05] active:bg-white/[0.08] light:hover:bg-black/[0.04] light:active:bg-black/[0.07]';

/**
 * Hoja de acciones de una tarea: mover entre columnas con un toque,
 * calificar, editar y eliminar. En mobile se abre desde abajo (bottom sheet).
 */
export function TaskActionsSheet({ task, user, statuses, onClose, onMove, onOpenRating, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => setConfirmDelete(false), [task?.id]);

  const zone = task ? ZONES[task.zone] : null;
  const mayMove = task && canEditTask(user, task);
  const mayRate = task && zone?.rating && canRate(user, task);
  const mayEdit = task && canEditTask(user, task);
  const mayDelete = task && canDeleteTask(user, task);

  const act = (fn) => {
    onClose();
    fn();
  };

  return (
    <Modal open={Boolean(task)} onClose={onClose} title={task?.title} subtitle={task ? `${task.area} · ${task.assigneeName || 'Sin asignar'}` : null}>
      {task && (
        <div className="space-y-5">
          {task.description && <p className="-mt-2 text-sm leading-relaxed text-zinc-400 light:text-zinc-600">{task.description}</p>}

          {task.rating && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <StarRating value={task.rating.stars} size={14} />
              <span>por {task.rating.ratedByName || 'Auditoría'}</span>
            </div>
          )}

          {mayMove && (
            <section>
              <p className="label">Mover a</p>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Mover a columna">
                {statuses.map((s) => {
                  const current = task.status === s.id;
                  const reason = current ? null : blockedReason(user, task, s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={current}
                      disabled={current || Boolean(reason)}
                      onClick={() => act(() => onMove(task, s.id))}
                      className={`flex min-h-[52px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition active:scale-[0.98] disabled:active:scale-100 ${
                        current
                          ? 'border-white/25 bg-white/[0.06] light:border-black/25 light:bg-black/[0.04]'
                          : 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-45 disabled:hover:border-white/[0.08] disabled:hover:bg-transparent light:border-black/[0.08] light:hover:border-black/20 light:hover:bg-black/[0.03]'
                      }`}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.accent }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-zinc-100 light:text-zinc-900">{s.label}</span>
                        {(current || reason) && (
                          <span className="block text-[11px] text-zinc-500">{current ? 'Columna actual' : reason}</span>
                        )}
                      </span>
                      {current && <Check size={15} className="shrink-0 text-zinc-400" />}
                      {reason && <Lock size={13} className="shrink-0 text-zinc-500" />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {(mayRate || mayEdit || mayDelete) && (
            <section className="-mx-3 border-t border-white/[0.07] pt-2 light:border-black/[0.07]">
              {mayRate && (
                <button type="button" className={`${rowClass} text-neon-amber light:text-amber-700`} onClick={() => act(() => onOpenRating(task))}>
                  <Sparkles size={16} /> {task.rating ? 'Recalificar' : 'Calificar con estrellas'}
                </button>
              )}
              {mayEdit && (
                <button type="button" className={`${rowClass} text-zinc-200 light:text-zinc-800`} onClick={() => act(() => onEdit(task))}>
                  <Pencil size={16} className="text-zinc-500" /> Editar tarea
                </button>
              )}
              {mayDelete &&
                (confirmDelete ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="flex-1 text-sm text-zinc-400 light:text-zinc-600">¿Eliminar definitivamente?</span>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-white/[0.06] light:hover:bg-black/[0.05]">
                      Cancelar
                    </button>
                    <button type="button" onClick={() => act(() => onDelete(task))} className="rounded-md bg-kamelia-deep px-3 py-2 text-sm font-medium text-white">
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <button type="button" className={`${rowClass} text-kamelia`} onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={16} /> Eliminar tarea
                  </button>
                ))}
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
