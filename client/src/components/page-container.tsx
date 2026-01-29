import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[1400px]",
  "2xl": "max-w-[1600px]",
  full: "max-w-full",
};

export function PageContainer({ 
  children, 
  className,
  maxWidth = "xl" 
}: PageContainerProps) {
  return (
    <div className={cn(
      "w-full mx-auto space-y-6",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}
