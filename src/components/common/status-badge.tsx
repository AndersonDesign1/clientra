export function StatusBadge({ value }: { value: string }) {
  let color = "bg-slate-100 text-slate-700";

  if (value === "completed" || value === "active") {
    color = "bg-emerald-100 text-emerald-700";
  } else if (value === "in_progress") {
    color = "bg-blue-100 text-blue-700";
  } else if (value === "planning") {
    color = "bg-amber-100 text-amber-700";
  }

  return (
    <span className={`rounded-full px-2 py-1 font-medium text-xs ${color}`}>
      {value.replace("_", " ")}
    </span>
  );
}
