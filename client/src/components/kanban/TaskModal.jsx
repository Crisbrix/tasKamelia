import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { PRIORITIES, ZONES } from '../../lib/constants';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';

const EMPTY = { title: '', description: '', area: '', assigneeId: '', priority: 'media' };

export function TaskModal({ open, onClose, zone, defaultArea, staff, task, onSaved }) {
  const toast = useToast();
  const zoneInfo = ZONES[zone];
  const editing = Boolean(task);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        area: task.area || zoneInfo.areas[0],
        assigneeId: task.assigneeId ? String(task.assigneeId) : '',
        priority: task.priority || 'media',
      });
    } else {
      setForm({ ...EMPTY, area: defaultArea || zoneInfo.areas[0] });
    }
  }, [open, zone, defaultArea, task]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        area: form.area,
        priority: form.priority,
        assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
      };
      let saved;
      if (editing) {
        saved = await api.updateTask(task.id, payload);
        toast.push(`"${saved.title}" actualizada`, 'success');
      } else {
        saved = await api.createTask({ ...payload, zone });
        toast.push(`Tarea creada en ${zoneInfo.label}`, 'success');
      }
      onSaved?.(saved, editing);
      onClose();
    } catch (err) {
      toast.push(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar tarea' : 'Nueva tarea'}
      subtitle={`${zoneInfo.label} · ${zoneInfo.subtitle}`}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Título</label>
          <input
            className="field"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ej. Desinfección de superficies"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea
            className="field min-h-[86px] resize-none"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Detalles del trabajo, estándar de calidad, evidencia requerida…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Área</label>
            <Select
              value={form.area}
              onChange={(area) => setForm((f) => ({ ...f, area }))}
              options={zoneInfo.areas.map((a) => ({ value: a, label: a, color: zoneInfo.accent }))}
              accent={zoneInfo.accent}
            />
          </div>
          <div>
            <label className="label">Prioridad</label>
            <Select
              value={form.priority}
              onChange={(priority) => setForm((f) => ({ ...f, priority }))}
              options={PRIORITIES.map((p) => ({ value: p.id, label: p.label, color: p.color }))}
            />
          </div>
        </div>
        <div>
          <label className="label">Encargado</label>
          <Select
            value={form.assigneeId}
            onChange={(assigneeId) => setForm((f) => ({ ...f, assigneeId }))}
            options={staff.map((s) => ({ value: String(s.id), label: s.name, color: zoneInfo.accent }))}
            placeholder="Sin asignar…"
            accent={zoneInfo.accent}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !form.title.trim()}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : editing ? <Pencil size={15} /> : <Plus size={15} />}
            {editing ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
