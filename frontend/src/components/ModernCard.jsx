import React from 'react';

export const Card = ({ children, className = '', interactive = false, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-dark-100 ${
        interactive ? 'hover:-translate-y-1 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 pb-4 border-b border-dark-100 ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-6 pt-4 border-t border-dark-100 flex gap-3 ${className}`}>
    {children}
  </div>
);
