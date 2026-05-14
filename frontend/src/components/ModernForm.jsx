import React from 'react';

export const Input = ({ 
  label, 
  lar = false,
  error = null,
  icon = null,
  className = '',
  ...props 
}) => {
  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">{icon}</span>}
        <input
          className={`input ${icon ? 'pl-12' : ''} ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
    </div>
  );
};

export const Select = ({ 
  label, 
  options = [],
  error = null,
  className = '',
  ...props 
}) => {
  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <select
        className={`input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
    </div>
  );
};

export const Textarea = ({ 
  label, 
  error = null,
  className = '',
  ...props 
}) => {
  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <textarea
        className={`input resize-none ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
    </div>
  );
};

export const Checkbox = ({ label, ...props }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" className="checkbox" {...props} />
      <span className="text-sm font-medium text-dark-700">{label}</span>
    </label>
  );
};
