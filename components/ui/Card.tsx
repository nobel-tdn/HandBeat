
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-surface-alt/70 backdrop-blur-md p-4 rounded-2xl shadow-depth border border-primary/20 ${className}`}>
      {children}
    </div>
  );
};
