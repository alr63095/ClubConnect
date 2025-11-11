import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
};

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-muted mb-1">{label}</label>}
        <input
            id={id}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white text-text placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            {...props}
        />
    </div>
  );
};

export default Input;