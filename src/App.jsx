import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";
import { useJobs, useDeleteJob } from "./hooks/useJobs";
import { useQueryClient } from "@tanstack/react-query";
import { STATUS_OPTIONS } from "./lib/constants";
import StatCard from "./components/StatCard";
import Badge from "./components/Badge";
import JobRow from "./components/JobRow";
import JobFormModal from "./components/JobFormModal";
import KanbanView from "./components/KanbanView";
import Auth from "./components/Auth";
import { toast } from "sonner";
import AttachmentsPanel from "./components/AttachmentsPanel";

// ── JobDetailModal ────────────────────────────────────────────────────────────
function JobDetailModal({ job, onClose, onEdit }) {
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
            {/* AttachmentsPanel handles upload, view and delete */}
            <AttachmentsPanel jobId={job.id} />
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
function exportToCSV(jobs) {
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
  const rows = jobs.map((job) =>
    [
      `"${job.company_name || ""}"`,
      `"${job.job_title || ""}"`,
      `"${job.status || ""}"`,
      `"${job.salary || ""}"`,
      `"${job.location || ""}"`,
      `"${job.applied_date || ""}"`,
      `"${job.job_url || ""}"`,
      `"${(job.notes || "").replace(/"/g, '""')}"`,
    ].join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jobs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── SortIcon ──────────────────────────────────────────────────────────────────
function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column)
    return <span className="text-gray-700 ml-1">↕</span>;
  return (
    <span className="text-violet-400 ml-1">
      {sortConfig.direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // ── ALL HOOKS MUST BE AT THE TOP — no ifs or returns before this line ──────

  // Auth state
  // undefined = still loading, null = not logged in, object = logged in
  const [session, setSession] = useState(undefined);

  // UI state
  // Date range filter state
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Listen for auth state changes
  useEffect(() => {
    // Get session on first load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Subscribe to future login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      // When user logs in, tell React Query to refetch everything
      // This ensures fresh data loads immediately after login
      // without needing a manual page refresh
      if (session) {
        queryClient.invalidateQueries();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data hooks — always called, but queries won't run if not logged in
  const {
    data: jobs,
    isLoading,
    error,
  } = useJobs({
    search: search || undefined,
    status: statusFilter,
    dateFrom: dateFrom || undefined, // only pass if set
    dateTo: dateTo || undefined, // only pass if set
  });

  const deleteJob = useDeleteJob();

  // Sort jobs — recalculates when jobs or sortConfig changes
  const sortedJobs = useMemo(() => {
    if (!jobs) return [];
    return [...jobs].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      const result = aVal.toString().localeCompare(bVal.toString());
      return sortConfig.direction === "asc" ? result : -result;
    });
  }, [jobs, sortConfig]);

  // Count per status for stat cards
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

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

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

  // ── NOW it's safe to do conditional returns ────────────────────────────────

  // Still checking auth — show spinner
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#0c0e13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show auth screen
  if (session === null) {
    return <Auth />;
  }

  // ── Logged in — render the full app ───────────────────────────────────────

  const columns = [
    { label: "Company", key: "company_name", sortable: true },
    { label: "Role", key: "job_title", sortable: true },
    { label: "Status", key: "status", sortable: true },
    { label: "Salary", key: "salary", sortable: true },
    { label: "Applied", key: "applied_date", sortable: true },
    { label: "", key: "", sortable: false },
  ];

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
            {/* Logged in user's email */}
            <span className="text-xs text-gray-600 hidden sm:block">
              {session.user.email}
            </span>

            {/* Export CSV */}
            {jobs?.length > 0 && (
              <button
                onClick={() => exportToCSV(jobs)}
                className="px-4 py-2 text-sm font-medium text-gray-300 border border-white/[0.08] hover:bg-white/[0.04] rounded-lg transition-colors"
              >
                ↓ Export CSV
              </button>
            )}

            {/* Add Job */}
            <button
              onClick={handleAddNew}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="text-base leading-none">+</span> Add Job
            </button>

            {/* Logout */}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Logged out!");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-white border border-white/[0.08] hover:bg-white/[0.04] rounded-lg transition-colors"
            >
              Logout
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
          className="flex flex-col gap-3"
        >
          {/* Row 1 — Search + Status + View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or role..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
            />

            {/* Status filter */}
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

            {/* Table / Kanban toggle */}
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
          </div>

          {/* Row 2 — Date Range */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Label */}
            <span className="text-xs text-gray-500 font-medium shrink-0">
              Applied Date
            </span>

            {/* From date */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-600 shrink-0">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Divider */}
            <span className="text-gray-700 hidden sm:block">→</span>

            {/* To date */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-gray-600 shrink-0">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Clear button — only show when a date is set */}
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs text-gray-500 hover:text-red-400 border border-white/[0.08] px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
              >
                Clear dates
              </button>
            )}
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
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider select-none ${
                          col.sortable
                            ? "cursor-pointer hover:text-gray-300 transition-colors"
                            : ""
                        }`}
                      >
                        {col.label}
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
        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.06] mt-12">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-center">
            <p className="text-xs text-gray-600">
              Developed by{" "}
              <span className="text-violet-400 font-medium">AqilMustaqim</span>
            </p>
          </div>
        </footer>
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
