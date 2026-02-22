import { toast } from "sonner";
import Badge from "./Badge";

// JobRow renders a single row in the jobs table
// Props:
//   job      — the job object from Supabase
//   onView   — called when the row is clicked (opens detail modal)
//   onEdit   — called when the edit button is clicked
//   onDelete — called when the delete button is clicked
export default function JobRow({ job, onView, onEdit, onDelete }) {
  const handleDelete = () => {
    // Show a toast with action buttons instead of the ugly browser confirm()
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
    // 'group' allows child elements to react to the row being hovered
    <tr
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

      {/* Edit & Delete buttons — only visible on row hover */}
      <td className="px-4 py-3.5">
        <div
          // Stop click from bubbling up to the row's onView handler
          onClick={(e) => e.stopPropagation()}
          // opacity-0 by default, shows on row hover
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
    </tr>
  );
}
