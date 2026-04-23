import React from 'react';

export const SkeletonCard = () => (
  <div className="skeleton h-[90px] w-full rounded-[var(--radius-md)]"></div>
);

export const SkeletonStats = () => (
  <div className="skeleton h-[80px] w-full rounded-[var(--radius-md)]"></div>
);

export const SkeletonChart = () => (
  <div className="skeleton h-[200px] w-full rounded-[var(--radius-md)]"></div>
);

export const Spinner = ({ size = 'md', color = 'primary' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const colors = {
    primary: 'text-primary',
    white: 'text-white',
    surface: 'text-text-muted'
  };

  return (
    <div className="flex justify-center items-center">
      <svg className={`animate-spin ${sizes[size]} ${colors[color]}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
};
