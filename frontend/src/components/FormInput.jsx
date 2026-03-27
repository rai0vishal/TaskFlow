import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = forwardRef(({
  label,
  id,
  type = 'text',
  error,
  theme = 'light',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const isDark = theme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  return (
    <div className={`flex flex-col space-y-1.5 relative ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className={`text-sm font-medium ${isDark ? 'text-surface-300' : 'text-surface-700'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={inputType}
          className={`
            w-full px-4 py-2.5 border rounded-xl
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            ${isPasswordType ? 'pr-11' : ''}
            ${isDark 
              ? 'bg-surface-800/50 text-white placeholder:text-surface-500 border-surface-700' 
              : 'bg-surface-50 text-surface-900 placeholder:text-surface-400 border-surface-200'}
            ${error && !isDark ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
            ${error && isDark ? 'border-red-500/80 focus:ring-red-500/20 focus:border-red-500/80' : ''}
            ${className}
          `}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-surface-400 hover:text-white hover:bg-surface-700' : 'text-surface-500 hover:text-surface-900 hover:bg-surface-200'
            }`}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-sm text-red-500 mt-1">
          {error}
        </span>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
