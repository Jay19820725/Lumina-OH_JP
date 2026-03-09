import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "btn-pill inline-flex items-center justify-center text-sm tracking-widest uppercase transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-ink text-bg-washi border-ink hover:bg-transparent hover:text-ink shadow-lg shadow-ink/5",
    secondary: "bg-white/30 backdrop-blur-md text-ink border-white/50 hover:bg-white/50",
    outline: "bg-transparent text-ink border-ink/10 hover:border-ink/30 hover:bg-ink/5"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
