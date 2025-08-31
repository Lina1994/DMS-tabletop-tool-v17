import React from 'react';
import './CampaignSheetModal.css';

function CampaignSheetModal({ campaign, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{campaign.name}</h2>
        {campaign.image_data && <img src={campaign.image_data} alt={campaign.name} className="campaign-image" />}
        <p><strong>Description:</strong> {campaign.description}</p>
        <p><strong>Author:</strong> {campaign.author}</p>
        <p><strong>Game:</strong> {campaign.game}</p>
        <p><strong>Participants:</strong> {campaign.participants}</p>
        <p><strong>Notes:</strong> {campaign.notes}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default CampaignSheetModal;