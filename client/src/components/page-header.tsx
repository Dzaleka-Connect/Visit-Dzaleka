import type React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  actions,
  children,
  className 
}: PageHeaderProps) {
  const headerActions = actions ?? children;

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {headerActions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {headerActions}
        </div>
      )}
    </div>
  );
}
