import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import { STATUSES } from '../../lib/constants';
import { Column } from './Column';
import { TaskCardView } from './TaskCard';

export function KanbanBoard({ tasks, user, flashId, onMove, onRate, onEdit, onDelete }) {
  const [activeTask, setActiveTask] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const byStatus = (status) => tasks.filter((t) => t.status === status);

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const task = active.data?.current?.task || tasks.find((t) => String(t.id) === String(active.id).replace('task:', ''));
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
      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((status) => (
          <Column
            key={status.id}
            status={status}
            tasks={byStatus(status.id)}
            user={user}
            flashId={flashId}
            onRate={onRate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}>
        {activeTask ? <TaskCardView task={activeTask} user={user} overlay onRate={onRate} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
