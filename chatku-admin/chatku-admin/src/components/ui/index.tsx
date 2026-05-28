import React from 'react';
import './ui.css';

export const Card: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, action, className = '', children }) => (
  <div className={`card ${className}`}>
    {(title || action) && (
      <div className="card-header">
        <div>
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

export const Badge: React.FC<{ tone?: 'brand' | 'success' | 'info' | 'warn' | 'danger'; children: React.ReactNode }> = ({
  tone = 'brand', children,
}) => <span className={`badge badge-${tone}`}>{children}</span>;

export const Button: React.FC<{
  variant?: 'primary' | 'ghost' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ variant = 'primary', onClick, disabled, children }) => (
  <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled}>
    {children}
  </button>
);
