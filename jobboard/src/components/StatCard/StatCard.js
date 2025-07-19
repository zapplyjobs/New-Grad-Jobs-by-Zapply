import React from 'react';
import './StatCard.css';

const StatCard = ({ number, label }) => {
  // Check if this is a date stat (contains multiple lines or specific date format)
  const isDateStat = label === 'LAST UPDATED' || String(number).includes('\n') || String(number).length > 10;
  
  return (
    <div className="stat">
      <div className={`stat-number ${isDateStat ? 'date-stat' : ''}`}>
        {number}
      </div>
      <div className="stat-label">
        {label}
      </div>
    </div>
  );
};

export default StatCard;