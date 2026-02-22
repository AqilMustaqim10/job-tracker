// Import the color map we defined in constants
import { STATUS_COLORS } from "../lib/constants";

// Badge is a small colored pill that shows the job status
// It receives a 'status' prop like "Applied" or "Interview"
export default function Badge({ status }) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 
        rounded-full text-xs font-medium border
        ${STATUS_COLORS[status] || "bg-gray-500/20 text-gray-300 border-gray-500/40"}
      `}
    >
      {status}
    </span>
  );
}
