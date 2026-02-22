// All possible job statuses in order of the hiring pipeline
export const STATUS_OPTIONS = [
  "Wishlist",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Accepted",
];

// Tailwind CSS classes for each status
// Used to color the badge pill in the UI
export const STATUS_COLORS = {
  Wishlist: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  Applied: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  Interview: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  Offer: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  Rejected: "bg-red-500/20 text-red-300 border-red-500/40",
  Accepted: "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

// The default empty state for the Add Job form
// We'll reset the form to this after submitting
export const EMPTY_FORM = {
  company_name: "",
  job_title: "",
  status: "Applied",
  salary: "",
  location: "",
  job_url: "",
  notes: "",
  applied_date: "",
};
