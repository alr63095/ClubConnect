
import React from 'react';
// Fix: Import HTMLMotionProps to correctly type the props for a motion component.
import { motion, HTMLMotionProps } from 'framer-motion';

// Fix: Extend HTMLMotionProps<'button'> to be compatible with framer-motion's motion.button component.
// This resolves the type error on props like 'onDrag'.
type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
};

// Fix: Added 'size' to the component's props with a default value of 'md'.
const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading = false, ...props }) => {
  // Fix: Removed hardcoded padding 'px-4 py-2' to allow dynamic sizing.
  // Added 'border' to base classes to ensure layout consistency
  const baseClasses = 'rounded-lg font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border';

  const variantClasses = {
    primary: 'bg-primary text-white border-primary-dark hover:bg-primary-dark focus:ring-primary shadow-sm hover:shadow-md',
    secondary: 'bg-secondary text-white border-secondary-dark hover:bg-secondary-dark focus:ring-secondary shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-primary border-transparent hover:bg-teal-50 focus:ring-primary hover:border-teal-100',
    danger: 'bg-red-600 text-white border-red-700 hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
  };

  // Fix: Added size-specific classes.
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      // Fix: Applied the appropriate size class based on the 'size' prop.
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </motion.button>
  );
};

export default Button;