import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "./Badge";

// JobRow renders a single row in the jobs table with fade in/out animation
export default function JobRow({ job, onView, onEdit, onDelete }) {
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
    // motion.tr replaces the normal <tr> to enable animations
    // initial  — state when the row first appears (invisible, shifted up)
    // animate  — state it animates to (fully visible, normal position)
    // exit     — state when it's removed (invisible, shifted up)
    <motion.tr
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onClick={() => onView(job)}
      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group cursor-pointer"
    >
      {/* Company + Location */}
      <td className="px-4 py-3.5">
        <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
          {job.company_name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{job.location || "—"}</p>
      </td>

      {/* Job Title */}
      <td className="px-4 py-3.5">
        <p className="text-sm text-gray-300">{job.job_title}</p>
      </td>

      {/* Status Badge */}
      <td className="px-4 py-3.5">
        <Badge status={job.status} />
      </td>

      {/* Salary */}
      <td className="px-4 py-3.5 text-sm text-gray-500">{job.salary || "—"}</td>

      {/* Applied Date */}
      <td className="px-4 py-3.5 text-sm text-gray-500">
        {job.applied_date || "—"}
      </td>

      {/* Edit & Delete buttons */}
      <td className="px-4 py-3.5">
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            onClick={() => onEdit(job)}
            className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-md transition-colors"
          >
            ✎
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
