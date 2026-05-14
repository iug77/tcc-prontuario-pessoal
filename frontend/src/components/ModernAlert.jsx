import React from 'react';

export const Alert = ({ 
  type = 'info',
  title,
  message,
  onClose,
  className = '',
  ...props 
}) => {
  const types = {
    info: 'bg-primary-50 border-primary-500 text-primary-700',
    success: 'bg-accent-50 border-accent-500 text-accent-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    danger: 'bg-red-50 border-red-500 text-red-700',
  };

  const icons = {
    info: '🛈',
    success: '✓',
    warning: '⚠',
    danger: '✕',
  };

  return (
    <div 
      className={`alert ${types[type]} ${className}`}
      {...props}
    >
      <span className="text-xl flex-shrink-0">{icons[type]}</span>
      <div className="flex-grow">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        {message && <p className="text-sm opacity-90">{message}</p>}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-lg opacity-50 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export const Badge = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-accent-100 text-accent-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <span 
      className={`badge ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
