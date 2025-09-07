import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, icon, extra }) => {
  return (
    <div
      className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/60 rounded-xl shadow-2xl transition-all duration-300 ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60">
            <div className="flex items-center">
                {icon && <span className="mr-3 text-sky-400">{icon}</span>}
                <h2 className="text-lg font-orbitron font-semibold text-gray-200">{title}</h2>
            </div>
            {extra && <div>{extra}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};