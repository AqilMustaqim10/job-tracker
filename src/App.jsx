import { useState, useMemo } from "react";
import {
  useJobs,
  useDeleteJob,
  useUpsertJob,
  useAttachments,
} from "./hooks/useJobs";
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
      <div className="bg-[#111318] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Sticky header */}
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status + meta info row */}
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

          {/* Job URL */}
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

          {/* Notes */}
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

          {/* Attachments */}
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

          {/* Timestamps */}
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
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [detailJob, setDetailJob] = useState(null);

  const {
    data: jobs,
    isLoading,
    error,
  } = useJobs({
    search: search || undefined,
    status: statusFilter,
  });

  const deleteJob = useDeleteJob();

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

  return (
    <div
      className="min-h-screen bg-[#0c0e13] text-white"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Header */}
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
          <button
            onClick={handleAddNew}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span> Add Job
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
        </div>

        {/* Filters + view toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
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
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            Error: {error.message}. Check your .env file has correct Supabase
            URL/key.
          </div>
        )}

        {/* Loading / Views */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === "kanban" ? (
          <KanbanView
            jobs={jobs}
            onView={setDetailJob}
            onEdit={handleEdit}
            onDelete={(id) => deleteJob.mutate(id)}
          />
        ) : (
          <div className="bg-[#111318] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Company", "Role", "Status", "Salary", "Applied", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {jobs?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-16 text-center text-gray-600 text-sm"
                      >
                        No jobs found. Click "Add Job" to get started.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <JobRow
                        key={job.id}
                        job={job}
                        onView={setDetailJob}
                        onEdit={handleEdit}
                        onDelete={(id) => deleteJob.mutate(id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <JobFormModal
        open={formOpen}
        onClose={handleFormClose}
        initialData={editJob}
      />
      <JobDetailModal
        job={detailJob}
        onClose={() => setDetailJob(null)}
        onEdit={handleEdit}
      />
    </div>
  );
}
