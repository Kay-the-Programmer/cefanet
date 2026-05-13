import React from 'react';
import { cn } from '../../utils/cn';


interface StatusBadgeProps {
  status: string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const configs = {
    PENDING: { color: 'bg-muted text-muted-foreground border-border', label: 'Pending Review' },
    APPROVED: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', label: 'Approved' },
    REJECTED: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', label: 'Rejected' },
    ONGOING: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800', label: 'In Progress' },
    COMPLETED: { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800', label: 'Completed' },
    success: { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800', label: 'Success' },
    warning: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800', label: 'Warning' },
    error: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', label: 'Error' },
    neutral: { color: 'bg-muted text-muted-foreground border-border', label: 'Neutral' },
  };

  const config = configs[status as keyof typeof configs] || { 
    color: 'bg-muted text-muted-foreground border-border', 
    label: status 
  };

  return (
    <span className={cn(
      "status-badge border transition-colors",
      config.color
    )}>
      {label || config.label}
    </span>
  );
};
