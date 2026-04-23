import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = forwardRef(({
  label,
  id,
  type = 'text',
  error,
  theme = 'light', // Legacy prop, can ignore as CSS variables handle dark mode now
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  // Form Shake on Error (Section 12g)
  // If error is present, we add invalid-shake class
  
  return (
    <div className={`flex flex-col space-y-1.5 relative ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-[12px] font-[500] text-text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={inputType}
          className={`
            w-full px-[14px] py-[9px] border-[0.5px] rounded-[var(--radius-sm)]
            bg-bg-card text-text-body border-border
            placeholder:text-text-hint
            transition-all duration-200
            focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.12)]
            ${isPasswordType ? 'pr-11' : ''}
            ${error ? 'invalid-shake border-danger focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}
            ${className}
          `}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-[var(--radius-sm)] transition-colors text-text-muted hover:text-text-body hover:bg-bg-surface cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-[11px] text-danger mt-1 font-[400]">
          {error}
        </span>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
