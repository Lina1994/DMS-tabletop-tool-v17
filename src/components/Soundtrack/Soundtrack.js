import React, { useState, useEffect, useCallback } from 'react';
import AddEditSongModal from './AddEditSongModal';
import ConfirmModal from '../Maps/ConfirmModal'; // Import the custom confirm modal
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import './Soundtrack.css';
import API_BASE_URL from '../../apiConfig';

const generateUniqueId = () => {
  return `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

function Soundtrack() {
  const [songs, setSongs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [songToEdit, setSongToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);
  const { playSong, currentSong } = useAudioPlayer();

  const loadSongs = useCallback(async () => {
    try {
      let loadedSongs = [];
      if (window.ipcRenderer) {
        const response = await window.ipcRenderer.invoke('load-songs');
        if (response.success) {
          loadedSongs = response.songs;
        } else {
          console.error('Error loading songs (Electron):', response.error);
        }
      } else {
        console.warn('ipcRenderer not available. Running in web mode. Loading songs from backend...');
        const response = await fetch(`${API_BASE_URL}/songs`);
        if (response.ok) {
          loadedSongs = await response.json();
        } else {
          console.error('Error loading songs (Web):', response.statusText);
        }
      }
      const processedSongs = loadedSongs.map(song => ({
        ...song,
        filePath: song.filePath ? song.filePath.split(/[\\/]/).pop() : ''
      }));
      setSongs(processedSongs);

    } catch (error) {
      console.error('Error loading songs:', error);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const handleOpenModal = (song = null) => {
    setSongToEdit(song);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSongToEdit(null);
  };

  const handleSaveSong = async (songData) => {
    const isEditing = !!songData.id;
    let songToSave = { ...songData };

    if (!isEditing) {
      songToSave.id = generateUniqueId();
    }

    console.log('handleSaveSong called with songData:', songToSave);
    const ipcChannel = isEditing ? 'edit-song' : 'add-song';
    const url = isEditing ? `${API_BASE_URL}/songs/${songToSave.id}` : `${API_BASE_URL}/songs`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      if (window.ipcRenderer) {
        const response = await window.ipcRenderer.invoke(ipcChannel, songToSave);
        if (response.success) {
          loadSongs();
          handleCloseModal();
        } else {
          console.error(`Error saving song (Electron):`, response.error);
        }
      } else {
        const fetchResponse = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(songToSave),
        });
        if (fetchResponse.ok) {
          loadSongs();
          handleCloseModal();
        } else {
          const errorData = await fetchResponse.json();
          console.error(`Error saving song (Web):`, errorData.error);
        }
      }
    } catch (error) {
      console.error(`Error in handleSaveSong (${window.ipcRenderer ? 'Electron' : 'Web'}):`, error);
    }
  };

  const handleDeleteRequest = (songId) => {
    const song = songs.find(s => s.id === songId);
    if (song) {
        setSongToDelete(song);
        setIsConfirmModalOpen(true);
    }
  };

  const handleCancelDelete = () => {
    setSongToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!songToDelete) return;

    const songId = songToDelete.id;
    console.log('handleConfirmDelete called for songId:', songId);

    try {
      if (window.ipcRenderer) {
        const response = await window.ipcRenderer.invoke('delete-song', songId);
        if (response.success) {
          loadSongs();
        } else {
          console.error(`Error deleting song (Electron):`, response.error);
        }
      } else {
        const fetchResponse = await fetch(`${API_BASE_URL}/songs/${songId}`, {
          method: 'DELETE',
        });
        if (fetchResponse.ok) {
          loadSongs();
        } else {
          const errorData = await fetchResponse.json();
          console.error(`Error deleting song (Web):`, errorData.error);
        }
      }
    } catch (error) {
      console.error(`Error in handleDeleteSong (${window.ipcRenderer ? 'Electron' : 'Web'}):`, error);
    }
    handleCancelDelete(); // Close modal after operation
  };

  const filteredSongs = songs.filter(song =>
    (song.name && song.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (song.group && song.group.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="soundtrack-container">
      <h2>Soundtrack</h2>
      <div className="soundtrack-controls">
        <button onClick={() => handleOpenModal()}>Añadir Canción</button>
        <input
          type="text"
          placeholder="Buscar por nombre o grupo..."
          className="soundtrack-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="song-list">
        {filteredSongs.map(song => (
          <div
            key={song.id}
            className={`song-item ${currentSong && currentSong.id === song.id ? 'playing' : ''}`}
            onClick={() => playSong(song)}
          >
            <div className="song-info">
              <span className="song-name">{song.name}</span>
              <span className="song-group">{song.group}</span>
            </div>
            <div className="song-controls">
              <button onClick={(e) => { e.stopPropagation(); handleOpenModal(song); }}>Editar</button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(song.id); }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <AddEditSongModal
          song={songToEdit}
          onClose={handleCloseModal}
          onSave={handleSaveSong}
        />
      )}
      {isConfirmModalOpen && (
        <ConfirmModal
          message={`¿Estás seguro de que quieres eliminar la canción "${songToDelete?.name}"? El archivo de audio también será eliminado.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}

export default Soundtrack;
