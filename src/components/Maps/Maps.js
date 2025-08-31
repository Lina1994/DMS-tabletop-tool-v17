import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AddMapModal from './AddMapModal';
import EditMapModal from './EditMapModal';
import ConfirmModal from './ConfirmModal';
import MapSheetModal from './MapSheetModal';
import MapCard from './MapCard/MapCard'; // Import the new MapCard component
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { useDate } from '../../contexts/DateContext'; // Import useDate
import InfoModal from '../../components/shared/InfoModal/InfoModal'; // Import InfoModal
import generateUniqueId from '../../utils/idGenerator'; // Import generateUniqueId
import './Maps.css';
import API_BASE_URL from '../../apiConfig';

let ipcRenderer = null;
if (window.require) {
  try {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (e) {
    console.warn("Could not load electron modules:", e);
  }
}

function Maps() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isMapSheetModalOpen, setIsMapSheetModalOpen] = useState(false);
  const [selectedMapForSheet, setSelectedMapForSheet] = useState(null);
  const [maps, setMaps] = useState([]);
  const [currentPreviewMap, setCurrentPreviewMap] = useState(null);
  const [editingMap, setEditingMap] = useState(null);
  const [mapToDelete, setMapToDelete] = useState(null);
  const [openSettingsMenu, setOpenSettingsMenu] = useState(null);
  const [openPlayerSettingsMenu, setOpenPlayerSettingsMenu] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [playerWindowDimensions, setPlayerWindowDimensions] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false); // New state for InfoModal
  const [infoModalMessage, setInfoModalMessage] = useState(''); // New state for InfoModal message
  const [infoModalTitle, setInfoModalTitle] = useState(''); // New state for InfoModal title
  const { playSong, currentSong } = useAudioPlayer();
  const { currentCampaign } = useCampaign();
  const { selectedDay } = useDate(); // Get selectedDay from DateContext

  const previewContainerRef = useRef(null);
  const previewImageRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  const initialPan = useRef({ x: 0, y: 0 });

  const navigate = useNavigate(); // Initialize useNavigate

  const handleNavigateToCombat = () => {
    navigate('/combat');
  };

  useEffect(() => {
    if (ipcRenderer) {
      const handleDimensions = (event, dimensions) => {
        setPlayerWindowDimensions(dimensions);
      };
      ipcRenderer.on('player-window-dimensions', handleDimensions);

      return () => {
        ipcRenderer.removeListener('player-window-dimensions', handleDimensions);
      };
    }
  }, []);

  const getMapImageSource = useCallback((map) => {
    if (map.image_data) {
      return map.image_data; // This is already a base64 string
    }
    if (map.imageDataUrl) {
      return map.imageDataUrl;
    }
    if (map.imagePath) {
      return map.imagePath;
    }
    if (map.url) {
      return map.url;
    }
    return ''; // No image source
  }, []);

  const fetchMaps = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/maps`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const loadedMaps = await response.json();
      setMaps(loadedMaps.map(map => ({
        ...map,
        group: map.group_name,
        id: map.id,
        zoom: map.zoom !== undefined ? map.zoom : 1,
        rotation: map.rotation !== undefined ? map.rotation : 0,
        panX: map.panX !== undefined ? map.panX : 0,
        panY: map.panY !== undefined ? map.panY : 0,
        originalWidth: map.original_width,
        originalHeight: map.original_height,
      })));
    } catch (error) {
      console.error('Error fetching maps:', error);
    }
  }, []);

  useEffect(() => {
    fetchMaps();

    if (ipcRenderer) {
      const persistedMap = ipcRenderer.sendSync('get-current-preview-map');
      if (persistedMap) {
        setCurrentPreviewMap(persistedMap);
      }

      const handleUpdatePreview = (event, mapData) => {
        setCurrentPreviewMap(mapData);
      };
      ipcRenderer.on('update-master-preview', handleUpdatePreview);
      return () => {
        ipcRenderer.removeListener('update-master-preview', handleUpdatePreview);
      };
    }
  }, [fetchMaps]);

  useEffect(() => {
    if (ipcRenderer && currentPreviewMap) {
      ipcRenderer.send('set-current-preview-map', currentPreviewMap);
    }
  }, [currentPreviewMap]);

  const uniqueGroups = useMemo(() => {
    const groups = maps.map(map => map.group_name).filter(Boolean);
    return [...new Set(groups)];
  }, [maps]);

  const toggleSettingsMenu = (mapId) => {
    setOpenSettingsMenu(prev => (prev === mapId ? null : mapId));
  };

  const togglePlayerSettingsMenu = () => {
    setOpenPlayerSettingsMenu(prev => !prev);
  };

  const togglePreview = () => {
    setIsPreviewExpanded(!isPreviewExpanded);
  };

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleOpenEditModal = (map) => {
    setEditingMap(map);
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setEditingMap(null);
    setIsEditModalOpen(false);
  };

  const handleOpenMapSheetModal = (map) => {
    setSelectedMapForSheet(map);
    setIsMapSheetModalOpen(true);
  };

  const handleCloseMapSheetModal = () => {
    setSelectedMapForSheet(null);
    setIsMapSheetModalOpen(false);
  };

  const handleUpdateMap = async (updatedMap) => {
    console.log('Maps.js: handleUpdateMap - Received updatedMap from child:', updatedMap);
    try {
      const response = await fetch(`${API_BASE_URL}/maps/${updatedMap.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMap),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setMaps(prevMaps => prevMaps.map(map => (map.id === updatedMap.id ? updatedMap : map)));
      console.log('Map updated successfully in backend.');
    } catch (error) {
      console.error('Error updating map:', error);
    }
  };

  const handleAddMap = async (mapData) => {
    const { group, imageData, originalWidth, originalHeight, ...rest } = mapData;
    const newMap = {
      ...rest,
      group_name: group,
      image_data: imageData,
      zoom: 1, rotation: 0, panX: 0, panY: 0,
      originalWidth,
      originalHeight
    };

    try {
      const response = await fetch(`${API_BASE_URL}/maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMap),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const savedMap = await response.json();
      setMaps(prevMaps => [...prevMaps, { ...newMap, id: savedMap.id }]);
      setOpenSettingsMenu(null); // Close any open settings menu after adding a map
      if (!mapData.keepOpen) {
        handleCloseAddModal();
      }
    } catch (error) {
      console.error('Error adding map:', error);
    }
  };

  const handleAddMaps = async (mapsData) => {
    const newMaps = mapsData.map(mapData => {
      const { group, imageData, originalWidth, originalHeight, ...rest } = mapData;
      return {
        ...rest,
        group_name: group,
        image_data: imageData,
        zoom: 1, rotation: 0, panX: 0, panY: 0,
        originalWidth,
        originalHeight
      };
    });

    try {
      const response = await fetch(`${API_BASE_URL}/maps/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMaps),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const savedMaps = await response.json();
      const newMapsWithIds = newMaps.map((map, index) => ({ ...map, id: savedMaps[index].id }));
      setMaps(prevMaps => [...prevMaps, ...newMapsWithIds]);
      setOpenSettingsMenu(null); // Close any open settings menu after adding maps
      handleCloseAddModal();
    } catch (error) {
      console.error('Error adding maps:', error);
    }
  };

  const handleEditMap = async (editedMap) => {
    const { group, ...rest } = editedMap;
    const mapToUpdate = {
      ...rest,
      group_name: group,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/maps/${mapToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapToUpdate),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      fetchMaps(); // Refetch maps to get the updated song information
      handleCloseEditModal();
    } catch (error) {
      console.error('Error editing map:', error);
    }
  };

  const handleDeleteRequest = (map) => {
    setMapToDelete(map);
    setIsConfirmModalOpen(true);
  };

  const handleCancelDelete = () => {
    setMapToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (mapToDelete) {
      try {
        const response = await fetch(`${API_BASE_URL}/maps/${mapToDelete.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        setMaps(prevMaps => prevMaps.filter(map => map.id !== mapToDelete.id));
        handleCancelDelete();
      } catch (error) {
        console.error('Error deleting map:', error);
      }
    }
  };

  const handleOpenPlayerWindow = () => {
    if (ipcRenderer) {
      ipcRenderer.send('open-player-window');
    } else {
      console.log("Player window functionality is not available in web mode.");
    }
  };

  const handleDisplayMapInPlayerWindow = (map) => {
    console.log('Maps.js: Sending map to player window:', map);
    if (ipcRenderer) {
      ipcRenderer.send('display-map-player-window', map);
    }
    setCurrentPreviewMap(map);
  
    const newSong = map.song_id && map.song_name && map.song_filePath
      ? { id: map.song_id, name: map.song_name, filePath: map.song_filePath }
      : null;
  
    if (newSong) {
      if (!currentSong || (currentSong.id !== newSong.id)) {
        playSong(newSong);
      }
    }
  };

  const updateCurrentMapTransform = useCallback(async (updates) => {
    if (!currentPreviewMap) return;
    const updatedMap = { ...currentPreviewMap, ...updates };
    setCurrentPreviewMap(updatedMap);
    setMaps(prevMaps => {
      const mapIndex = prevMaps.findIndex(m => m.id === updatedMap.id);
      if (mapIndex > -1) {
        const updatedMaps = [...prevMaps];
        updatedMaps[mapIndex] = updatedMap;
        return updatedMaps;
      }
      return prevMaps;
    });
    if (ipcRenderer) {
      ipcRenderer.send('display-map-player-window', updatedMap);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/maps/${updatedMap.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMap),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log('Map transform updated in backend.');
    } catch (error) {
      console.error('Error updating map transform in backend:', error);
    }
  }, [currentPreviewMap]);

  const handleZoomIn = () => updateCurrentMapTransform({ zoom: currentPreviewMap.zoom + 0.1 });
  const handleZoomOut = () => updateCurrentMapTransform({ zoom: Math.max(0.1, currentPreviewMap.zoom - 0.1) });
  const handleRotateLeft = () => updateCurrentMapTransform({ rotation: (currentPreviewMap.rotation - 90) % 360 });
  const handleRotateRight = () => updateCurrentMapTransform({ rotation: (currentPreviewMap.rotation + 90) % 360 });

  const currentPanPositionRef = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const handleMouseDown = (e) => {
    if (!currentPreviewMap) return;
    e.preventDefault();
    setIsPanning(true);
    setStartPanPoint({ x: e.clientX, y: e.clientY });
    initialPan.current = { x: currentPreviewMap.panX, y: currentPreviewMap.panY };
    currentPanPositionRef.current = { x: currentPreviewMap.panX, y: currentPreviewMap.panY };
    if (previewImageRef.current) {
      previewImageRef.current.classList.add('panning');
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isPanning || !currentPreviewMap) return;
    e.preventDefault();

    const deltaX = e.clientX - startPanPoint.x;
    const deltaY = e.clientY - startPanPoint.y;

    currentPanPositionRef.current = {
      x: initialPan.current.x + deltaX,
      y: initialPan.current.y + deltaY,
    };

    if (previewImageRef.current) {
      previewImageRef.current.style.transform = `translate(${currentPanPositionRef.current.x}px, ${currentPanPositionRef.current.y}px) scale(${currentPreviewMap.zoom}) rotate(${currentPreviewMap.rotation}deg)`;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      updateCurrentMapTransform({
        panX: currentPanPositionRef.current.x,
        panY: currentPanPositionRef.current.y
      });
      debounceTimeoutRef.current = null;
    }, 30);

  }, [isPanning, currentPreviewMap, startPanPoint, updateCurrentMapTransform]);

  const handleMouseUp = () => {
    setIsPanning(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    if (currentPreviewMap && (currentPanPositionRef.current.x !== currentPreviewMap.panX || currentPanPositionRef.current.y !== currentPreviewMap.panY)) {
      updateCurrentMapTransform({
        panX: currentPanPositionRef.current.x,
        panY: currentPanPositionRef.current.y
      });
    }
    if (previewImageRef.current) {
      previewImageRef.current.classList.remove('panning');
    }
  };

  const handleMouseLeave = () => {
    if (isPanning) {
      handleMouseUp();
    }
  };

  const filteredMaps = maps.filter(map => {
    const matchesSearchTerm = map.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (map.group_name && map.group_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGroup = selectedGroup === '' || (map.group_name && map.group_name === selectedGroup);
    const matchesCampaign = !currentCampaign || map.campaign_id === currentCampaign.id;
    return matchesSearchTerm && matchesGroup && matchesCampaign;
  });

  const previewImageSource = currentPreviewMap ? getMapImageSource(currentPreviewMap) : '';

  const getPlayerWindowFrameStyle = () => {
    if (!playerWindowDimensions || !previewContainerRef.current) {
        return { display: 'none' };
    }
    const container = previewContainerRef.current.getBoundingClientRect();

    const scaleX = container.width / playerWindowDimensions.width;
    const scaleY = container.height / playerWindowDimensions.height;
    const scale = Math.min(scaleX, scaleY);

    return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `${playerWindowDimensions.width}px`,
        height: `${playerWindowDimensions.height}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: 'center',
    };
  }

  const getPreviewImageStyle = () => {
      if (!currentPreviewMap) return {};
      return {
        transform: `translate(${currentPreviewMap.panX}px, ${currentPreviewMap.panY}px) scale(${currentPreviewMap.zoom}) rotate(${currentPreviewMap.rotation}deg)`
      }
  }

  const handleAddToJournal = async (mapName) => {
    if (!selectedDay || !currentCampaign) {
      setShowInfoModal(true);
      setInfoModalTitle('Advertencia');
      setInfoModalMessage('Por favor, selecciona un día en el diario y una campaña activa para añadir una entrada.');
      return;
    }

    const entryText = `Los aventureros se encuentran en ${mapName}.\n`;

    try {
      // 1. Try to fetch existing entry
      const fetchResponse = await fetch(`${API_BASE_URL}/diary/${currentCampaign.id}/${selectedDay.year}/${selectedDay.monthIndex}/${selectedDay.day}`);
      let existingEntry = null;
      if (fetchResponse.ok) {
        existingEntry = await fetchResponse.json();
      }

      if (existingEntry) {
        // 2. If entry exists, append and update
        const updatedContent = (existingEntry.content || '') + entryText;
        const updateResponse = await fetch(`${API_BASE_URL}/diary/${existingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existingEntry.id, content: updatedContent }),
        });
        if (!updateResponse.ok) {
          throw new Error('Failed to update diary entry');
        }
        setShowInfoModal(true);
        setInfoModalTitle('Éxito');
        setInfoModalMessage('Entrada del diario actualizada con éxito!');
      } else {
        // 3. If no entry, create a new one
        const newEntryId = generateUniqueId(); // Assuming generateUniqueId is suitable for diary entries too
        const newEntry = {
          id: newEntryId,
          campaign_id: currentCampaign.id,
          year: String(selectedDay.year), // Explicitly convert to string
          month_index: selectedDay.monthIndex,
          day: selectedDay.day,
          content: entryText,
        };
        const addResponse = await fetch(`${API_BASE_URL}/diary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry),
        });
        if (!addResponse.ok) {
          throw new Error('Failed to add new diary entry');
        }
        setShowInfoModal(true);
        setInfoModalTitle('Éxito');
        setInfoModalMessage('Nueva entrada del diario creada con éxito!');
      }
    } catch (error) {
      console.error('Error adding/updating diary entry:', error);
      setShowInfoModal(true);
      setInfoModalTitle('Error');
      setInfoModalMessage(`Error al añadir/actualizar la entrada del diario: ${error.message}`);
    }
  };

  return (
    <div className="maps-container">
      <div className="maps-buttons-container">
        <button onClick={handleOpenAddModal} className="add-map-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
          <span>+</span>
        </button>
        <button onClick={handleOpenPlayerWindow} className="open-player-window-btn">Abrir Ventana de Jugadores</button>
        <button onClick={handleNavigateToCombat} className="navigate-to-combat-btn">Ir a Combate</button>
      </div>

      <div className={`player-view-preview ${isPreviewExpanded ? 'expanded' : ''}`}>
        <div className="preview-header">
          <h3>Previsualización de Ventana de Jugadores</h3>
          <button onClick={togglePreview} className="preview-toggle-button">
            {isPreviewExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minimize-2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-maximize-2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            )}
          </button>
        </div>
        {currentPreviewMap ? (
          <div 
            className="preview-content-wrapper"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div className="preview-image-container" ref={previewContainerRef}>
                {playerWindowDimensions && (
                    <div
                        className="player-window-frame"
                        style={getPlayerWindowFrameStyle()}
                    >
                        <div className="map-transform-wrapper">
                            {previewImageSource && (
                                <img
                                    ref={previewImageRef}
                                    src={previewImageSource}
                                    alt={currentPreviewMap.name}
                                    className="preview-map-image"
                                    style={getPreviewImageStyle()}
                                    onMouseDown={handleMouseDown}
                                    draggable="false"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="player-view-controls-container">
              <button onClick={togglePlayerSettingsMenu} className="settings-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-settings">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 6.2 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
              {openPlayerSettingsMenu && (
                <div className="player-view-settings-dropdown">
                  <div className="zoom-controls">
                    <button onClick={handleZoomIn}>&#x2B;</button>
                    <button onClick={handleZoomOut}>&#x2212;</button>
                  </div>
                  <div className="rotate-controls">
                    <button onClick={handleRotateLeft}>&#x21BA;</button>
                    <button onClick={handleRotateRight}>&#x21BB;</button>
                  </div>
                </div>
              )}
              {currentPreviewMap && selectedDay && currentCampaign && (
                <button 
                  onClick={() => handleAddToJournal(currentPreviewMap.name)} 
                  className="add-to-journal-btn"
                >
                  Añadir a Diario
                </button>
              )}
            </div>
            {playerWindowDimensions && (
              <div className="player-window-dimensions">
                {playerWindowDimensions.width} x {playerWindowDimensions.height}
              </div>
            )}
          </div>
        ) : (
          <p>Ningún mapa seleccionado para la ventana de jugadores.</p>
        )}
      </div>

      <div className="search-filter-container">
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Buscar mapas por nombre o grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="map-search-input"
          />
        </div>
        <div className="group-filter-container">
          <label htmlFor="group-select">Filtrar por Grupo:</label>
          <select
            id="group-select"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="group-select"
          >
            <option value="">Todos los grupos</option>
            {uniqueGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="map-list">
        {filteredMaps.length === 0 ? (
          <p>No hay mapas que coincidan con tu búsqueda.</p>
        ) : (
          <ul>
            {filteredMaps.map((map) => (
              <MapCard 
                key={map.id} 
                map={map} 
                onOpenSheet={handleOpenMapSheetModal}
                onDisplay={handleDisplayMapInPlayerWindow}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteRequest}
                openSettingsMenu={openSettingsMenu}
                onToggleSettingsMenu={toggleSettingsMenu}
              />
            ))}
          </ul>
        )}
      </div>

      {isAddModalOpen && (
        <AddMapModal onClose={handleCloseAddModal} onAddMap={handleAddMap} onAddMaps={handleAddMaps} />
      )}

      {isEditModalOpen && (
        <EditMapModal onClose={handleCloseEditModal} onEditMap={handleEditMap} map={editingMap} />
      )}

      {isConfirmModalOpen && (
        <ConfirmModal
          message={`¿Estás seguro de que quieres eliminar el mapa "${mapToDelete?.name}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {isMapSheetModalOpen && (
        <MapSheetModal onClose={handleCloseMapSheetModal} map={selectedMapForSheet} onUpdateMap={handleUpdateMap} />
      )}

      {showInfoModal && (
        <InfoModal
          message={infoModalMessage}
          onClose={() => setShowInfoModal(false)}
          title={infoModalTitle}
        />
      )}
    </div>
  );
}

export default Maps;
