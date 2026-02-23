import { useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { STATUS_OPTIONS } from "../lib/constants";

function KanbanCard({ job, onView, onEdit, onDelete }) {
  const handleDelete = () => {
    toast("Delete this job?", {
      action: {
        label: "Delete",
        onClick: () => onDelete(job.id),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onView(job)}
      className="bg-[#111318] border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:border-violet-500/30 transition-all group"
    >
      {/* Top row: company name + action buttons */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors leading-tight">
          {job.company_name}
        </p>

        {/* Buttons only appear on hover */}
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
      </div>

      {/* Job title */}
      <p className="text-xs text-gray-500 mb-3">{job.job_title}</p>

      {/* Salary and location */}
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
    </motion.div>
  );
}

export default function KanbanView({ jobs, onView, onEdit, onDelete }) {
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

  return (
    // Outer wrapper uses flex-col-reverse so the scrollbar appears at the top
    <div
      className="overflow-x-auto pb-2 kanban-container"
      style={{ transform: "rotateX(180deg)" }}
    >
      {/* Inner wrapper flips content back to normal */}
      <div
        className="flex gap-4"
        style={{
          transform: "rotateX(180deg)",
          minWidth: "max-content", // prevents columns from shrinking
          paddingBottom: "1rem",
        }}
      >
        {STATUS_OPTIONS.map((status) => (
          <div key={status} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {status}
              </h3>
              <span className="text-xs text-gray-600 ml-auto">
                {grouped[status]?.length || 0}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              <AnimatePresence>
                {grouped[status]?.map((job) => (
                  <KanbanCard
                    key={job.id}
                    job={job}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>

              {/* Empty state */}
              {grouped[status]?.length === 0 && (
                <div className="border border-dashed border-white/[0.06] rounded-xl p-4 text-center text-xs text-gray-700">
                  No jobs
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
