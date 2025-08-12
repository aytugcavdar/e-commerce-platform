import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  to?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ to, className, children, onClick }) => {
  const content = (
    <div 
      className={`card bg-base-200 shadow-xl hover:bg-base-300 hover:shadow-2xl transition-all duration-300 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="card-body items-center text-center">
        {children}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }

  return content;
};

export default Card;