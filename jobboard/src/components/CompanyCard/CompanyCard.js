import React from 'react';
import './CompanyCard.css';

const CompanyCard = ({ name, icon, link }) => {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="company"
      aria-label={`Visit ${name} careers page`}
    >
      <span className="company-icon" aria-hidden="true">
        {icon}
      </span>
      <div className="company-name">{name}</div>
    </a>
  );
};

export default CompanyCard;