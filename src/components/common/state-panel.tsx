interface StatePanelProps {
  description: string;
  title: string;
}

function StatePanel({ title, description }: StatePanelProps) {
  return (
    <div className="rounded-xl border bg-white p-4 text-slate-600 text-sm">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}

export function LoadingPanel({
  title = "Loading data",
  description = "Please wait while we fetch the latest records.",
}: Partial<StatePanelProps>) {
  return <StatePanel description={description} title={title} />;
}

export function ErrorPanel({
  title = "Unable to load data",
  description = "Try refreshing the page in a moment.",
}: Partial<StatePanelProps>) {
  return <StatePanel description={description} title={title} />;
}

export function EmptyPanel({
  title = "Nothing to show yet",
  description = "There are no records available right now.",
}: Partial<StatePanelProps>) {
  return <StatePanel description={description} title={title} />;
}
