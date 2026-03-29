'use client';

import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, glass = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-xl border border-dark-600',
          glass
            ? 'bg-dark-800 bg-opacity-40 backdrop-blur-md'
            : 'bg-dark-800',
          'shadow-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
