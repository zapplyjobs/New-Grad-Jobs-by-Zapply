import React from 'react';
import './Button.css';

const Button = ({
  href,
  variant = 'primary',
  size = 'medium',
  icon,
  children,
  onClick,
  target,
  rel,
  ...props
}) => {
  const className = `btn btn-${variant} ${size === 'large' ? 'btn-hero' : ''}`;

  if (href) {
    return (
      <a
        href={href}
        className={className}
        target={target}
        rel={rel}
        {...props}
      >
        {icon && <span className="btn-icon">{icon}</span>}
        {children}
      </a>
    );
  }

  return (
    <button className={className} onClick={onClick} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
