import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

/**
 * Formats a number into compact notation (1K, 10K, 1M, etc.)
 */
export function formatCompactNumber(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);

  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1) + "K";
  }
  return num.toLocaleString();
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  /** If true, formats numbers as 1K, 10K, 1M. Default: true */
  compactNumbers?: boolean;
  /** If true, highlights the card with a colored border */
  highlight?: boolean;
  /** If true, adds a pulsing indicator */
  pulse?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  compactNumbers = true,
  highlight = false,
  pulse = false,
}: StatCardProps) {
  const displayValue = compactNumbers ? formatCompactNumber(value) : value;

  return (
    <Card className={cn(
      "hover-elevate transition-all",
      highlight && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {title}
              {pulse && (
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </span>
            <span className={cn(
              "text-2xl font-semibold tracking-tight",
              highlight && "text-primary"
            )}>
              {displayValue}
            </span>
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}% from last month
              </span>
            )}
          </div>
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
