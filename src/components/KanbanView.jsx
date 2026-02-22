import { useMemo } from "react";
import { toast } from "sonner";
import { STATUS_OPTIONS } from "../lib/constants";

// KanbanCard is a single job card inside a kanban column
function KanbanCard({ job, onView, onEdit, onDelete }) {
  const handleDelete = () => {
    // Toast confirmation instead of browser confirm()
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
    <div
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
          onClick={(e) => e.stopPropagation()} // Don't trigger onView when clicking buttons
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

      {/* Salary and location if available */}
      <div className="flex items-center gap-2 flex-wrap">
        {job.salary && (
          <span className="text-xs text-gray-500">💰 {job.salary}</span>
        )}
        {job.location && (
          <span className="text-xs text-gray-500">📍 {job.location}</span>
        )}
      </div>

      {/* Applied date if available */}
      {job.applied_date && (
        <p className="text-xs text-gray-600 mt-2">{job.applied_date}</p>
      )}
    </div>
  );
}

// KanbanView groups all jobs into columns by their status
// Props:
//   jobs     — full list of jobs from Supabase
//   onView, onEdit, onDelete — passed down to each card
export default function KanbanView({ jobs, onView, onEdit, onDelete }) {
  // Group jobs by status — only recalculates when jobs changes
  const grouped = useMemo(() => {
    // Start with empty arrays for every status
    const g = {};
    STATUS_OPTIONS.forEach((s) => {
      g[s] = [];
    });

    // Push each job into the right group
    jobs?.forEach((job) => {
      if (g[job.status]) g[job.status].push(job);
    });

    return g;
  }, [jobs]);

  return (
    // Horizontal scrollable container for all columns
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_OPTIONS.map((status) => (
        <div key={status} className="flex-shrink-0 w-72">
          {/* Column header */}
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {status}
            </h3>
            {/* Job count for this column */}
            <span className="text-xs text-gray-600 ml-auto">
              {grouped[status]?.length || 0}
            </span>
          </div>

          {/* Cards in this column */}
          <div className="space-y-3">
            {grouped[status]?.map((job) => (
              <KanbanCard
                key={job.id}
                job={job}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}

            {/* Empty state when no jobs in this column */}
            {grouped[status]?.length === 0 && (
              <div className="border border-dashed border-white/[0.06] rounded-xl p-4 text-center text-xs text-gray-700">
                No jobs
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
