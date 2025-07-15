
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
  const baseClasses = 'font-title text-lg rounded-lg px-6 py-3 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';
  
  const variantClasses = {
    primary: 'bg-primary hover:bg-accent text-surface shadow-neon hover:shadow-lg transform hover:-translate-y-1',
    secondary: 'border-2 border-primary text-primary hover:bg-primary/20',
    ghost: 'text-text-main hover:text-accent hover:bg-primary/10',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
