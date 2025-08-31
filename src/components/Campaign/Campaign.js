import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './Campaign.css';
import AddCampaignModal from './AddCampaignModal';
import EditCampaignModal from './EditCampaignModal';
import CampaignSheetModal from './CampaignSheetModal';
import CampaignCard from './CampaignCard/CampaignCard';
import { useCampaign } from '../../contexts/CampaignContext';
import API_BASE_URL from '../../apiConfig';
import ConfirmModal from './ConfirmModal'; // Import the new ConfirmModal

function Campaign() {
  const [campaigns, setCampaigns] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const { currentCampaign, setCurrentCampaign } = useCampaign();

  // State for custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [campaignToDeleteId, setCampaignToDeleteId] = useState(null);
  const [confirmLevel, setConfirmLevel] = useState(0);
  const [confirmMessage, setConfirmMessage] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/campaigns`)
      .then(response => response.json())
      .then(data => setCampaigns(data))
      .catch(error => console.error('Error fetching campaigns:', error));
  }, []);

  const handleAddCampaign = (campaign) => {
    const newCampaign = { ...campaign, id: uuidv4() };
    fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCampaign),
    })
      .then(response => response.json())
      .then(data => {
        setCampaigns([...campaigns, { ...newCampaign, id: data.id }]);
        setIsAddModalOpen(false);
      })
      .catch(error => console.error('Error adding campaign:', error));
  };

  const handleEditCampaign = (campaign) => {
    fetch(`${API_BASE_URL}/campaigns/${campaign.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaign),
      })
      .then(() => {
        setCampaigns(campaigns.map(c => c.id === campaign.id ? campaign : c));
        setIsEditModalOpen(false);
        setSelectedCampaign(null);
      })
      .catch(error => console.error('Error updating campaign:', error));
  };

  const handleDeleteCampaignRequest = (campaignId) => {
    setCampaignToDeleteId(campaignId);
    setConfirmLevel(1);
    setConfirmMessage("Are you sure you want to delete this campaign?");
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmLevel === 1) {
      setConfirmLevel(2);
      setConfirmMessage("This action is irreversible. Are you absolutely sure?");
    } else if (confirmLevel === 2) {
      setConfirmLevel(3);
      setConfirmMessage("Final confirmation. Delete campaign?");
    } else if (confirmLevel === 3) {
      try {
        const response = await fetch(`${API_BASE_URL}/campaigns/${campaignToDeleteId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        setCampaigns(campaigns.filter(c => c.id !== campaignToDeleteId));
        setShowConfirmModal(false);
        setCampaignToDeleteId(null);
        setConfirmLevel(0);
        setConfirmMessage('');
      } catch (error) {
        console.error('Error deleting campaign:', error);
        setShowConfirmModal(false);
        setCampaignToDeleteId(null);
        setConfirmLevel(0);
        setConfirmMessage('');
      }
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setCampaignToDeleteId(null);
    setConfirmLevel(0);
    setConfirmMessage('');
  };

  const openEditModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsEditModalOpen(true);
  };

  const openSheetModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsSheetModalOpen(true);
  };

  return (
    <div className="campaign-container">
      <h1>Campaigns</h1>
      <button className="add-campaign-button" onClick={() => setIsAddModalOpen(true)}>+ Add Campaign</button>
      <div className="campaign-list">
        {campaigns.map(campaign => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onEdit={openEditModal}
            onDelete={handleDeleteCampaignRequest} // Use the new request handler
            onView={openSheetModal} // This now only opens the sheet
            onSelect={setCurrentCampaign} // This now only selects the campaign
            isSelected={currentCampaign?.id === campaign.id}
          />
        ))}
      </div>
      {isAddModalOpen && (
        <AddCampaignModal
          onSave={handleAddCampaign}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
      {isEditModalOpen && selectedCampaign && (
        <EditCampaignModal
          campaign={selectedCampaign}
          onSave={handleEditCampaign}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCampaign(null);
          }}
        />
      )}
      {isSheetModalOpen && selectedCampaign && (
        <CampaignSheetModal
          campaign={selectedCampaign}
          onClose={() => {
            setIsSheetModalOpen(false);
            setSelectedCampaign(null);
          }}
        />
      )}
      {showConfirmModal && (
        <ConfirmModal
          message={confirmMessage}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}

export default Campaign;