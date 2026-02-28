import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  iconClassName?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, className, iconClassName }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-card-foreground">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs font-medium", trendUp ? "text-success" : "text-destructive")}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconClassName || "bg-accent text-accent-foreground")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
