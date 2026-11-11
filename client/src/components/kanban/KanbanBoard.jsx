import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
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

const gridClass = (n) => (n === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3');

export function KanbanBoard({
  tasks,
  user,
  statuses = STATUSES,
  flashId,
  onMove,
  onRate,
  onOpenRating,
  onEdit,
  onDelete,
}) {
  const [activeTask, setActiveTask] = useState(null);
  const isMobile = useIsMobile();

  // Mouse: arrastre tras 8px. Touch: long-press de 220ms — el swipe horizontal
  // desplaza el carrusel sin activar el drag (tolerance cancela el gesto).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 12 } }),
    useSensor(KeyboardSensor),
  );

  // --- Carrusel mobile (framer-motion, física de resorte) ---
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const x = useMotionValue(0);
  const [bounds, setBounds] = useState({ left: 0, right: 0 });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isMobile) return undefined;
    const measure = () => {
      const wrap = wrapRef.current;
      const track = trackRef.current;
      if (!wrap || !track) return;
      const left = Math.min(0, wrap.clientWidth - track.scrollWidth);
      setBounds({ left, right: 0 });
      x.set(Math.max(left, Math.min(0, x.get())));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isMobile, statuses.length, tasks.length, x]);

  const goTo = (i) => {
    const next = Math.max(0, Math.min(statuses.length - 1, i));
    setIndex(next);
    const wrap = wrapRef.current;
    const track = trackRef.current;
    const col = track?.children[next];
    if (!wrap || !col) return;
    const wrapRect = wrap.getBoundingClientRect();
    const colRect = col.getBoundingClientRect();
    const centered = colRect.left - wrapRect.left - (wrap.clientWidth - col.offsetWidth) / 2;
    const target = Math.max(bounds.left, Math.min(0, x.get() - centered));
    animate(x, target, { type: 'spring', stiffness: 300, damping: 34 });
  };

  const syncIndex = () => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    const wrapRect = wrap.getBoundingClientRect();
    const center = wrapRect.left + wrapRect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(track.children).forEach((col, i) => {
      const r = col.getBoundingClientRect();
      const d = Math.abs((r.left + r.right) / 2 - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setIndex(best);
  };

  // El indicador se sincroniza cuando el carrusel deja de moverse (momentum + resorte).
  const syncRef = useRef(syncIndex);
  syncRef.current = syncIndex;
  useEffect(() => {
    if (!isMobile) return undefined;
    let timer;
    const unsubscribe = x.on('change', () => {
      clearTimeout(timer);
      timer = setTimeout(() => syncRef.current(), 150);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [isMobile, x]);

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
      <div ref={wrapRef} className="relative overflow-hidden md:overflow-visible">
        <motion.div
          ref={trackRef}
          className={`flex gap-4 pb-1 md:grid md:gap-4 ${gridClass(statuses.length)}`}
          style={isMobile ? { x } : undefined}
          drag={isMobile && !activeTask ? 'x' : false}
          dragConstraints={bounds}
          dragElastic={0.12}
          dragMomentum
          dragTransition={{ power: 0.4, timeConstant: 170, bounceStiffness: 320, bounceDamping: 34 }}
          onDragEnd={() => {
            // sincronizar el indicador cuando el momentum y el resorte terminan
            setTimeout(syncIndex, 450);
          }}
        >
          {statuses.map((status) => (
            <Column
              key={status.id}
              status={status}
              className="w-[84vw] max-w-[360px] shrink-0 md:w-auto md:max-w-none md:shrink"
              tasks={byStatus(status.id)}
              user={user}
              flashId={flashId}
              onRate={onRate}
              onOpenRating={onOpenRating}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </motion.div>
      </div>

      {isMobile && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Columnas">
          {statuses.map((status, i) => (
            <motion.button
              key={status.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => goTo(i)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 480, damping: 24 }}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider"
              style={
                i === index
                  ? { background: `${status.accent}1F`, color: status.accent, boxShadow: `inset 0 0 0 1px ${status.accent}66` }
                  : { background: 'rgba(127,127,140,0.14)', color: '#8A90A2' }
              }
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: i === index ? status.accent : 'currentColor' }} />
              {status.label}
              <span className="font-bold opacity-80">{byStatus(status.id).length}</span>
            </motion.button>
          ))}
        </div>
      )}

      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}>
        {activeTask ? <TaskCardView task={activeTask} user={user} overlay onRate={onRate} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
