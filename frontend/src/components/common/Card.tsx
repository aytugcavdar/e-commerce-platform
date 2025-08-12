import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  to?: string;
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ to, className, children }) => {
  const content = (
    <div className={`card bg-base-200 shadow-xl hover:bg-base-300 transition-colors ${className}`}>
      <div className="card-body items-center text-center">
        {children}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
};

export default Card;