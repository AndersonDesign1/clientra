import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

interface StatePanelProps {
  description: string;
  title: string;
}

export function LoadingPanel({
  title = "Loading data",
  description = "Please wait while we fetch the latest records.",
}: Partial<StatePanelProps>) {
  return (
    <div className="border-slate-200 border-y py-5">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full max-w-sm" />
      </div>
      <span className="sr-only">
        {title}. {description}
      </span>
    </div>
  );
}

export function ErrorPanel({
  title = "Unable to load data",
  description = "Try refreshing the page in a moment.",
}: Partial<StatePanelProps>) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export function EmptyPanel({
  title = "Nothing to show yet",
  description = "There are no records available right now.",
}: Partial<StatePanelProps>) {
  return (
    <Empty className="border-slate-200 border-y">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
