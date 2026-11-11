import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StarRating } from './StarRating';
import { canMoveToAudit } from '../../lib/permissions';

const STAR_LABELS = ['Deficiente', 'Regular', 'Buena', 'Muy buena', 'Excelente'];

/**
 * Modal de calificación con 5 estrellas de física de resorte.
 * Solo lo abren Gerente/Auditor en tareas "Hecho" de zonas con auditoría.
 * El Gerente puede marcar "mover a Auditado" al guardar.
 */
export function RatingModal({ task, user, onClose, onSubmit }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [toAudit, setToAudit] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (task) {
      setStars(task.rating?.stars || 0);
      setComment(task.rating?.comment || '');
      setToAudit(false);
      setBusy(false);
    }
  }, [task]);

  const mayAudit = Boolean(task && canMoveToAudit(user, task) && task.status === 'done');

  const submit = async () => {
    if (!stars || busy) return;
    setBusy(true);
    try {
      await onSubmit?.(task, stars, comment.trim() || null, toAudit && mayAudit);
      onClose?.();
    } catch {
      // el handler ya muestra el error como toast
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(task)}
      onClose={onClose}
      title="Calificar auditoría"
      subtitle={task ? `${task.area} · "${task.title}"` : ''}
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-6 light:border-black/10 light:bg-black/[0.02]">
          <StarRating value={stars} onChange={setStars} size={36} />
          <motion.p
            key={stars}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="text-xs font-medium text-neon-amber light:text-amber-700"
          >
            {stars ? `${stars}.0 — ${STAR_LABELS[stars - 1]}` : 'Toca una estrella'}
          </motion.p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-400 light:text-zinc-500">
            Comentario (opcional)
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={240}
            placeholder="Observaciones de la auditoría…"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-neon-amber/60 light:border-black/10 light:bg-white light:text-zinc-900 light:placeholder:text-zinc-400"
          />
        </label>

        {mayAudit && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setToAudit((v) => !v)}
            aria-pressed={toAudit}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
              toAudit
                ? 'border-neon-amber/60 bg-neon-amber/10'
                : 'border-white/10 bg-white/[0.03] hover:border-white/25 light:border-black/10 light:bg-black/[0.02] light:hover:border-black/25'
            }`}
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${
                toAudit ? 'border-neon-amber bg-neon-amber text-night-950' : 'border-white/25 text-transparent light:border-black/25'
              }`}
            >
              <ShieldCheck size={14} strokeWidth={3} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-white light:text-zinc-900">Mover a "Auditado" al guardar</span>
              <span className="block text-[11px] text-zinc-400 light:text-zinc-500">Cierra la tarea en la columna de auditoría</span>
            </span>
          </motion.button>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!stars || busy}>
            <Sparkles size={15} /> Guardar calificación
          </Button>
        </div>
      </div>
    </Modal>
  );
}
