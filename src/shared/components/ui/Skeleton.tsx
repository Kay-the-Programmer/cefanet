import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn("animate-pulse bg-muted rounded-none", className)} />
);

export const CardSkeleton: React.FC = () => (
  <div className="dashboard-card space-y-4">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-8 w-40" />
    <Skeleton className="h-2 w-32" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-border/50">
    <td className="px-8 py-6"><Skeleton className="h-4 w-32" /></td>
    <td className="px-8 py-6"><Skeleton className="h-4 w-20" /></td>
    <td className="px-8 py-6"><Skeleton className="h-4 w-24 ml-auto" /></td>
    <td className="px-8 py-6"><Skeleton className="h-4 w-24 ml-auto" /></td>
    <td className="px-8 py-6"><Skeleton className="h-4 w-24 ml-auto" /></td>
    <td className="px-8 py-6"><Skeleton className="h-8 w-8 ml-auto" /></td>
  </tr>
);

export const ChartSkeleton: React.FC = () => (
  <div className="w-full h-full flex items-end gap-2 px-4 pb-4">
    {[...Array(12)].map((_, i) => (
      <Skeleton 
        key={i} 
        className="flex-1" 
        style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }} 
      />
    ))}
  </div>
);
