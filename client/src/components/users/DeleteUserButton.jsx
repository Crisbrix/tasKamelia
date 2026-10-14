import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { canDeleteUser } from '../../lib/permissions';
import { useToast } from '../ui/Toast';

export function DeleteUserButton({ user, target, onDeleted }) {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  if (!canDeleteUser(user, target)) return null;

  const remove = async () => {
    setLoading(true);
    try {
      await api.deleteUser(target.id);
      toast.push(`${target.name} fue eliminado del sistema`, 'success');
      onDeleted?.(target);
    } catch (err) {
      toast.push(err.message, 'error');
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  if (!confirm) {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.88 }}
        onClick={() => {
          setConfirm(true);
          timer.current && clearTimeout(timer.current);
          timer.current = setTimeout(() => setConfirm(false), 4000);
        }}
        title={`Eliminar a ${target.name}`}
        aria-label={`Eliminar a ${target.name}`}
        className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-kamelia/15 hover:text-kamelia"
      >
        <Trash2 size={15} />
      </motion.button>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-1.5"
    >
      <button
        type="button"
        onClick={remove}
        disabled={loading}
        className="rounded-lg bg-kamelia px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white transition hover:bg-kamelia-soft disabled:opacity-50"
      >
        {loading ? '…' : 'Eliminar'}
      </button>
      <button
        type="button"
        onClick={() => {
          timer.current && clearTimeout(timer.current);
          setConfirm(false);
        }}
        className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white light:hover:bg-black/5 light:hover:text-zinc-900"
        aria-label="Cancelar"
      >
        <X size={14} />
      </button>
    </motion.span>
  );
}
