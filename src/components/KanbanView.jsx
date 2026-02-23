import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { STATUS_OPTIONS } from "../lib/constants";
import { useUpdateJobStatus } from "../hooks/useJobs";

const STATUS_STYLES = {
  Wishlist: {
    dot: "bg-slate-400",
    header: "border-slate-400/30",
    count: "bg-slate-400/10 text-slate-400",
  },
  Applied: {
    dot: "bg-blue-400",
    header: "border-blue-400/30",
    count: "bg-blue-400/10 text-blue-400",
  },
  Interview: {
    dot: "bg-yellow-400",
    header: "border-yellow-400/30",
    count: "bg-yellow-400/10 text-yellow-400",
  },
  Offer: {
    dot: "bg-emerald-400",
    header: "border-emerald-400/30",
    count: "bg-emerald-400/10 text-emerald-400",
  },
  Rejected: {
    dot: "bg-red-400",
    header: "border-red-400/30",
    count: "bg-red-400/10 text-red-400",
  },
  Accepted: {
    dot: "bg-purple-400",
    header: "border-purple-400/30",
    count: "bg-purple-400/10 text-purple-400",
  },
};

function SortableCard({ job, onView, onEdit, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        job={job}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function KanbanCard({ job, onView, onEdit, onDelete, isOverlay = false }) {
  const handleDelete = () => {
    toast("Delete this job?", {
      action: { label: "Delete", onClick: () => onDelete(job.id) },
      cancel: { label: "Cancel" },
    });
  };

  return (
    <div
      onClick={() => !isOverlay && onView(job)}
      className={`
        bg-[#111318] border rounded-xl p-4 transition-all group
        ${
          isOverlay
            ? "border-violet-500/60 shadow-lg shadow-violet-500/20 rotate-2 scale-105"
            : "border-white/[0.06] hover:border-violet-500/30 cursor-pointer"
        }
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors leading-tight">
          {job.company_name}
        </p>
        {!isOverlay && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <button
              onClick={() => onEdit(job)}
              className="p-1 text-gray-600 hover:text-violet-400 transition-colors text-xs"
            >
              ✎
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-600 hover:text-red-400 transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">{job.job_title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {job.salary && (
          <span className="text-xs text-gray-500">💰 {job.salary}</span>
        )}
        {job.location && (
          <span className="text-xs text-gray-500">📍 {job.location}</span>
        )}
      </div>
      {job.applied_date && (
        <p className="text-xs text-gray-600 mt-2">{job.applied_date}</p>
      )}
    </div>
  );
}

// ── DroppableColumn ───────────────────────────────────────────────────────────
// Each column is now a droppable zone using useDroppable
// This means empty columns can also receive dropped cards
function DroppableColumn({ status, jobs, onView, onEdit, onDelete, activeId }) {
  const style = STATUS_STYLES[status];

  // useDroppable makes this element a valid drop target
  // The id must match what we check in handleDragEnd
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column header */}
      <div
        className={`flex items-center gap-2 mb-3 pb-2 border-b ${style.header}`}
      >
        <div className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {status}
        </h3>
        <span
          className={`text-xs px-1.5 py-0.5 rounded-md font-medium ml-auto ${style.count}`}
        >
          {jobs?.length || 0}
        </span>
      </div>

      {/* Drop zone — attach setNodeRef here so the whole area is droppable */}
      <div
        ref={setNodeRef} // ← this makes the whole column droppable
        className={`
          space-y-3 min-h-32 rounded-xl p-2 transition-colors duration-200
          ${
            isOver
              ? // Highlight the column when a card is dragged over it
                "bg-violet-500/5 border border-dashed border-violet-500/40"
              : "border border-transparent"
          }
        `}
      >
        <SortableContext
          items={jobs.map((j) => j.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence>
            {jobs.map((job) => (
              <SortableCard
                key={job.id}
                job={job}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                isDragging={activeId === job.id}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Empty state — only show when not being hovered */}
        {jobs.length === 0 && (
          <div
            className={`
            rounded-xl p-6 text-center text-xs transition-colors duration-200
            ${
              isOver
                ? "text-violet-400 border border-dashed border-violet-500/40"
                : "text-gray-700 border border-dashed border-white/[0.06]"
            }
          `}
          >
            {isOver ? "📥 Drop here" : "No jobs"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── KanbanView ────────────────────────────────────────────────────────────────
export default function KanbanView({ jobs, onView, onEdit, onDelete }) {
  const [activeJob, setActiveJob] = useState(null);
  const updateStatus = useUpdateJobStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const grouped = useMemo(() => {
    const g = {};
    STATUS_OPTIONS.forEach((s) => {
      g[s] = [];
    });
    jobs?.forEach((job) => {
      if (g[job.status]) g[job.status].push(job);
    });
    return g;
  }, [jobs]);

  const handleDragStart = (event) => {
    const job = jobs?.find((j) => j.id === event.active.id);
    setActiveJob(job || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveJob(null);

    if (!over) return;

    let newStatus = null;

    // Check if dropped on a column (status name is the droppable id)
    if (STATUS_OPTIONS.includes(over.id)) {
      newStatus = over.id;
    } else {
      // Dropped on a card — find which column that card belongs to
      for (const status of STATUS_OPTIONS) {
        if (grouped[status]?.some((j) => j.id === over.id)) {
          newStatus = status;
          break;
        }
      }
    }

    if (!newStatus) return;

    const draggedJob = jobs?.find((j) => j.id === active.id);
    if (!draggedJob) return;
    if (draggedJob.status === newStatus) return;

    updateStatus.mutate({ jobId: active.id, status: newStatus });
    toast.success(`Moved to ${newStatus}`);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="overflow-x-auto pb-2 kanban-container"
        style={{ transform: "rotateX(180deg)" }}
      >
        <div
          className="flex gap-4"
          style={{
            transform: "rotateX(180deg)",
            minWidth: "max-content",
            paddingBottom: "1rem",
          }}
        >
          {STATUS_OPTIONS.map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              jobs={grouped[status] || []}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              activeId={activeJob?.id}
            />
          ))}
        </div>
      </div>

      {/* The card that follows your cursor while dragging */}
      <DragOverlay>
        {activeJob ? (
          <div className="w-72">
            <KanbanCard
              job={activeJob}
              onView={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              isOverlay={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
