import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md', // Not specified in prompt but usually needed, will map to the exact spec padding
  className = '',
  isLoading = false,
  disabled = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center transition-all duration-150 focus:outline-none';
  
  // As per Section 11 specs
  const variants = {
    primary: 'bg-primary text-white border-none font-[600] text-[14px] px-[20px] py-[9px] rounded-[var(--radius-sm)] hover:bg-primary-dark active:scale-[0.98]',
    secondary: 'bg-transparent text-primary border-[1.5px] border-primary font-[600] text-[14px] px-[20px] py-[9px] rounded-[var(--radius-sm)] hover:bg-primary-light active:scale-[0.98]',
    ghost: 'bg-bg-surface text-text-muted border-[0.5px] border-border font-[600] text-[14px] px-[20px] py-[9px] rounded-[var(--radius-sm)] hover:bg-border-light active:scale-[0.98]',
    // Danger isn't in spec 11, but might be used. Fallback to similar styles:
    danger: 'bg-danger text-white border-none font-[600] text-[14px] px-[20px] py-[9px] rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98]'
  };

  const variantStyles = variants[variant] || variants.primary;
  const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
