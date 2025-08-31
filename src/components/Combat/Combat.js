import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { useDate } from '../../contexts/DateContext'; // Import useDate
import MonsterSheetDisplay from './MonsterSheetDisplay'; // Import new component
import CharacterSheetDisplay from './CharacterSheetDisplay'; // Import new component
import InfoModal from '../../components/shared/InfoModal/InfoModal'; // Import InfoModal
import './Combat.css';
import { calculateEncounterDifficulty } from '../../utils/difficultyCalculator';
import DifficultyProgressBar from '../Encounters/DifficultyProgressBar/DifficultyProgressBar';
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

function Combat() {
  const [currentPreviewMap, setCurrentPreviewMap] = useState(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [playerWindowDimensions, setPlayerWindowDimensions] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
  const initialPan = useRef({ x: 0, y: 0 });
  const [openPlayerSettingsMenu, setOpenPlayerSettingsMenu] = useState(false);
  const [maps, setMaps] = useState([]); // To store fetched maps
  const [selectedMapId, setSelectedMapId] = useState(''); // To store the ID of the selected map
  const [encounters, setEncounters] = useState([]); // To store fetched encounters
  const [selectedEncounterId, setSelectedEncounterId] = useState(sessionStorage.getItem('selectedEncounterId') || ''); // To store the ID of the selected encounter
  const [selectedEncounterDetails, setSelectedEncounterDetails] = useState(null); // New state for selected encounter details
  const [initiatives, setInitiatives] = useState({}); // New state for initiatives
  const [monsterHP, setMonsterHP] = useState({}); // New state for monster HP
  const [combatantHP, setCombatantHP] = useState({}); // New state for combatant HP
  const [combatantMaxHP, setCombatantMaxHP] = useState({}); // New state for combatant Max HP
  const [combatantTempHP, setCombatantTempHP] = useState({}); // New state for combatant Temp HP
  const [currentTurn, setCurrentTurn] = useState(0);
  const [visibleTurn, setVisibleTurn] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [manuallySelectedCombatant, setManuallySelectedCombatant] = useState(null);
  const [showGrid, setShowGrid] = useState(false); // New state for grid visibility
  const [isGridSettingsOpen, setIsGridSettingsOpen] = useState(false); // New state for grid settings dropdown
  const [gridSize, setGridSize] = useState(50); // New state for grid cell size, default 50px
  const [gridOffsetX, setGridOffsetX] = useState(0); // New state for grid X offset
  const [gridOffsetY, setGridOffsetY] = useState(0); // New state for grid Y offset
  const [bestiary, setBestiary] = useState([]);
  const [characters, setCharacters] = useState([]); // New state for characters
  const [songPriority, setSongPriority] = useState('encounter'); // Default to encounter

  const previewContainerRef = useRef(null);
  const previewImageRef = useRef(null);
  const currentPanPositionRef = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const isUpdatingInitiativesRef = useRef(false);

  const navigate = useNavigate(); // Initialize useNavigate
  const { playSong, currentSong } = useAudioPlayer();
  const { currentCampaign } = useCampaign();
  const { selectedDay } = useDate(); // Get selectedDay from DateContext

  // New state for encounter details expansion
  const [isEncounterDetailsExpanded, setIsEncounterDetailsExpanded] = useState(true);
  const [encounterDifficultyData, setEncounterDifficultyData] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false); // New state for InfoModal
  const [infoModalMessage, setInfoModalMessage] = useState(''); // New state for InfoModal message
  const [infoModalTitle, setInfoModalTitle] = useState(''); // New state for InfoModal title

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleNavigateToMaps = () => {
    navigate('/maps');
  };

  const handleNavigateToEncounters = () => {
    navigate('/encounters');
  };

  useEffect(() => {
    if (ipcRenderer) {
      const handleDimensions = (event, dimensions) => {
        setPlayerWindowDimensions(dimensions);
      };
      ipcRenderer.on('player-window-dimensions', handleDimensions);

      ipcRenderer.invoke('get-song-priority').then(result => {
        if (result.success && result.priority) {
          setSongPriority(result.priority);
        } else if (!result.success) {
          console.error('Error getting song priority:', result.error);
        }
      });

      return () => {
        ipcRenderer.removeListener('player-window-dimensions', handleDimensions);
      };
    } else {
      // Web app logic
      const savedPriority = localStorage.getItem('songPriority');
      if (savedPriority) {
        setSongPriority(savedPriority);
      }
    }
  }, []);

  const getMapImageSource = useCallback((map) => {
    if (map.image_data) {
      return map.image_data;
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
    return '';
  }, []);

  const fetchMaps = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/maps`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const loadedMaps = await response.json();
      const filteredMaps = currentCampaign 
        ? loadedMaps.filter(map => map.campaign_id === currentCampaign.id)
        : loadedMaps;

      setMaps(filteredMaps.map(map => ({
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
  }, [currentCampaign]);

  const fetchEncounters = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/encounters`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const loadedEncounters = await response.json();
      const filteredEncounters = currentCampaign
        ? loadedEncounters.filter(enc => enc.campaign_id === currentCampaign.id)
        : loadedEncounters;

      setEncounters(filteredEncounters.map(enc => ({
        ...enc,
        id: enc.id,
      })));
    } catch (error) {
      console.error('Error fetching encounters:', error);
    }
  }, [currentCampaign]);

  const fetchBestiary = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/monsters`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setBestiary(data);
    } catch (error) {
      console.error('Error fetching bestiary:', error);
    }
  }, []);

  const fetchCharacters = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/characters`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setCharacters(data);
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  }, []);

  useEffect(() => {
    fetchMaps();
    fetchEncounters();
    fetchBestiary();
    fetchCharacters(); // Call new fetch function

    if (ipcRenderer) {
      const persistedMap = ipcRenderer.sendSync('get-current-preview-map');
      if (persistedMap) {
        setCurrentPreviewMap(persistedMap);
        setSelectedMapId(persistedMap.id); // Set selected map if persisted
        setShowGrid(persistedMap.showGrid || false); // Set showGrid from persisted map
        setGridSize(persistedMap.gridSize || 50); // Set gridSize from persisted map
        setGridOffsetX(persistedMap.gridOffsetX || 0); // Set gridOffsetX from persisted map
        setGridOffsetY(persistedMap.gridOffsetY || 0); // Set gridOffsetY from persisted map
      }

      const handleUpdatePreview = (event, mapData) => {
        setCurrentPreviewMap(mapData);
        setSelectedMapId(mapData.id); // Update selected map if preview changes
        setShowGrid(mapData.showGrid || false); // Update showGrid from preview
        setGridSize(mapData.gridSize || 50); // Update gridSize from preview
        setGridOffsetX(mapData.gridOffsetX || 0); // Update gridOffsetX from preview
        setGridOffsetY(mapData.gridOffsetY || 0); // Update gridOffsetY from preview
      };
      ipcRenderer.on('update-master-preview', handleUpdatePreview);
      return () => {
        ipcRenderer.removeListener('update-master-preview', handleUpdatePreview);
      };
    }
  }, [fetchMaps, fetchEncounters, fetchBestiary, fetchCharacters]); // Add fetchCharacters to dependencies

  useEffect(() => {
    if (ipcRenderer && currentPreviewMap) {
      ipcRenderer.send('set-current-preview-map', { ...currentPreviewMap, showGrid, gridSize, gridOffsetX, gridOffsetY });
    }
  }, [currentPreviewMap, showGrid, gridSize, gridOffsetX, gridOffsetY]);

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
      ipcRenderer.send('display-map-player-window', { ...updatedMap, showGrid, gridSize, gridOffsetX, gridOffsetY });
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
    } catch (error) {
      console.error('Error updating map transform in backend:', error);
    }
  }, [currentPreviewMap, showGrid, gridSize, gridOffsetX, gridOffsetY]);

  const handleZoomIn = () => updateCurrentMapTransform({ zoom: currentPreviewMap.zoom + 0.1 });
  const handleZoomOut = () => updateCurrentMapTransform({ zoom: Math.max(0.1, currentPreviewMap.zoom - 0.1) });
  const handleRotateLeft = () => updateCurrentMapTransform({ rotation: (currentPreviewMap.rotation - 90) % 360 });
  const handleRotateRight = () => updateCurrentMapTransform({ rotation: (currentPreviewMap.rotation + 90) % 360 });

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

  const togglePreview = () => {
    setIsPreviewExpanded(!isPreviewExpanded);
  };

  const togglePlayerSettingsMenu = () => {
    setOpenPlayerSettingsMenu(prev => !prev);
  };

  const toggleGridSettings = () => {
    setIsGridSettingsOpen(prev => !prev);
  };

  const toggleGrid = () => {
    setShowGrid(prevShowGrid => {
      const newShowGrid = !prevShowGrid;
      if (currentPreviewMap) {
        if (ipcRenderer) {
          ipcRenderer.send('display-map-player-window', { ...currentPreviewMap, showGrid: newShowGrid, gridSize, gridOffsetX, gridOffsetY });
        }
      }
      return newShowGrid;
    });
  };

  const handleGridSizeUp = () => {
    setGridSize(prev => prev + 10);
    if (currentPreviewMap) {
      if (ipcRenderer) {
        ipcRenderer.send('display-map-player-window', { ...currentPreviewMap, showGrid, gridSize: gridSize + 10, gridOffsetX, gridOffsetY });
      }
    }
  };

  const handleGridSizeDown = () => {
    setGridSize(prev => Math.max(10, prev - 10)); // Minimum grid size of 10px
    if (currentPreviewMap) {
      if (ipcRenderer) {
        ipcRenderer.send('display-map-player-window', { ...currentPreviewMap, showGrid, gridSize: Math.max(10, gridSize - 10), gridOffsetX, gridOffsetY });
      }
    }
  };

  const handleGridPan = (direction) => {
    let newOffsetX = gridOffsetX;
    let newOffsetY = gridOffsetY;
    const panStep = 5; // Adjust this value for desired pan sensitivity

    switch (direction) {
      case 'up':
        newOffsetY -= panStep;
        break;
      case 'down':
        newOffsetY += panStep;
        break;
      case 'left':
        newOffsetX -= panStep;
        break;
      case 'right':
        newOffsetX += panStep;
        break;
      default:
        break;
    }
    setGridOffsetX(newOffsetX);
    setGridOffsetY(newOffsetY);

    if (currentPreviewMap) {
      if (ipcRenderer) {
        ipcRenderer.send('display-map-player-window', { ...currentPreviewMap, showGrid, gridSize, gridOffsetX: newOffsetX, gridOffsetY: newOffsetY });
      }
    }
  };

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

  const getGridOverlayStyle = () => {
    const baseStyle = {
      backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
    };

    return {
      ...baseStyle,
      backgroundImage: `
        linear-gradient(to right, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 1px, transparent 1px)
      `,
      backgroundSize: `${gridSize}px ${gridSize}px`,
    };
  };

  const handleMapSelect = (event) => {
    const mapId = event.target.value;
    setSelectedMapId(mapId);
    const selectedMap = maps.find(map => map.id === mapId);
    if (selectedMap) {
      setCurrentPreviewMap(selectedMap);
      if (ipcRenderer) {
        ipcRenderer.send('display-map-player-window', { ...selectedMap, showGrid, gridSize, gridOffsetX, gridOffsetY });
      }
      const newSong = selectedMap.song_id && selectedMap.song_name && selectedMap.song_filePath
        ? { id: selectedMap.song_id, name: selectedMap.song_name, filePath: selectedMap.song_filePath }
        : null;
    
      if (newSong) {
        if (!currentSong || (currentSong.id !== newSong.id)) {
          playSong(newSong);
        }
      }
    } else {
      setCurrentPreviewMap(null);
      if (ipcRenderer) {
        ipcRenderer.send('display-map-player-window', null);
      }
    }
  };

  const handleEncounterSelect = (event) => {
    const encounterId = event.target.value;
    setSelectedEncounterId(encounterId);
    sessionStorage.setItem('selectedEncounterId', encounterId);
  };

  const handleInitiativeChange = (id, value) => {
    setInitiatives(prevInitiatives => {
      const updatedInitiatives = {
        ...prevInitiatives,
        [id]: value,
      };
      sessionStorage.setItem(`initiatives_${selectedEncounterId}`, JSON.stringify(updatedInitiatives));
      return updatedInitiatives;
    });
  };

  const handleHPChange = async (id, value) => {
    setCombatantHP(prevHP => {
      const updatedHP = {
        ...prevHP,
        [id]: value,
      };
      sessionStorage.setItem(`combatantHP_${selectedEncounterId}`, JSON.stringify(updatedHP));
      return updatedHP;
    });

    const characterToUpdate = characters.find(char => char.id === id);
    if (characterToUpdate) {
      try {
        const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...characterToUpdate, currentHitPoints: parseInt(value) || 0 }),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        // Update the main characters state to trigger re-render of CharacterSheetDisplay
        setCharacters(prevChars => prevChars.map(char => char.id === id ? { ...char, currentHitPoints: parseInt(value) || 0 } : char));
      } catch (error) {
        console.error('Error updating character current HP in backend:', error);
      }
    }
  };

  const handleMaxHPChange = async (id, value) => {
    setCombatantMaxHP(prevMaxHP => {
      const updatedMaxHP = {
        ...prevMaxHP,
        [id]: value,
      };
      sessionStorage.setItem(`combatantMaxHP_${selectedEncounterId}`, JSON.stringify(updatedMaxHP));
      return updatedMaxHP;
    });

    const characterToUpdate = characters.find(char => char.id === id);
    if (characterToUpdate) {
      try {
        const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...characterToUpdate, maxHitPoints: parseInt(value) || 0 }),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        // Update the main characters state to trigger re-render of CharacterSheetDisplay
        setCharacters(prevChars => prevChars.map(char => char.id === id ? { ...char, maxHitPoints: parseInt(value) || 0 } : char));
      } catch (error) {
        console.error('Error updating character max HP in backend:', error);
      }
    }
  };

  const handleTempHPChange = async (id, value) => {
    setCombatantTempHP(prevTempHP => {
      const updatedTempHP = {
        ...prevTempHP,
        [id]: value,
      };
      sessionStorage.setItem(`combatantTempHP_${selectedEncounterId}`, JSON.stringify(updatedTempHP));
      return updatedTempHP;
    });

    const characterToUpdate = characters.find(char => char.id === id);
    if (characterToUpdate) {
      try {
        const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...characterToUpdate, temporaryHitPoints: parseInt(value) || 0 }),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        // Update the main characters state to trigger re-render of CharacterSheetDisplay
        setCharacters(prevChars => prevChars.map(char => char.id === id ? { ...char, temporaryHitPoints: parseInt(value) || 0 } : char));
      } catch (error) {
        console.error('Error updating character temporary HP in backend:', error);
      }
    }
  };

  const handleRollMonsterInitiatives = () => {
    setInitiatives(prevInitiatives => {
      const updatedInitiatives = { ...prevInitiatives };
      if (selectedEncounterDetails && selectedEncounterDetails.monsters) {
        selectedEncounterDetails.monsters.forEach(monster => {
          const roll = Math.floor(Math.random() * 20) + 1; // Roll a d20
          let dexModifier = 0;
          if (monster.dex) {
            const match = monster.dex.match(/\(([-+]?\d+)\)/); // Corrected regex for escaped backslashes
            if (match && match[1]) {
              dexModifier = parseInt(match[1], 10);
            }
          }
          const totalInitiative = (roll === 1) ? 1 : (roll + dexModifier); // If raw roll is 1, total initiative is 1, otherwise add dex modifier
          updatedInitiatives[monster.instanceId] = totalInitiative;
        });
      }
      sessionStorage.setItem(`initiatives_${selectedEncounterId}`, JSON.stringify(updatedInitiatives));
      return updatedInitiatives;
    });
  };

  const getMonstersWithSuffix = useCallback(() => {
    if (!selectedEncounterDetails || !selectedEncounterDetails.monsters) {
      return [];
    }

    const monsterCounts = {};
    const suffixedMonsters = [];

    selectedEncounterDetails.monsters.forEach(monster => {
      const baseName = monster.name;
      monsterCounts[baseName] = (monsterCounts[baseName] || 0) + 1;

      let displayName = baseName;
      if (monsterCounts[baseName] > 1) {
        const suffix = String.fromCharCode(64 + monsterCounts[baseName]); // 65 is 'A'
        displayName = `${baseName} ${suffix}`;
      }
      suffixedMonsters.push({ ...monster, instanceId: monster.instanceId, displayName }); // Pass instanceId and displayName
    });
    return suffixedMonsters;
  }, [selectedEncounterDetails]);

  const calculateMonsterHP = (hpString) => {
    if (!hpString || !hpString.includes('(')) {
      return hpString ? parseInt(hpString.split(' ')[0], 10) : 0;
    }

    const formula = hpString.substring(hpString.indexOf('(') + 1, hpString.indexOf(')'));
    const parts = formula.split(/d|\+/); // Corrected regex for escaped plus sign
    
    const numDice = parseInt(parts[0], 10);
    const diceType = parseInt(parts[1], 10);
    const bonus = parts.length > 2 ? parseInt(parts[2], 10) : 0;

    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * diceType) + 1;
    }
    total += bonus;

    return total;
  };

  const handleCalculateMonsterHP = () => {
    if (selectedEncounterDetails && selectedEncounterDetails.monsters) {
      const newMonsterHP = {};
      const newCombatantHP = { ...combatantHP };
      const newCombatantMaxHP = { ...combatantMaxHP };
      getMonstersWithSuffix().forEach(monster => {
        const bestiaryMonster = bestiary.find(b => b.id === monster.id);
        if (bestiaryMonster) {
          const hp = calculateMonsterHP(bestiaryMonster.hp);
          newMonsterHP[monster.instanceId] = hp;
          newCombatantHP[monster.instanceId] = hp;
          newCombatantMaxHP[monster.instanceId] = hp;
        }
      });
      setMonsterHP(newMonsterHP);
      setCombatantHP(newCombatantHP);
      setCombatantMaxHP(newCombatantMaxHP);
      sessionStorage.setItem(`monsterHP_${selectedEncounterId}`, JSON.stringify(newMonsterHP));
      sessionStorage.setItem(`combatantHP_${selectedEncounterId}`, JSON.stringify(newCombatantHP));
      sessionStorage.setItem(`combatantMaxHP_${selectedEncounterId}`, JSON.stringify(newCombatantMaxHP));
    }
  };

  const getSortedCombatants = useCallback(() => {
    if (!selectedEncounterDetails) return [];
  
    const combatants = [];
  
    if (selectedEncounterDetails.characters) {
      selectedEncounterDetails.characters.forEach(char => {
        const initiative = parseInt(initiatives[char.id]) || 0;
        if (initiative > 0) {
          const maxHp = combatantMaxHP[char.id] !== undefined ? combatantMaxHP[char.id] : char.maxHitPoints;
          const currentHp = combatantHP[char.id] !== undefined ? combatantHP[char.id] : char.currentHitPoints;
          const hpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 100;
          combatants.push({
            id: char.id,
            name: char.name,
            type: 'character',
            initiative: initiative,
            maxHp: maxHp,
            currentHp: currentHp,
            tempHp: combatantTempHP[char.id] !== undefined ? combatantTempHP[char.id] : char.temporaryHitPoints,
            hpPercentage: hpPercentage,
            ac: char.armorClass,
          });
        }
      });
    }
  
    if (selectedEncounterDetails.monsters) {
      const suffixedMonsters = getMonstersWithSuffix();
      suffixedMonsters.forEach(monster => {
        const initiative = parseInt(initiatives[monster.instanceId]) || 0;
        if (initiative > 0) {
          const bestiaryMonster = bestiary.find(b => b.id === monster.id);
          const maxHp = combatantMaxHP[monster.instanceId] !== undefined ? combatantMaxHP[monster.instanceId] : (monsterHP[monster.instanceId] || 'N/A');
          const currentHp = combatantHP[monster.instanceId] !== undefined ? combatantHP[monster.instanceId] : maxHp;
          const hpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 100;
          combatants.push({
            id: monster.instanceId,
            name: monster.displayName,
            type: 'monster',
            initiative: initiative,
            hpString: bestiaryMonster ? bestiaryMonster.hp : 'N/A',
            maxHp: maxHp,
            currentHp: currentHp,
            tempHp: combatantTempHP[monster.instanceId] !== undefined ? combatantTempHP[monster.instanceId] : 'N/A',
            hpPercentage: hpPercentage,
            ac: bestiaryMonster ? bestiaryMonster.armor : 'N/A',
          });
        }
      });
    }
  
    combatants.sort((a, b) => b.initiative - a.initiative);
  
    return combatants;
  }, [selectedEncounterDetails, initiatives, getMonstersWithSuffix, bestiary, monsterHP, combatantHP, combatantMaxHP, combatantTempHP]);

  const handleNextTurn = () => {
    const sortedCombatants = getSortedCombatants();
    if (sortedCombatants.length === 0) return;

    let nextTurn = currentTurn + 1;
    let nextRound = currentRound;
    let nextVisibleTurn = visibleTurn;

    if (nextTurn >= sortedCombatants.length) {
      nextTurn = 0;
      nextRound++;
      nextVisibleTurn = 1;
    } else {
      nextVisibleTurn++;
    }

    while (sortedCombatants[nextTurn].currentHp <= 0) {
      nextTurn++;
      if (nextTurn >= sortedCombatants.length) {
        nextTurn = 0;
        nextRound++;
        nextVisibleTurn = 1;
      }
    }

    setCurrentTurn(nextTurn);
    setCurrentRound(nextRound);
    setVisibleTurn(nextVisibleTurn);
    setManuallySelectedCombatant(null); // Clear manual selection
    sessionStorage.setItem(`currentTurn_${selectedEncounterId}`, nextTurn);
    sessionStorage.setItem(`currentRound_${selectedEncounterId}`, nextRound);
    sessionStorage.setItem(`visibleTurn_${selectedEncounterId}`, nextVisibleTurn);
  };

  const handlePreviousTurn = () => {
    const sortedCombatants = getSortedCombatants();
    if (sortedCombatants.length === 0) return;

    let prevTurn = currentTurn - 1;
    let prevRound = currentRound;
    let prevVisibleTurn = visibleTurn;

    if (prevTurn < 0) {
      prevTurn = sortedCombatants.length - 1;
      if (prevRound > 1) {
        prevRound--;
        prevVisibleTurn = sortedCombatants.filter(c => c.currentHp > 0).length;
      }
    }

    while (sortedCombatants[prevTurn].currentHp <= 0) {
      prevTurn--;
      if (prevTurn < 0) {
        prevTurn = sortedCombatants.length - 1;
        if (prevRound > 1) {
          prevRound--;
          prevVisibleTurn = sortedCombatants.filter(c => c.currentHp > 0).length;
        }
        // No need to break here, the loop condition will handle it
      }
    }

    setCurrentTurn(prevTurn);
    setCurrentRound(prevRound);
    setVisibleTurn(prevVisibleTurn);
    setManuallySelectedCombatant(null); // Clear manual selection
    sessionStorage.setItem(`currentTurn_${selectedEncounterId}`, prevTurn);
    sessionStorage.setItem(`currentRound_${selectedEncounterId}`, prevRound);
    sessionStorage.setItem(`visibleTurn_${selectedEncounterId}`, prevVisibleTurn);
  };

  const handleManualSelect = (combatantId) => {
    const combatantIndex = getSortedCombatants().findIndex(c => c.id === combatantId);
    if (combatantIndex === currentTurn) {
      setManuallySelectedCombatant(null);
    } else {
      setManuallySelectedCombatant(combatantId);
    }
  };

  useEffect(() => {
    const fetchEncounterDetails = async () => {
      if (selectedEncounterId) {
        try {
          const response = await fetch(`${API_BASE_URL}/encounters/${selectedEncounterId}`);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const details = await response.json();

          const storedInitiatives = JSON.parse(sessionStorage.getItem(`initiatives_${selectedEncounterId}`)) || {};
          const newInitiatives = {};

          if (details.characters) {
            details.characters.forEach(char => {
              newInitiatives[char.id] = storedInitiatives[char.id] !== undefined ? storedInitiatives[char.id] : '';
            });
          }
          if (details.monsters) {
            const processedMonsters = [];
            const monsterIdCounts = {};

            details.monsters.forEach(monster => {
              monsterIdCounts[monster.id] = (monsterIdCounts[monster.id] || 0) + 1;
              const instanceId = `${monster.id}-${monsterIdCounts[monster.id]}`;
              processedMonsters.push({ ...monster, instanceId });
              newInitiatives[instanceId] = storedInitiatives[instanceId] !== undefined ? storedInitiatives[instanceId] : '';
            });
            details.monsters = processedMonsters;
          }

          // Set the flag before updating initiatives
          isUpdatingInitiativesRef.current = true;
          // Only update if initiatives actually changed
          if (JSON.stringify(newInitiatives) !== JSON.stringify(initiatives)) {
            setInitiatives(newInitiatives);
          }

          // Only update if selectedEncounterDetails actually changed
          if (JSON.stringify(details) !== JSON.stringify(selectedEncounterDetails)) {
            setSelectedEncounterDetails(details);
          }

          const charactersForDifficulty = details.characters ? details.characters.filter(char => newInitiatives[char.id] !== '' && newInitiatives[char.id] !== undefined) : [];
          const monstersForDifficulty = details.monsters ? details.monsters.filter(monster => newInitiatives[monster.instanceId] !== '' && newInitiatives[monster.instanceId] !== undefined) : [];

          if (charactersForDifficulty.length > 0 && monstersForDifficulty.length > 0) {
            const difficulty = calculateEncounterDifficulty(charactersForDifficulty, monstersForDifficulty);
            // Only update if encounterDifficultyData actually changed
            if (JSON.stringify(difficulty) !== JSON.stringify(encounterDifficultyData)) {
              setEncounterDifficultyData(difficulty);
            }
          } else {
            // Only update if encounterDifficultyData is not null
            if (encounterDifficultyData !== null) {
              setEncounterDifficultyData(null);
            }
          }

          const storedCombatantHP = JSON.parse(sessionStorage.getItem(`combatantHP_${selectedEncounterId}`)) || {};
          const storedCombatantMaxHP = JSON.parse(sessionStorage.getItem(`combatantMaxHP_${selectedEncounterId}`)) || {};
          const storedCombatantTempHP = JSON.parse(sessionStorage.getItem(`combatantTempHP_${selectedEncounterId}`)) || {};
          const storedMonsterHP = JSON.parse(sessionStorage.getItem(`monsterHP_${selectedEncounterId}`)) || {};
          const storedCurrentTurn = parseInt(sessionStorage.getItem(`currentTurn_${selectedEncounterId}`), 10) || 0;
          const storedVisibleTurn = parseInt(sessionStorage.getItem(`visibleTurn_${selectedEncounterId}`), 10) || 1;
          const storedCurrentRound = parseInt(sessionStorage.getItem(`currentRound_${selectedEncounterId}`), 10) || 1;

          const newCombatantHP = {};
          const newCombatantMaxHP = {};
          const newCombatantTempHP = {};

          if (details.characters) {
            details.characters.forEach(char => {
              newCombatantHP[char.id] = storedCombatantHP[char.id] !== undefined ? storedCombatantHP[char.id] : char.currentHitPoints;
              newCombatantMaxHP[char.id] = storedCombatantMaxHP[char.id] !== undefined ? storedCombatantMaxHP[char.id] : char.maxHitPoints;
              newCombatantTempHP[char.id] = storedCombatantTempHP[char.id] !== undefined ? storedCombatantTempHP[char.id] : char.temporaryHitPoints;
            });
          }
          if (details.monsters) {
            details.monsters.forEach(monster => {
              newCombatantHP[monster.instanceId] = storedCombatantHP[monster.instanceId] !== undefined ? storedCombatantHP[monster.instanceId] : null;
              newCombatantMaxHP[monster.instanceId] = storedCombatantMaxHP[monster.instanceId] !== undefined ? storedCombatantMaxHP[monster.instanceId] : null;
              newCombatantTempHP[monster.instanceId] = storedCombatantTempHP[monster.instanceId] !== undefined ? storedCombatantTempHP[monster.instanceId] : null;
            });
          }
          // Only update if state actually changed
          if (JSON.stringify(storedMonsterHP) !== JSON.stringify(monsterHP)) {
            setMonsterHP(storedMonsterHP);
          }
          if (JSON.stringify(newCombatantHP) !== JSON.stringify(combatantHP)) {
            setCombatantHP(newCombatantHP);
          }
          if (JSON.stringify(newCombatantMaxHP) !== JSON.stringify(combatantMaxHP)) {
            setCombatantMaxHP(newCombatantMaxHP);
          }
          if (JSON.stringify(newCombatantTempHP) !== JSON.stringify(combatantTempHP)) {
            setCombatantTempHP(newCombatantTempHP);
          }
          if (storedCurrentTurn !== currentTurn) {
            setCurrentTurn(storedCurrentTurn);
          }
          if (storedVisibleTurn !== visibleTurn) {
            setVisibleTurn(storedVisibleTurn);
          }
          if (storedCurrentRound !== currentRound) {
            setCurrentRound(storedCurrentRound);
          }

        } catch (error) {
          console.error('Error fetching encounter details:', error);
          // Only clear if state is not already null/empty
          if (selectedEncounterDetails !== null) setSelectedEncounterDetails(null);
          if (Object.keys(initiatives).length > 0) setInitiatives({});
          if (Object.keys(monsterHP).length > 0) setMonsterHP({});
          if (Object.keys(combatantHP).length > 0) setCombatantHP({});
          if (Object.keys(combatantMaxHP).length > 0) setCombatantMaxHP({});
          if (Object.keys(combatantTempHP).length > 0) setCombatantTempHP({});
          if (encounterDifficultyData !== null) setEncounterDifficultyData(null);
        }
      }
    };

    if (selectedEncounterId && !isUpdatingInitiativesRef.current) {
      fetchEncounterDetails();
    } else if (!selectedEncounterId) {
      // Clear states only if they are not already null/empty
      if (selectedEncounterDetails !== null) setSelectedEncounterDetails(null);
      if (Object.keys(initiatives).length > 0) setInitiatives({});
      if (Object.keys(monsterHP).length > 0) setMonsterHP({});
      if (Object.keys(combatantHP).length > 0) setCombatantHP({});
      if (Object.keys(combatantMaxHP).length > 0) setCombatantMaxHP({});
      if (Object.keys(combatantTempHP).length > 0) setCombatantTempHP({});
      if (encounterDifficultyData !== null) setEncounterDifficultyData(null);
    }

    return () => {
      isUpdatingInitiativesRef.current = false;
    };
  }, [selectedEncounterId, initiatives, selectedEncounterDetails, monsterHP, combatantHP, combatantMaxHP, combatantTempHP, currentTurn, visibleTurn, currentRound, encounterDifficultyData]);

  const previewImageSource = currentPreviewMap ? getMapImageSource(currentPreviewMap) : '';

  const toggleEncounterDetails = () => {
    setIsEncounterDetailsExpanded(prev => !prev);
  };

  const sortedCombatants = getSortedCombatants();
  const currentCombatant = sortedCombatants[currentTurn];
  const manualCombatant = sortedCombatants.find(c => c.id === manuallySelectedCombatant);

  // Find the full monster/character objects for display
  const currentCombatantFullData = currentCombatant 
    ? (currentCombatant.type === 'monster' 
        ? bestiary.find(m => m.id === currentCombatant.id.split('-')[0]) // Split instanceId to get original monster ID
        : characters.find(c => c.id === currentCombatant.id))
    : null;

  const manualCombatantFullData = manualCombatant
    ? (manualCombatant.type === 'monster'
        ? bestiary.find(m => m.id === manualCombatant.id.split('-')[0])
        : characters.find(c => c.id === manualCombatant.id))
    : null;

    const handleSongPriorityChange = async (event) => {
        const newPriority = event.target.value;
        setSongPriority(newPriority);
        if (ipcRenderer) {
          const result = await ipcRenderer.invoke('set-song-priority', newPriority);
          if (!result.success) {
            console.error('Error saving song priority:', result.error);
          }
        } else {
          // Web app logic
          localStorage.setItem('songPriority', newPriority);
        }
      };

  const handleBattleTheme = () => {
    console.log('--- Starting Combat Song Selection ---');
    const selectedMap = maps.find(m => m.id === selectedMapId);
    const selectedEncounter = encounters.find(e => e.id === selectedEncounterId);

    console.log('Selected Map:', selectedMap);
    console.log('Selected Encounter:', selectedEncounter);
    console.log('Song Priority:', songPriority);

    let songToPlay = null;

    // Helper to get song from source based on difficulty
    const getSongFromSource = (source, difficulty) => {
      if (!source || !difficulty) return null;

      console.log('DEBUG: difficulty received:', `"${difficulty}"`, 'length:', difficulty.length); // NEW DEBUG

      let song = null;
      // Map Spanish difficulty names to the corresponding property prefixes
      let prefix = '';
      switch (difficulty) {
        case 'Fácil': prefix = 'easy'; break;
        case 'Media': prefix = 'medium'; break;
        case 'Difícil': prefix = 'hard'; break;
        case 'Mortal': prefix = 'deadly'; break;
        case 'Extremo': prefix = 'extreme'; break;
        default:
          console.log(`DEBUG: Unknown difficulty: ${difficulty}`);
          return null; // Unknown difficulty
      }

      const songId = source[`${prefix}_battle_song_id`];
      const songName = source[`${prefix}_battle_song_name`];
      const songFilePath = source[`${prefix}_battle_song_filePath`];

      console.log(`DEBUG: Attempting to access: ${prefix}_battle_song_id =`, songId);
      console.log(`DEBUG: Attempting to access: ${prefix}_battle_song_name =`, songName);
      console.log(`DEBUG: Attempting to access: ${prefix}_battle_song_filePath =`, songFilePath);

      if (songId && songName && songFilePath) {
        song = {
          id: songId,
          name: songName,
          filePath: songFilePath
        };
      }
      console.log(`Attempting to get ${difficulty} song from source. Result:`, song);
      return song;
    };

    // Get the difficulty of the selected encounter
    const currentEncounterDifficulty = encounterDifficultyData ? encounterDifficultyData.difficulty : null;
    console.log('Current Encounter Difficulty:', currentEncounterDifficulty);

    if (songPriority === 'encounter' && selectedEncounter) {
      songToPlay = getSongFromSource(selectedEncounter, currentEncounterDifficulty);
      console.log('After checking encounter specific song:', songToPlay);
      if (!songToPlay && selectedMap) { // Fallback to map if encounter has no specific battle song
        console.log('Encounter specific song not found, checking map specific song...');
        songToPlay = getSongFromSource(selectedMap, currentEncounterDifficulty);
        console.log('After checking map specific song:', songToPlay);
        if (!songToPlay && selectedMap.song_id) { // Fallback to general map song
          console.log('Map specific song not found, checking general map song...');
          songToPlay = { id: selectedMap.song_id, name: selectedMap.song_name, filePath: selectedMap.song_filePath };
          console.log('After checking general map song:', songToPlay);
        }
      }
    } else if (songPriority === 'map' && selectedMap) {
      songToPlay = getSongFromSource(selectedMap, currentEncounterDifficulty);
      console.log('After checking map specific song:', songToPlay);
      if (!songToPlay && selectedMap.song_id) { // Fallback to general map song
        console.log('Map specific song not found, checking general map song...');
        songToPlay = { id: selectedMap.song_id, name: selectedMap.song_name, filePath: selectedMap.song_filePath };
        console.log('After checking general map song:', songToPlay);
      }
      if (!songToPlay && selectedEncounter) { // Fallback to encounter if map has no specific battle song
        console.log('Map song not found, checking encounter specific song...');
        songToPlay = getSongFromSource(selectedEncounter, currentEncounterDifficulty);
        console.log('After checking encounter specific song:', songToPlay);
        if (!songToPlay && selectedEncounter.song_id) { // Fallback to general encounter song
          console.log('Encounter specific song not found, checking general encounter song...');
          songToPlay = { id: selectedEncounter.song_id, name: selectedEncounter.song_name, filePath: selectedEncounter.song_filePath };
          console.log('After checking general encounter song:', songToPlay);
        }
      }
    }

    console.log('Final songToPlay:', songToPlay);
    console.log('Current song (before comparison):', currentSong);

    if (songToPlay) {
      if (!currentSong || currentSong.id !== songToPlay.id) {
        console.log('Playing new song:', songToPlay.name, 'ID:', songToPlay.id);
        playSong(songToPlay);
      } else {
        console.log('Song is already playing and is the same:', songToPlay.name, 'ID:', songToPlay.id);
      }
    } else {
      console.log('No suitable song found for combat. Stopping current song if any.');
      // Optionally, stop current song if no combat song is found
      if (currentSong) {
        playSong(null); // Stop current song
      }
    }
  };

  const handleStartCombat = () => {
    console.log('--- Inicio Combate button clicked ---');
    handleBattleTheme(); // Reuse the existing battle theme logic
  };

  const playBaseSong = (map, encounter, priority) => {
    console.log('--- Playing Base Song ---');
    console.log('Map:', map);
    console.log('Encounter:', encounter);
    console.log('Priority:', priority);

    let songToPlay = null;

    if (priority === 'encounter' && encounter && encounter.song_id) {
      songToPlay = { id: encounter.song_id, name: encounter.song_name, filePath: encounter.song_filePath };
      console.log('Found encounter base song:', songToPlay);
    } else if (priority === 'map' && map && map.song_id) {
      songToPlay = { id: map.song_id, name: map.song_name, filePath: map.song_filePath };
      console.log('Found map base song:', songToPlay);
    } else if (encounter && encounter.song_id) { // Fallback if priority didn't yield a song
      songToPlay = { id: encounter.song_id, name: encounter.song_name, filePath: encounter.song_filePath };
      console.log('Fallback to encounter base song:', songToPlay);
    } else if (map && map.song_id) { // Fallback if priority didn't yield a song
      songToPlay = { id: map.song_id, name: map.song_name, filePath: map.song_filePath };
      console.log('Fallback to map base song:', songToPlay);
    }

    if (songToPlay) {
      if (!currentSong || currentSong.id !== songToPlay.id) {
        console.log('Playing base song:', songToPlay.name, 'ID:', songToPlay.id);
        playSong(songToPlay);
      } else {
        console.log('Base song is already playing and is the same:', songToPlay.name, 'ID:', songToPlay.id);
      }
    } else {
      console.log('No suitable base song found. Stopping current song if any.');
      if (currentSong) {
        playSong(null); // Stop current song
      }
    }
  };

  const handleRetreatCombat = () => {
    console.log('--- Retirada de Combate button clicked ---');
    const selectedMap = maps.find(m => m.id === selectedMapId);
    const selectedEncounter = encounters.find(e => e.id === selectedEncounterId);
    playBaseSong(selectedMap, selectedEncounter, songPriority);
  };

  const handleCombatWon = async () => {
    console.log('--- Combate Ganado button clicked ---');
    const selectedMap = maps.find(m => m.id === selectedMapId);
    const selectedEncounter = encounters.find(e => e.id === selectedEncounterId);
    playBaseSong(selectedMap, selectedEncounter, songPriority);

    if (encounterDifficultyData && selectedEncounterDetails && selectedEncounterDetails.characters) {
      const adjustedXP = encounterDifficultyData.adjustedXP;
      const participatingCharacters = selectedEncounterDetails.characters;

      if (participatingCharacters.length > 0 && adjustedXP > 0) {
        const xpPerCharacter = Math.floor(adjustedXP / participatingCharacters.length);
        console.log(`Calculated XP per character: ${xpPerCharacter}`);

        for (const char of participatingCharacters) {
          try {
            const newExperience = (char.experiencePoints || 0) + xpPerCharacter;
            console.log(`Updating character ${char.name} (ID: ${char.id}) experience from ${char.experiencePoints} to ${newExperience}`);

                        const characterUpdateData = {
              ...char, // Spread all existing properties
              experiencePoints: newExperience // Override with the new experiencePoints
            };

            const updateResponse = await fetch(`${API_BASE_URL}/characters/${char.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(characterUpdateData),
            });

            if (!updateResponse.ok) {
              throw new Error(`Failed to update experience for character ${char.id}`);
            }
            console.log(`Successfully updated experience for character ${char.name}`);

            // Update the frontend characters state
            setCharacters(prevChars => prevChars.map(c =>
              c.id === char.id ? { ...c, experiencePoints: newExperience } : c
            ));

          } catch (error) {
            console.error(`Error updating experience for character ${char.name}:`, error);
          }
        }
        setShowInfoModal(true);
        setInfoModalTitle('Combate Ganado');
        setInfoModalMessage(`Experiencia (${xpPerCharacter} PX por personaje) distribuida a los personajes participantes.`);
      } else {
        console.log('No participating characters or adjusted XP is 0. No experience distributed.');
        setShowInfoModal(true);
        setInfoModalTitle('Combate Ganado');
        setInfoModalMessage('No se distribuyó experiencia: no hay personajes participantes o el PX ajustado es 0.');
      }
    } else {
      console.log('Encounter details or characters not available for experience distribution.');
      setShowInfoModal(true);
      setInfoModalTitle('Combate Ganado');
      setInfoModalMessage('No se pudo distribuir experiencia: detalles del encuentro o personajes no disponibles.');
    }
  };

  const handleAddToJournal = async () => {
    if (!selectedDay || !currentCampaign || !selectedEncounterDetails || !currentPreviewMap) {
      setShowInfoModal(true);
      setInfoModalTitle('Advertencia');
      setInfoModalMessage('Por favor, selecciona un día en el diario, una campaña activa, un encuentro y un mapa para añadir una entrada.');
      return;
    }

    let characterNames = '';
    const charNamesArray = selectedEncounterDetails.characters.map(char => char.name);
    if (charNamesArray.length === 1) {
      characterNames = charNamesArray[0];
    } else if (charNamesArray.length === 2) {
      characterNames = charNamesArray.join(' y ');
    } else if (charNamesArray.length > 2) {
      const lastChar = charNamesArray.pop();
      characterNames = charNamesArray.join(', ') + ' y ' + lastChar;
    }

    const monsterCounts = {};
    getMonstersWithSuffix().forEach(monster => {
      const baseName = monster.name.replace(/ [A-Z]$/, ''); // Remove the suffix (e.g., " A", " B")
      monsterCounts[baseName] = (monsterCounts[baseName] || 0) + 1;
    });

    const monsterNamesArray = Object.entries(monsterCounts)
      .map(([name, count]) => {
        if (count > 1) {
          return `${count} ${name}s`; // Assuming plural 's' for simplicity, can be improved
        }
        return name;
      });

    let monsterNames = '';
    if (monsterNamesArray.length === 1) {
      monsterNames = monsterNamesArray[0];
    } else if (monsterNamesArray.length === 2) {
      monsterNames = monsterNamesArray.join(' y ');
    } else if (monsterNamesArray.length > 2) {
      const lastMonster = monsterNamesArray.pop();
      monsterNames = monsterNamesArray.join(', ') + ' y ' + lastMonster;
    }

    const mapName = currentPreviewMap.name;

    const entryText = `${characterNames} se enfrentaron a ${monsterNames} en ${mapName}.\n`;

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
        const newEntryId = generateUUID();
        const newEntry = {
          id: newEntryId,
          campaign_id: currentCampaign.id,
          year: String(selectedDay.year),
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
    <div className="combat-container">

      <div className="selection-container">
        <div className="map-selection-container">
          <h3>Select Map:</h3>
          <div className="map-select-and-button">
            <select id="map-select" value={selectedMapId} onChange={handleMapSelect}>
              <option value="">-- Select a map --</option>
              {maps.map(map => (
                <option key={map.id} value={map.id}>{map.name}</option>
              ))}
            </select>
            <button onClick={handleNavigateToMaps} className="navigate-button">Go to Maps</button>
          </div>
        </div>

        <div className="encounter-selection-container">
          <h3>Select Encounter:</h3>
          <div className="encounter-select-and-button">
            <select id="encounter-select" value={selectedEncounterId} onChange={handleEncounterSelect}>
              <option value="">-- Select an encounter --</option>
              {encounters.map(enc => (
                <option key={enc.id} value={enc.id}>{enc.name}</option>
              ))}
            </select>
            <button onClick={handleNavigateToEncounters} className="navigate-button">Go to Encounters</button>
          </div>
        </div>

        <div className="song-priority-container">
          <label>Prioridad de Canción:</label>
          <input
            type="radio"
            id="priority-encounter"
            name="song-priority"
            value="encounter"
            checked={songPriority === 'encounter'}
            onChange={handleSongPriorityChange}
          />
          <label htmlFor="priority-encounter">Encuentro</label>

          <input
            type="radio"
            id="priority-map"
            name="song-priority"
            value="map"
            checked={songPriority === 'map'}
            onChange={handleSongPriorityChange}
          />
          <label htmlFor="priority-map">Mapa</label>
        </div>

        <button onClick={handleBattleTheme} className="battle-theme-btn">Batletheme</button>

        
      </div>

      <div className={`player-view-preview ${isPreviewExpanded ? 'expanded' : ''}`}>
        <div className="preview-header">
          <h3>Previsualización de Ventana de Jugadores</h3>
          <div className="preview-toggle-button-wrapper">
            <button onClick={togglePreview} className="preview-toggle-button">
              {isPreviewExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minimize-2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-maximize-2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" y2="10" y2="14"></line></svg>
              )}
            </button>
          </div>
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
                            {showGrid && (
                              <div className="grid-overlay" style={getGridOverlayStyle()}></div>
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
                    <button onClick={handleZoomIn}>+</button>
                    <button onClick={handleZoomOut}>-</button>
                  </div>
                  <div className="rotate-controls">
                    <button onClick={handleRotateLeft}>&#x21BA;</button>
                    <button onClick={handleRotateRight}>&#x21BB;</button>
                  </div>
                </div>
              )}
              <button onClick={toggleGridSettings} className="grid-settings-btn">
                Grid
              </button>
              {isGridSettingsOpen && (
                <div className="grid-settings-dropdown">
                  <button onClick={toggleGrid}>
                    {showGrid ? 'Hide Grid' : 'Show Grid'}
                  </button>
                  <div className="grid-size-controls">
                    <button onClick={handleGridSizeUp}>Grid Size +</button>
                    <button onClick={handleGridSizeDown}>Grid Size -</button>
                  </div>
                  <div className="grid-pan-controls">
                    <button onClick={() => handleGridPan('up')}>&#x25B2;</button>
                    <div className="grid-pan-left-right">
                      <button onClick={() => handleGridPan('left')}>&#x25C0;</button>
                      <button onClick={() => handleGridPan('right')}>&#x25B6;</button>
                    </div>
                    <button onClick={() => handleGridPan('down')}>&#x25BC;</button>
                  </div>
                </div>
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

      {selectedEncounterDetails && (
        <div className={`encounter-details-container ${isEncounterDetailsExpanded ? '' : 'collapsed'}`}>
          <h3 className="encounter-details-header">
            Detalles del Encuentro: {selectedEncounterDetails.name}
            <button onClick={toggleEncounterDetails} className="toggle-details-button">
              {isEncounterDetailsExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevron-up"><polyline points="18 15 12 9 6 15"></polyline></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
              )}
            </button>
          </h3>
          {encounterDifficultyData && (
            <div className="encounter-difficulty-summary">
              <p>Dificultad: <strong>{encounterDifficultyData.difficulty}</strong></p>
              {encounterDifficultyData.adjustedXP > 0 && encounterDifficultyData.allThresholds.easy > 0 && (
                <DifficultyProgressBar
                  adjustedXP={encounterDifficultyData.adjustedXP}
                  currentThreshold={encounterDifficultyData.currentThreshold}
                  allThresholds={encounterDifficultyData.allThresholds}
                  difficultyText={encounterDifficultyData.difficulty}
                />
              )}
            </div>
          )}
          {isEncounterDetailsExpanded && (
            <>
              {selectedEncounterDetails.characters && selectedEncounterDetails.characters.length > 0 && (
                <div className="encounter-characters">
                  <h4>Personajes:</h4>
                  <ul>
                    {selectedEncounterDetails.characters.map(char => (
                      <li key={char.id}>
                        {char.name}
                        <input
                          type="number"
                          value={initiatives[char.id] || ''}
                          onChange={(e) => handleInitiativeChange(char.id, e.target.value)}
                          placeholder="Init"
                          className="initiative-input"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedEncounterDetails.monsters && selectedEncounterDetails.monsters.length > 0 && (
                <div className="encounter-monsters">
                  <h4>
                    Enemigos:
                    <button onClick={handleRollMonsterInitiatives} className="roll-initiative-button">
                      Roll Initiative
                    </button>
                    <button onClick={handleCalculateMonsterHP} className="roll-initiative-button">
                      Calcular HP de Monstruos
                    </button>
                  </h4>
                  <ul>
                    {getMonstersWithSuffix().map(monster => (
                      <li key={monster.instanceId}>
                        {monster.displayName}
                        <input
                          type="number"
                          value={initiatives[monster.instanceId] || ''}
                          onChange={(e) => handleInitiativeChange(monster.instanceId, e.target.value)}
                          placeholder="Init"
                          className="initiative-input"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(selectedEncounterDetails.characters && selectedEncounterDetails.characters.length === 0) &&
               (selectedEncounterDetails.monsters && selectedEncounterDetails.monsters.length === 0) && (
                <p>Este encuentro no tiene personajes ni enemigos asignados.</p>
              )}
            </>
          )}
        </div>
      )}
      {selectedEncounterDetails && (
        <div className="combat-actions-container">
          {selectedEncounterDetails && currentPreviewMap && selectedDay && currentCampaign && (
            <button
              onClick={handleAddToJournal}
              className="add-to-journal-btn"
            >
              Añadir a Diario
            </button>
          )}
          <button onClick={handleStartCombat} className="combat-action-btn start-combat-btn combat-button-size">
            Inicio Combate
          </button>
          <button onClick={handleRetreatCombat} className="combat-action-btn retreat-combat-btn combat-button-size">
            Retirada de Combate
          </button>
          <button onClick={handleCombatWon} className="combat-action-btn combat-won-btn combat-button-size">
            Combate Ganado
          </button>
        </div>
      )}
{selectedEncounterDetails && (
        <div className="combat-main-content">
          <div className="initiative-tracker">
            {sortedCombatants.map((combatant, index) => (
              <div
                key={combatant.id}
                className={`combatant-card ${combatant.type} ${index === currentTurn ? 'active-turn' : ''} ${combatant.id === manuallySelectedCombatant ? 'manual-selection' : ''}`}
                onClick={() => handleManualSelect(combatant.id)}
                style={{
                  background: `linear-gradient(to left, rgba(255, 255, 255, 0.2) ${100 - combatant.hpPercentage}%, transparent ${100 - combatant.hpPercentage}%)`,
                }}
              >
                <span className="combatant-name">{combatant.name}</span>
                <span className="combatant-initiative">Init: {combatant.initiative}</span>
                <span className="combatant-ac">CA: {combatant.ac}</span>
                <div className="combatant-hp">
                  <div className="hp-input-container">
                    <span className="hp-label">Max HP</span>
                    <input
                      type="number"
                      value={combatant.maxHp}
                      onChange={(e) => handleMaxHPChange(combatant.id, e.target.value)}
                      className="hp-input"
                    />
                  </div>
                  <span>/
                  </span>
                  <div className="hp-input-container">
                    <span className="hp-label">Actual HP</span>
                    <input
                      type="number"
                      value={combatant.currentHp}
                      onChange={(e) => handleHPChange(combatant.id, e.target.value)}
                      className="hp-input"
                    />
                  </div>
                  {combatant.type === 'character' && (
                    <div className="hp-input-container">
                      <span className="hp-label">Temp HP</span>
                      <input
                        type="number"
                        value={combatant.tempHp}
                        onChange={(e) => handleTempHPChange(combatant.id, e.target.value)}
                        className="hp-input"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="combatant-card turn-manager">
              <div className="turn-info">
                <h3>Round: {currentRound}</h3>
                <h4>Turn: {visibleTurn}</h4>
                <h4>{currentCombatant ? currentCombatant.name : 'N/A'}</h4>
              </div>
              <div className="turn-controls">
                <button onClick={handlePreviousTurn}>Previous Turn</button>
                <button onClick={handleNextTurn}>Next Turn</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedEncounterDetails && (
        <div className="combat-main-content">
          <div className="combat-details-columns">
            <div className="selected-combatant-details">
              <h3>Turn Manager Selected</h3>
              {currentCombatantFullData ? (
                currentCombatant.type === 'monster' ? (
                  <MonsterSheetDisplay monster={currentCombatantFullData} />
                ) : (
                  <CharacterSheetDisplay character={currentCombatantFullData} />
                )
              ) : (
                <p>No combatant selected by turn manager.</p>
              )}
            </div>
            <div className="manually-selected-combatant-details">
              <h3>Manually Selected</h3>
              {manualCombatantFullData ? (
                manualCombatant.type === 'monster' ? (
                  <MonsterSheetDisplay monster={manualCombatantFullData} />
                ) : (
                  <CharacterSheetDisplay character={manualCombatantFullData} />
                )
              ) : (
                <p>No combatant manually selected.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* InfoModal for messages */}
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

export default Combat;