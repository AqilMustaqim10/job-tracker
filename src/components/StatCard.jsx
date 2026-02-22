// StatCard shows a single number on the dashboard
// e.g. "Applied — 5" or "Interview — 2"
export default function StatCard({ label, value, color }) {
  return (
    <div className="bg-[#111318] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-1">
      {/* Small uppercase label at the top */}
      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
        {label}
      </span>

      {/* Big number — color is passed as a prop e.g. "text-blue-400" */}
      <span className={`text-3xl font-bold font-mono ${color}`}>{value}</span>
    </div>
  );
}
