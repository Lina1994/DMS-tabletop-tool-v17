import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '../../contexts/CampaignContext';
import './Encounters.css';
import EncounterCard from './EncounterCard/EncounterCard.js';
import AddEncounterModal from './AddEncounterModal.js';
import EditEncounterModal from './EditEncounterModal.js';
import DifficultyInfoModal from './DifficultyInfoModal.js'; // Import the new modal
import API_BASE_URL from '../../apiConfig';

function Encounters() {
  const [encounters, setEncounters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentCampaign } = useCampaign();
  const navigate = useNavigate();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [isDifficultyInfoModalOpen, setIsDifficultyInfoModalOpen] = useState(false); // New state for info modal

  const fetchEncounters = useCallback(async () => {
    try {
      // TODO: Add campaign filtering in the backend API
      const url = `${API_BASE_URL}/encounters`;
      
      console.log('Fetching encounters from URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const loadedEncounters = await response.json();
      setEncounters(loadedEncounters.map(enc => ({
        ...enc,
        id: enc.id
      })));
    } catch (error) {
      console.error('Error fetching encounters:', error);
    }
  }, [currentCampaign]);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleOpenEditModal = (encounter) => {
    setEditingEncounter(encounter);
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setEditingEncounter(null);
    setIsEditModalOpen(false);
  };

  // Handlers for Difficulty Info Modal
  const handleOpenDifficultyInfoModal = () => setIsDifficultyInfoModalOpen(true);
  const handleCloseDifficultyInfoModal = () => setIsDifficultyInfoModalOpen(false);

  const handleNavigateToCombat = () => {
    navigate('/combat');
  };

  const handleAddEncounter = async (encounterData) => {
    const newEncounter = {
      ...encounterData,
      campaign_id: currentCampaign ? currentCampaign.id : null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/encounters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEncounter),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      fetchEncounters(); // Refetch to get the new encounter
      handleCloseAddModal();
    } catch (error) {
      console.error('Error adding encounter:', error);
    }
  };

  const handleUpdateEncounter = async (updatedEncounter) => {
    try {
      const response = await fetch(`${API_BASE_URL}/encounters/${updatedEncounter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEncounter),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      fetchEncounters(); // Refetch to get the updated encounter
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating encounter:', error);
    }
  };

  const handleDeleteEncounter = async (encounterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/encounters/${encounterId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      fetchEncounters(); // Refetch to update the list
    } catch (error) {
      console.error('Error deleting encounter:', error);
    }
  };

  const filteredEncounters = useMemo(() => {
    return encounters.filter(enc => {
      const campaignFilter = currentCampaign ? enc.campaign_id === currentCampaign.id : true;
      const searchFilter = enc.name.toLowerCase().includes(searchTerm.toLowerCase());
      return campaignFilter && searchFilter;
    });
  }, [encounters, searchTerm, currentCampaign]);

  return (
    <div className="encounters-container">
      <div className="encounters-controls">
        <button onClick={handleOpenAddModal} className="add-encounter-btn">
          <span>+ Añadir Encuentro</span>
        </button>
        <button onClick={handleOpenDifficultyInfoModal} className="info-btn">
          <span>? Dificultad</span>
        </button>
        <button onClick={handleNavigateToCombat} className="combat-btn">
          <span>Ir a Combate</span>
        </button>
      </div>

      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Buscar encuentros por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="encounter-search-input"
        />
      </div>

      <div className="encounter-list">
        {filteredEncounters.length === 0 ? (
          <p>No hay encuentros que coincidan con tu búsqueda.</p>
        ) : (
          <ul>
            {filteredEncounters.map((encounter) => (
              <EncounterCard 
                key={encounter.id} 
                encounter={encounter} 
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteEncounter}
              />
            ))}
          </ul>
        )}
      </div>

      {isAddModalOpen && (
        <AddEncounterModal onClose={handleCloseAddModal} onAddEncounter={handleAddEncounter} />
      )}
      {isEditModalOpen && (
        <EditEncounterModal onClose={handleCloseEditModal} onUpdateEncounter={handleUpdateEncounter} encounter={editingEncounter} />
      )}

      {isDifficultyInfoModalOpen && (
        <DifficultyInfoModal onClose={handleCloseDifficultyInfoModal} />
      )}
    </div>
  );
}

export default Encounters;
