import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, PAYMENT_STATUS_COLORS } from "@/lib/constants";
import type { BookingStatus, PaymentStatus } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status];
  
  return (
    <Badge
      variant="secondary"
      className={cn(
        colors.bg,
        colors.text,
        colors.dark,
        "border-0 font-medium capitalize",
        className
      )}
      data-testid={`status-badge-${status}`}
    >
      {status}
    </Badge>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const colors = PAYMENT_STATUS_COLORS[status];
  
  return (
    <Badge
      variant="secondary"
      className={cn(
        colors.bg,
        colors.text,
        colors.dark,
        "border-0 font-medium capitalize",
        className
      )}
      data-testid={`payment-status-badge-${status}`}
    >
      {status}
    </Badge>
  );
}
