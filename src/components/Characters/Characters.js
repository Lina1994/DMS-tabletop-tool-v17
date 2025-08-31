import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import './Characters.css';
import { experienceTable } from '../../utils/experienceTable';

import AddCharacterModal from './AddCharacterModal';
import EditCharacterModal from './EditCharacterModal';
import CharacterSheetModal from './CharacterSheetModal';
import CharacterCard from './CharacterCard/CharacterCard';
import API_BASE_URL from '../../apiConfig';

const generateUniqueId = () => {
  return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

function Characters() {
  console.log('Characters component rendered');
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentCampaign } = useCampaign();

  // Placeholder for modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [selectedCharacterForSheet, setSelectedCharacterForSheet] = useState(null);

  const fetchCharacters = useCallback(async () => {
    try {
      const url = currentCampaign 
        ? `${API_BASE_URL}/characters?campaignId=${currentCampaign.id}`
        : `${API_BASE_URL}/characters`;
      
      console.log('Fetching characters from URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const loadedCharacters = await response.json();
      setCharacters(loadedCharacters.map(char => ({
        ...char,
        id: char.id || generateUniqueId(),
      })));
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  }, [currentCampaign]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleOpenEditModal = (character) => {
    setEditingCharacter(character);
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setEditingCharacter(null);
    setIsEditModalOpen(false);
  };

  const handleOpenSheetModal = (character) => {
    setSelectedCharacterForSheet(character);
    setIsSheetModalOpen(true);
  };
  const handleCloseSheetModal = () => {
    setSelectedCharacterForSheet(null);
    setIsSheetModalOpen(false);
  };

  const handleAddCharacter = async (characterData) => {
    const newCharacter = {
      ...characterData,
      id: characterData.id || generateUniqueId(),
      campaign_id: currentCampaign ? currentCampaign.id : null, // Associate with current campaign
    };

    try {
      const response = await fetch(`${API_BASE_URL}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCharacter),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const savedCharacter = await response.json();
      setCharacters(prevCharacters => [...prevCharacters, { ...newCharacter, id: savedCharacter.id }]);
      handleCloseAddModal();
    } catch (error) {
      console.error('Error adding character:', error);
    }
  };

  const handleUpdateCharacter = async (updatedCharacter) => {
    try {
      const response = await fetch(`${API_BASE_URL}/characters/${updatedCharacter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCharacter),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setCharacters(prevCharacters => prevCharacters.map(char => (char.id === updatedCharacter.id ? updatedCharacter : char)));
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating character:', error);
    }
  };

  const handleDeleteCharacter = async (characterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/characters/${characterId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setCharacters(prevCharacters => prevCharacters.filter(char => char.id !== characterId));
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const filteredCharacters = useMemo(() => {
    return characters.filter(char => 
      char.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [characters, searchTerm]);

  const canLevelUp = (character) => {
    const nextLevel = character.level + 1;
    if (experienceTable[nextLevel]) {
      return character.experiencePoints >= experienceTable[nextLevel];
    }
    return false;
  };

  return (
    <div className="characters-container">
      <div className="characters-buttons-container">
        <button onClick={handleOpenAddModal} className="add-character-btn">
          <span>+ Añadir Personaje</span>
        </button>
      </div>

      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Buscar personajes por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="character-search-input"
        />
      </div>

      <div className="character-list">
        {filteredCharacters.length === 0 ? (
          <p>No hay personajes que coincidan con tu búsqueda.</p>
        ) : (
          <ul>
            {filteredCharacters.map((character) => (
              <CharacterCard 
                key={character.id} 
                character={character} 
                onOpenSheet={handleOpenSheetModal}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteCharacter}
                canLevelUp={canLevelUp(character)}
              />
            ))}
          </ul>
        )}
      </div>

      {isAddModalOpen && (
        <AddCharacterModal onClose={handleCloseAddModal} onAddCharacter={handleAddCharacter} />
      )}
      {isEditModalOpen && (
        <EditCharacterModal onClose={handleCloseEditModal} onUpdateCharacter={handleUpdateCharacter} character={editingCharacter} />
      )}
      {isSheetModalOpen && (
        <CharacterSheetModal onClose={handleCloseSheetModal} character={selectedCharacterForSheet} />
      )}
    </div>
  );
}

export default Characters;
