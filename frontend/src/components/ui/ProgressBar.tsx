'use client';

import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  progress: number;
  className?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  animated = true,
}) => {
  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={clsx('w-full', className)}>
      <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full bg-gradient-accent transition-all duration-300',
            animated && 'shadow-glow'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-right text-sm text-gray-400">
        {percentage}%
      </div>
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';
