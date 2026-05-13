import React from 'react';
import { cn } from '../../utils/cn';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subValue, 
  colorClass = "border-primary",
  icon: Icon,
  trend,
  color
}) => (
  <div className={cn("dashboard-card border-l-4 shadow-sm p-6 relative overflow-hidden", colorClass, color)}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="label-caps mb-1 text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-mono font-bold text-foreground tracking-tight">{value}</h3>
      </div>
      {Icon && (
        <div className={cn("p-2 rounded-none", color ? "bg-white/10" : "bg-primary/10")}>
          <Icon className={cn("w-5 h-5", color ? "text-white" : "text-primary")} />
        </div>
      )}
    </div>
    
    <div className="flex items-center gap-3">
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase",
          trend.isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend.value}%
        </div>
      )}
      {subValue && (
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{subValue}</span>
      )}
    </div>
  </div>
);
