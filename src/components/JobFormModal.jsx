import { useState } from "react";
import { useUpsertJob } from "../hooks/useJobs";
import { STATUS_OPTIONS, EMPTY_FORM } from "../lib/constants";

// JobFormModal handles both adding a new job and editing an existing one
// Props:
//   open        — whether the modal is visible
//   onClose     — function to call when closing the modal
//   initialData — if editing, pass the existing job object here
export default function JobFormModal({ open, onClose, initialData }) {
  // Initialize form state with either the job being edited
  // or the empty form template for a new job
  const [form, setForm] = useState(initialData || EMPTY_FORM);

  // Get the upsert mutation from our hooks
  const upsert = useUpsertJob();

  // Helper function — returns a change handler for a given field name
  // e.g. set('company_name') returns a function that updates form.company_name
  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the browser from refreshing the page

    // Save the job to Supabase (insert or update depending on form.id)
    await upsert.mutateAsync(form);

    onClose(); // Close the modal after saving
  };

  // Don't render anything if the modal is closed
  if (!open) return null;

  return (
    // Dark overlay behind the modal
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Modal box */}
      <div className="bg-[#111318] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">
            {/* Show different title depending on if we're editing or adding */}
            {form.id ? "Edit Job" : "Add New Job"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Company Name *
              </label>
              <input
                required
                value={form.company_name}
                onChange={set("company_name")}
                placeholder="Acme Corp"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Job Title */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Job Title *
              </label>
              <input
                required
                value={form.job_title}
                onChange={set("job_title")}
                placeholder="Frontend Engineer"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Status
              </label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-colors"
              >
                {/* Render one option per status */}
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-[#1a1d24]">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Applied Date */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Applied Date
              </label>
              <input
                type="date"
                value={form.applied_date}
                onChange={set("applied_date")}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Salary */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Salary
              </label>
              <input
                value={form.salary}
                onChange={set("salary")}
                placeholder="RM 5,000"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Location
              </label>
              <input
                value={form.location}
                onChange={set("location")}
                placeholder="Remote / KL"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Job URL */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Job URL
              </label>
              <input
                type="url"
                value={form.job_url}
                onChange={set("job_url")}
                placeholder="https://..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={set("notes")}
                rows={3}
                placeholder="Any notes about this position..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-400 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={upsert.isPending}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {/* Show "Saving..." while the request is in progress */}
              {upsert.isPending ? "Saving..." : form.id ? "Update" : "Add Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
