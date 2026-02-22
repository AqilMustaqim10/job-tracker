import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJobs, useDeleteJob, useAttachments } from "./hooks/useJobs";
import { STATUS_OPTIONS } from "./lib/constants";
import StatCard from "./components/StatCard";
import Badge from "./components/Badge";
import JobRow from "./components/JobRow";
import JobFormModal from "./components/JobFormModal";
import KanbanView from "./components/KanbanView";

// ── JobDetailModal ────────────────────────────────────────────────────────────
function JobDetailModal({ job, onClose, onEdit }) {
  const { data: attachments } = useAttachments(job?.id);

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-[#111318] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[#111318] z-10">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {job.job_title}
            </h2>
            <p className="text-sm text-gray-400">{job.company_name}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => {
                onClose();
                onEdit(job);
              }}
              className="px-3 py-1.5 text-xs text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-500/10 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap gap-3 items-center">
            <Badge status={job.status} />
            {job.location && (
              <span className="text-xs text-gray-400">📍 {job.location}</span>
            )}
            {job.salary && (
              <span className="text-xs text-gray-400">💰 {job.salary}</span>
            )}
            {job.applied_date && (
              <span className="text-xs text-gray-400">
                📅 {job.applied_date}
              </span>
            )}
          </div>

          {job.job_url && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">
                Job Link
              </p>
              <a
                href={job.job_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-violet-400 hover:text-violet-300 break-all transition-colors"
              >
                {job.job_url}
              </a>
            </div>
          )}

          {job.notes && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium">
                Notes
              </p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {job.notes}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">
              Attachments
            </p>
            {!attachments?.length ? (
              <p className="text-sm text-gray-600 italic">
                No attachments yet.
              </p>
            ) : (
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg"
                  >
                    <div className="w-8 h-8 rounded bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
                      {a.file_type?.split("/")[1]?.toUpperCase()?.slice(0, 3) ||
                        "FILE"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {a.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {a.file_size
                          ? `${(a.file_size / 1024).toFixed(1)} KB`
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <p className="text-xs text-gray-600">
              Added{" "}
              {new Date(job.created_at).toLocaleDateString("en-MY", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── exportToCSV ───────────────────────────────────────────────────────────────
// Takes the jobs array and downloads it as a .csv file
function exportToCSV(jobs) {
  // Define which columns to include in the CSV
  const headers = [
    "Company",
    "Job Title",
    "Status",
    "Salary",
    "Location",
    "Applied Date",
    "Job URL",
    "Notes",
  ];

  // Map each job to a row of values
  // Wrap each value in quotes to handle commas inside values
  const rows = jobs.map((job) =>
    [
      `"${job.company_name || ""}"`,
      `"${job.job_title || ""}"`,
      `"${job.status || ""}"`,
      `"${job.salary || ""}"`,
      `"${job.location || ""}"`,
      `"${job.applied_date || ""}"`,
      `"${job.job_url || ""}"`,
      `"${(job.notes || "").replace(/"/g, '""')}"`, // Escape any quotes inside notes
    ].join(","),
  );

  // Combine headers and rows into one CSV string
  const csv = [headers.join(","), ...rows].join("\n");

  // Create a temporary link element and trigger a download
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jobs-${new Date().toISOString().slice(0, 10)}.csv`; // e.g. jobs-2024-03-15.csv
  a.click();

  // Clean up the temporary URL
  URL.revokeObjectURL(url);
}

// ── SortIcon ──────────────────────────────────────────────────────────────────
// Shows an arrow indicating sort direction, or a neutral icon if not sorted
function SortIcon({ column, sortConfig }) {
  // If this column is not the active sort column, show a neutral icon
  if (sortConfig.key !== column) {
    return <span className="text-gray-700 ml-1">↕</span>;
  }
  // Show up or down arrow depending on sort direction
  return (
    <span className="text-violet-400 ml-1">
      {sortConfig.direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [detailJob, setDetailJob] = useState(null);

  // Sort state — key is the column name, direction is 'asc' or 'desc'
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // ── Data ───────────────────────────────────────────────────────────────────
  const {
    data: jobs,
    isLoading,
    error,
  } = useJobs({
    search: search || undefined,
    status: statusFilter,
  });

  const deleteJob = useDeleteJob();

  // ── Sorting ────────────────────────────────────────────────────────────────
  // Called when a column header is clicked
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      // If clicking the same column, toggle direction
      // If clicking a new column, start with ascending
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Sort the jobs array based on sortConfig
  // useMemo so it only recalculates when jobs or sortConfig changes
  const sortedJobs = useMemo(() => {
    if (!jobs) return [];

    return [...jobs].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";

      // Compare as strings (works for text, dates, and numbers stored as text)
      const result = aVal.toString().localeCompare(bVal.toString());

      // Flip the result if descending
      return sortConfig.direction === "asc" ? result : -result;
    });
  }, [jobs, sortConfig]);

  // Count jobs per status for stat cards
  const stats = useMemo(() => {
    if (!jobs) return {};
    return STATUS_OPTIONS.reduce(
      (acc, s) => ({
        ...acc,
        [s]: jobs.filter((j) => j.status === s).length,
      }),
      {},
    );
  }, [jobs]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEdit = (job) => {
    setEditJob(job);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setEditJob(null);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditJob(null);
  };

  // ── Table columns config ───────────────────────────────────────────────────
  // Each column has a label, the key to sort by, and whether it's sortable
  const columns = [
    { label: "Company", key: "company_name", sortable: true },
    { label: "Role", key: "job_title", sortable: true },
    { label: "Status", key: "status", sortable: true },
    { label: "Salary", key: "salary", sortable: true },
    { label: "Applied", key: "applied_date", sortable: true },
    { label: "", key: "", sortable: false }, // actions column
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#0c0e13] text-white"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="border-b border-white/[0.06] bg-[#0c0e13]/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm font-bold">
              JT
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">JobTracker</h1>
              <p className="text-xs text-gray-500">
                {jobs?.length || 0} applications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Export to CSV button — only show when there are jobs */}
            {jobs?.length > 0 && (
              <button
                onClick={() => exportToCSV(jobs)}
                className="px-4 py-2 text-sm font-medium text-gray-300 border border-white/[0.08] hover:bg-white/[0.04] rounded-lg transition-colors flex items-center gap-2"
              >
                ↓ Export CSV
              </button>
            )}

            <button
              onClick={handleAddNew}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="text-base leading-none">+</span> Add Job
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Stat Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <StatCard
            label="Applied"
            value={stats.Applied || 0}
            color="text-blue-400"
          />
          <StatCard
            label="Interview"
            value={stats.Interview || 0}
            color="text-yellow-400"
          />
          <StatCard
            label="Offer"
            value={stats.Offer || 0}
            color="text-emerald-400"
          />
          <StatCard
            label="Accepted"
            value={stats.Accepted || 0}
            color="text-purple-400"
          />
          <StatCard
            label="Rejected"
            value={stats.Rejected || 0}
            color="text-red-400"
          />
          <StatCard
            label="Wishlist"
            value={stats.Wishlist || 0}
            color="text-gray-400"
          />
        </motion.div>

        {/* ── Filters + View Toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or role..."
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-colors"
          >
            <option value="All" className="bg-[#1a1d24]">
              All Statuses
            </option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-[#1a1d24]">
                {s}
              </option>
            ))}
          </select>

          <div className="flex border border-white/[0.08] rounded-lg overflow-hidden">
            {["table", "kanban"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize ${
                  view === v
                    ? "bg-violet-600 text-white"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {v === "table" ? "⊟ Table" : "⊞ Board"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Error ── */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            Error: {error.message}
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === "kanban" ? (
          <KanbanView
            jobs={sortedJobs}
            onView={setDetailJob}
            onEdit={handleEdit}
            onDelete={(id) => deleteJob.mutate(id)}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#111318] border border-white/[0.06] rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {columns.map((col) => (
                      <th
                        key={col.label}
                        // Only make the header clickable if the column is sortable
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none ${
                          col.sortable
                            ? "cursor-pointer hover:text-gray-300 transition-colors"
                            : ""
                        }`}
                      >
                        {col.label}
                        {/* Show sort icon for sortable columns */}
                        {col.sortable && (
                          <SortIcon column={col.key} sortConfig={sortConfig} />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {sortedJobs?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col items-center gap-3"
                        >
                          <svg
                            width="64"
                            height="64"
                            viewBox="0 0 64 64"
                            fill="none"
                          >
                            <rect
                              x="8"
                              y="16"
                              width="48"
                              height="36"
                              rx="4"
                              stroke="#374151"
                              strokeWidth="2"
                            />
                            <path
                              d="M8 24h48"
                              stroke="#374151"
                              strokeWidth="2"
                            />
                            <rect
                              x="16"
                              y="32"
                              width="12"
                              height="2"
                              rx="1"
                              fill="#374151"
                            />
                            <rect
                              x="16"
                              y="38"
                              width="20"
                              height="2"
                              rx="1"
                              fill="#374151"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="10"
                              fill="#1e1e2e"
                              stroke="#7C3AED"
                              strokeWidth="2"
                            />
                            <path
                              d="M48 44v4M48 48h4"
                              stroke="#7C3AED"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                          <p className="text-gray-500 text-sm font-medium">
                            No jobs yet
                          </p>
                          <p className="text-gray-700 text-xs">
                            Click "Add Job" to track your first application
                          </p>
                        </motion.div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {sortedJobs?.map((job) => (
                        <JobRow
                          key={job.id}
                          job={job}
                          onView={setDetailJob}
                          onEdit={handleEdit}
                          onDelete={(id) => deleteJob.mutate(id)}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {formOpen && (
          <JobFormModal
            open={formOpen}
            onClose={handleFormClose}
            initialData={editJob}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailJob && (
          <JobDetailModal
            job={detailJob}
            onClose={() => setDetailJob(null)}
            onEdit={handleEdit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
