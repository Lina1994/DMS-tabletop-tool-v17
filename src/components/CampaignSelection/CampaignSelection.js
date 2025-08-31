import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '../../contexts/CampaignContext';
import './CampaignSelection.css';
import MasterHelpImage from '../../Images/MasterHelp.png'; // Import the image

function CampaignSelection() {
  const { campaigns, fetchCampaigns, setCurrentCampaign } = useCampaign();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSelectCampaign = (campaign) => {
    setCurrentCampaign(campaign);
    navigate('/maps'); // Navigate to a default page after selection
  };

  const handleAddNewCampaign = () => {
    navigate('/campaign'); // Navigate to the Campaign component to add a new one
  };

  return (
    <div className="campaign-selection-container">
      <img src={MasterHelpImage} alt="Master Help" className="master-help-image" />
      <h1>Select a Campaign or Add a New One</h1>
      <div className="campaign-list-container">
        {campaigns.length > 0 ? (
          <ul className="campaign-list">
            {campaigns.map(campaign => (
              <li key={campaign.id} onClick={() => handleSelectCampaign(campaign)} className="campaign-list-item">
                {campaign.name}
              </li>
            ))}
          </ul>
        ) : (
          <p>No campaigns found. Please add a new one.</p>
        )}
      </div>
      <div className="new-campaign-option">
        <p>Or</p>
        <button onClick={handleAddNewCampaign} className="add-new-button">
          Add New Campaign
        </button>
      </div>
    </div>
  );
}

export default CampaignSelection;