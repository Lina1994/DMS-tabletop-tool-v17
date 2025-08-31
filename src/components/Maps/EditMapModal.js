import React, { useState, useEffect } from 'react';
import './EditMapModal.css';
import API_BASE_URL from '../../apiConfig';

function EditMapModal({ onClose, onEditMap, map }) {
  const [mapName, setMapName] = useState('');
  const [mapGroup, setMapGroup] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState('');
  const [easyBattleSong, setEasyBattleSong] = useState('');
  const [mediumBattleSong, setMediumBattleSong] = useState('');
  const [hardBattleSong, setHardBattleSong] = useState('');
  const [deadlyBattleSong, setDeadlyBattleSong] = useState('');
  const [extremeBattleSong, setExtremeBattleSong] = useState('');

  useEffect(() => {
    if (map) {
      setMapName(map.name);
      setMapGroup(map.group || '');
      setSelectedCampaign(map.campaign_id || '');
      setSelectedSong(map.song_id || '');
      setEasyBattleSong(map.easy_battle_song_id || '');
      setMediumBattleSong(map.medium_battle_song_id || '');
      setHardBattleSong(map.hard_battle_song_id || '');
      setDeadlyBattleSong(map.deadly_battle_song_id || '');
      setExtremeBattleSong(map.extreme_battle_song_id || '');
    }
  }, [map]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/campaigns`)
      .then(response => response.json())
      .then(data => setCampaigns(data))
      .catch(error => console.error('Error fetching campaigns:', error));

    fetch(`${API_BASE_URL}/songs`)
      .then(response => response.json())
      .then(data => setSongs(data))
      .catch(error => console.error('Error fetching songs:', error));
  }, []);

  const handleNameChange = (e) => {
    setMapName(e.target.value);
  };

  const handleGroupChange = (e) => {
    setMapGroup(e.target.value);
  };

  const handleCampaignChange = (e) => {
    setSelectedCampaign(e.target.value);
  };

  const handleSongChange = (e) => {
    setSelectedSong(e.target.value);
  };

  const handleEasyBattleSongChange = (e) => {
    setEasyBattleSong(e.target.value);
  };

  const handleMediumBattleSongChange = (e) => {
    setMediumBattleSong(e.target.value);
  };

  const handleHardBattleSongChange = (e) => {
    setHardBattleSong(e.target.value);
  };

  const handleDeadlyBattleSongChange = (e) => {
    setDeadlyBattleSong(e.target.value);
  };

  const handleExtremeBattleSongChange = (e) => {
    setExtremeBattleSong(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onEditMap({
      ...map,
      name: mapName,
      group: mapGroup,
      campaign_id: selectedCampaign,
      song_id: selectedSong,
      easy_battle_song_id: easyBattleSong,
      medium_battle_song_id: mediumBattleSong,
      hard_battle_song_id: hardBattleSong,
      deadly_battle_song_id: deadlyBattleSong,
      extreme_battle_song_id: extremeBattleSong
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Mapa</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mapName">Nombre del Mapa:</label>
            <input
              type="text"
              id="mapName"
              value={mapName}
              onChange={handleNameChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mapGroup">Grupo:</label>
            <input
              type="text"
              id="mapGroup"
              value={mapGroup}
              onChange={handleGroupChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="campaign">Campaña:</label>
            <select
              id="campaign"
              value={selectedCampaign}
              onChange={handleCampaignChange}
            >
              <option value="">Sin campaña</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="song">Canción:</label>
            <select
              id="song"
              value={selectedSong}
              onChange={handleSongChange}
            >
              <option value="">Sin canción</option>
              {songs.map(song => (
                <option key={song.id} value={song.id}>
                  {song.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="easyBattleSong">Canción Batalla Fácil:</label>
            <select
              id="easyBattleSong"
              value={easyBattleSong}
              onChange={handleEasyBattleSongChange}
            >
              <option value="">Sin canción</option>
              {songs.map(song => (
                <option key={song.id} value={song.id}>
                  {song.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="mediumBattleSong">Canción Batalla Media:</label>
            <select
              id="mediumBattleSong"
              value={mediumBattleSong}
              onChange={handleMediumBattleSongChange}
            >
              <option value="">Sin canción</option>
              {songs.map(song => (
                <option key={song.id} value={song.id}>
                  {song.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="hardBattleSong">Canción Batalla Difícil:</label>
            <select
              id="hardBattleSong"
              value={hardBattleSong}
              onChange={handleHardBattleSongChange}
            >
              <option value="">Sin canción</option>
              {songs.map(song => (
                <option key={song.id} value={song.id}>
                  {song.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="deadlyBattleSong">Canción Batalla Mortal:</label>
            <select
              id="deadlyBattleSong"
              value={deadlyBattleSong}
              onChange={handleDeadlyBattleSongChange}
            >
              <option value="">Sin canción</option>
              {songs.map(song => (
                <option key={song.id} value={song.id}>
                  {song.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="extremeBattleSong">Canción Batalla Extrema:</label>
            <select
              id="extremeBattleSong"
              value={extremeBattleSong}
              onChange={handleExtremeBattleSongChange}
            >
              <option value="">Sin canción</option>
              {songs.map(song => (
                <option key={song.id} value={song.id}>
                  {song.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit">Guardar Cambios</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMapModal;