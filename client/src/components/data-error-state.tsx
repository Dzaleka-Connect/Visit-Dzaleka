import { AlertTriangle, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

interface DataErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: LucideIcon;
  className?: string;
  action?: React.ReactNode;
}

export function DataErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  icon = AlertTriangle,
  className,
  action,
}: DataErrorStateProps) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      className={className}
      action={
        action || (onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        ) : null)
      }
    />
  );
}
