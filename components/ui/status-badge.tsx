import React from 'react';
import { Badge } from './badge';

interface StatusBadgeProps {
  status: 'planning' | 'final' | 'completed' | 'running' | 'pending' | 'failed';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    planning: { label: 'Planning', className: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400' },
    final: { label: 'Final', className: 'bg-green-400 text-green-900 hover:bg-green-400' },
    completed: { label: 'Completed', className: 'bg-green-500 text-white hover:bg-green-500' },
    running: { label: 'Running', className: 'bg-blue-500 text-white hover:bg-blue-500' },
    pending: { label: 'Pending', className: 'bg-gray-300 text-gray-700 hover:bg-gray-300' },
    failed: { label: 'Failed', className: 'bg-red-500 text-white hover:bg-red-500' },
  };

  const variant = variants[status];

  return (
    <Badge className={`${variant.className} ${className || ''}`}>
      {variant.label}
    </Badge>
  );
}
