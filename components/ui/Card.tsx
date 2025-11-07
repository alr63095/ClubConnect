
import React from 'react';
// Fix: Import HTMLMotionProps to correctly type the props for a motion component.
import { motion, HTMLMotionProps } from 'framer-motion';

// Fix: Extend HTMLMotionProps<'div'> to allow passing standard div props like onClick.
type CardProps = HTMLMotionProps<'div'> & {
  children: React.ReactNode;
  className?: string;
};

// Fix: Spread the rest of the props to the motion.div element.
const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-surface p-6 rounded-xl shadow-md ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
