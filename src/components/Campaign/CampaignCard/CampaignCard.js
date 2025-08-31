import React from 'react';
import './CampaignCard.css';

function CampaignCard({ campaign, onEdit, onDelete, onView, onSelect, isSelected }) {
  const cardClassName = `campaign-card ${isSelected ? 'selected' : ''}`;

  const handleSelectClick = (e) => {
    e.stopPropagation(); // Prevent the card's onView from firing
    onSelect(campaign);
  };

  return (
    <div className={cardClassName} onClick={() => onView(campaign)}>
      <h2>{campaign.name}</h2>
      <div className="campaign-card-actions">
        <button onClick={handleSelectClick}>Seleccionar</button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(campaign); }}>Edit</button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(campaign.id); }}>Delete</button>
      </div>
    </div>
  );
}

export default CampaignCard;