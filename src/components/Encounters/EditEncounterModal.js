import React, { useState, useEffect, useMemo } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import SelectableList from '../shared/SelectableList/SelectableList';
import { calculateEncounterDifficulty } from '../../utils/difficultyCalculator';
import DifficultyProgressBar from './DifficultyProgressBar/DifficultyProgressBar'; // Import the new component
import './EditEncounterModal.css';

const API_BASE_URL = 'http://localhost:3001';

function EditEncounterModal({ encounter, onClose, onUpdateEncounter }) {
  const { currentCampaign } = useCampaign();
  const [name, setName] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState('');
  const [easyBattleSong, setEasyBattleSong] = useState('');
  const [mediumBattleSong, setMediumBattleSong] = useState('');
  const [hardBattleSong, setHardBattleSong] = useState('');
  const [deadlyBattleSong, setDeadlyBattleSong] = useState('');
  const [extremeBattleSong, setExtremeBattleSong] = useState('');
  
  const [allMonsters, setAllMonsters] = useState([]);
  const [allCharacters, setAllCharacters] = useState([]);
  const [selectedMonsters, setSelectedMonsters] = useState([]); // Now allows duplicates
  const [selectedCharacters, setSelectedCharacters] = useState([]);

  // Filter states for monsters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVd, setFilterVd] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAlignment, setFilterAlignment] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [filterPx, setFilterPx] = useState('');
  const [filterLanguages, setFilterLanguages] = useState('');
  const [filterDamageResistances, setFilterDamageResistances] = useState('');
  const [filterDamageImmunities, setFilterDamageImmunities] = useState('');
  const [filterConditionImmunities, setFilterConditionImmunities] = useState('');
  const [filterDamageVulnerabilities, setFilterDamageVulnerabilities] = useState('');

  // State for filter visibility
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Fetch campaigns
    fetch(`${API_BASE_URL}/campaigns`)
      .then(response => response.json())
      .then(data => setCampaigns(data))
      .catch(error => console.error('Error fetching campaigns:', error));

    // Fetch songs
    fetch(`${API_BASE_URL}/songs`)
      .then(response => response.json())
      .then(data => setSongs(data))
      .catch(error => console.error('Error fetching songs:', error));

    // Fetch monsters
    fetch(`${API_BASE_URL}/monsters`)
      .then(response => response.json())
      .then(data => {
        setAllMonsters(data);
        // Pre-populate selectedMonsters with full monster objects
        if (encounter && encounter.monsters && encounter.monsters.length > 0) {
          console.log('Encounter monsters (already full objects):', encounter.monsters); // Confirming content
          setSelectedMonsters(encounter.monsters); // Directly use the monsters from the encounter object
        }
      })
      .catch(error => console.error('Error fetching monsters:', error));

    // Fetch characters
    const charactersUrl = currentCampaign 
      ? `${API_BASE_URL}/characters?campaignId=${currentCampaign.id}` 
      : (encounter.campaign_id 
        ? `${API_BASE_URL}/characters?campaignId=${encounter.campaign_id}` 
        : `${API_BASE_URL}/characters`);
    fetch(charactersUrl)
      .then(response => response.json())
      .then(data => setAllCharacters(data))
      .catch(error => console.error('Error fetching characters:', error));

    // Pre-populate form with encounter data
    if (encounter) {
      setName(encounter.name || '');
      setSelectedCampaign(encounter.campaign_id || '');
      setSelectedSong(encounter.song_id || '');
      setEasyBattleSong(encounter.easy_battle_song_id || '');
      setMediumBattleSong(encounter.medium_battle_song_id || '');
      setHardBattleSong(encounter.hard_battle_song_id || '');
      setDeadlyBattleSong(encounter.deadly_battle_song_id || '');
      setExtremeBattleSong(encounter.extreme_battle_song_id || '');
      // selectedMonsters is handled after allMonsters fetch
      setSelectedCharacters(encounter.characters || []);
    }

  }, [encounter, currentCampaign]);

  // Memoized unique values for monster filters
  const uniqueVd = useMemo(() => {
    const values = new Set(allMonsters.map(m => m.vd).filter(Boolean));
    return ['', ...Array.from(values).sort((a, b) => {
      const parseVd = (vd) => {
        if (vd.includes('/')) {
          const [num, den] = vd.split('/').map(Number);
          return num / den;
        }
        return Number(vd);
      };
      return parseVd(a) - parseVd(b);
    })];
  }, [allMonsters]);

  const uniqueTypes = useMemo(() => {
    const values = new Set(allMonsters.map(m => m.type).filter(Boolean));
    return ['', ...Array.from(values).sort()];
  }, [allMonsters]);

  const uniqueAlignments = useMemo(() => {
    const values = new Set(allMonsters.map(m => m.alignment).filter(Boolean));
    return ['', ...Array.from(values).sort()];
  }, [allMonsters]);

  const uniqueOrigins = useMemo(() => {
    const values = new Set(allMonsters.map(m => m.origin).filter(Boolean));
    return ['', ...Array.from(values).sort()];
  }, [allMonsters]);

  const uniqueSizes = useMemo(() => {
    const values = new Set(allMonsters.map(m => m.size).filter(Boolean));
    return ['', ...Array.from(values).sort()];
  }, [allMonsters]);

  const uniquePx = useMemo(() => {
    const values = new Set(allMonsters.map(m => m.px).filter(Boolean));
    return ['', ...Array.from(values).sort((a, b) => Number(a) - Number(b))];
  }, [allMonsters]);

  const uniqueLanguages = useMemo(() => {
    const allLanguages = new Set();
    allMonsters.forEach(m => {
      if (m.languages) {
        m.languages.split(',').forEach(lang => allLanguages.add(lang.trim()));
      }
    });
    return ['', ...Array.from(allLanguages).sort()];
  }, [allMonsters]);

  const uniqueDamageResistances = useMemo(() => {
    const allResistances = new Set();
    allMonsters.forEach(m => {
      if (m.damageResistances) {
        m.damageResistances.split(',').forEach(res => allResistances.add(res.trim()));
      }
    });
    return ['', ...Array.from(allResistances).sort()];
  }, [allMonsters]);

  const uniqueDamageImmunities = useMemo(() => {
    const allImmunities = new Set();
    allMonsters.forEach(m => {
      if (m.damageImmunities) {
        m.damageImmunities.split(',').forEach(imm => allImmunities.add(imm.trim()));
      }
    });
    return ['', ...Array.from(allImmunities).sort()];
  }, [allMonsters]);

  const uniqueConditionImmunities = useMemo(() => {
    const allImmunities = new Set();
    allMonsters.forEach(m => {
      if (m.conditionImmunities) {
        m.conditionImmunities.split(',').forEach(imm => allImmunities.add(imm.trim()));
      }
    });
    return ['', ...Array.from(allImmunities).sort()];
  }, [allMonsters]);

  const uniqueDamageVulnerabilities = useMemo(() => {
    const allVulnerabilities = new Set();
    allMonsters.forEach(m => {
      if (m.damageVulnerabilities) {
        m.damageVulnerabilities.split(',').forEach(vul => allVulnerabilities.add(vul.trim()));
      }
    });
    return ['', ...Array.from(allVulnerabilities).sort()];
  }, [allMonsters]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
  };

  const filteredMonsters = useMemo(() => {
    return allMonsters.filter(monster => {
      const nameMatch = monster.name.toLowerCase().includes(searchTerm.toLowerCase());

      const vdMatch = filterVd ? monster.vd === filterVd : true;
      const typeMatch = filterType ? monster.type === filterType : true;
      const alignmentMatch = filterAlignment ? monster.alignment === filterAlignment : true;
      const originMatch = filterOrigin ? monster.origin === filterOrigin : true;
      const sizeMatch = filterSize ? monster.size === filterSize : true;

      const pxMatch = filterPx ? monster.px === filterPx : true;
      const languagesMatch = filterLanguages ? monster.languages.split(',').map(s => s.trim()).includes(filterLanguages) : true;
      const damageResistancesMatch = filterDamageResistances ? monster.damageResistances.split(',').map(s => s.trim()).includes(filterDamageResistances) : true;
      const damageImmunitiesMatch = filterDamageImmunities ? monster.damageImmunities.split(',').map(s => s.trim()).includes(filterDamageImmunities) : true;
      const conditionImmunitiesMatch = filterConditionImmunities ? monster.conditionImmunities.split(',').map(s => s.trim()).includes(filterConditionImmunities) : true;
      const damageVulnerabilitiesMatch = filterDamageVulnerabilities ? monster.damageVulnerabilities.split(',').map(s => s.trim()).includes(filterDamageVulnerabilities) : true;

      return nameMatch && vdMatch && typeMatch && alignmentMatch && originMatch && sizeMatch && pxMatch &&
             languagesMatch && damageResistancesMatch && damageImmunitiesMatch && conditionImmunitiesMatch && damageVulnerabilitiesMatch;
    });
  }, [
    allMonsters,
    searchTerm,
    filterVd,
    filterType,
    filterAlignment,
    filterOrigin,
    filterSize,
    filterPx,
    filterLanguages,
    filterDamageResistances,
    filterDamageImmunities,
    filterConditionImmunities,
    filterDamageVulnerabilities,
  ]);

  const handleAddMonster = (monster) => {
    setSelectedMonsters((prevSelected) => [...prevSelected, monster]);
  };

  const handleRemoveMonster = (indexToRemove) => {
    setSelectedMonsters((prevSelected) =>
      prevSelected.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert('El nombre del encuentro es obligatorio.');
      return;
    }
    onUpdateEncounter({
      ...encounter,
      name,
      campaign_id: selectedCampaign || null,
      song_id: selectedSong || null,
      easy_battle_song_id: easyBattleSong || null,
      medium_battle_song_id: mediumBattleSong || null,
      hard_battle_song_id: hardBattleSong || null,
      deadly_battle_song_id: deadlyBattleSong || null,
      extreme_battle_song_id: extremeBattleSong || null,
      monsters: selectedMonsters.map(m => m.id), // Send all IDs, including duplicates
      characters: selectedCharacters.map(c => c.id),
    });
  };

  // Calculate difficulty
  const difficultyData = useMemo(() => {
    return calculateEncounterDifficulty(selectedCharacters, selectedMonsters);
  }, [selectedCharacters, selectedMonsters]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Encuentro</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre del Encuentro:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="campaign">Campaña:</label>
            <select
              id="campaign"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
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
              onChange={(e) => setSelectedSong(e.target.value)}
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
              onChange={(e) => setEasyBattleSong(e.target.value)}
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
              onChange={(e) => setMediumBattleSong(e.target.value)}
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
              onChange={(e) => setHardBattleSong(e.target.value)}
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
              onChange={(e) => setDeadlyBattleSong(e.target.value)}
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
              onChange={(e) => setExtremeBattleSong(e.target.value)}
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
            <label>Monstruos:</label>
            <div className="monster-search-container">
              <input
                type="text"
                placeholder="Buscar monstruos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="monster-search-input"
              />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="toggle-filters-button"
              >
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
            </div>
            {showFilters && (
              <div className="bestiary-filters">
                <div className="filter-group">
                  <label htmlFor="filterVd">VD:</label>
                  <select id="filterVd" value={filterVd} onChange={handleFilterChange(setFilterVd)}>
                    {uniqueVd.map(vd => (
                      <option key={vd} value={vd}>{vd === '' ? 'Todos' : vd}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterType">Tipo:</label>
                  <select id="filterType" value={filterType} onChange={handleFilterChange(setFilterType)}>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type === '' ? 'Todos' : type}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterAlignment">Alineamiento:</label>
                  <select id="filterAlignment" value={filterAlignment} onChange={handleFilterChange(setFilterAlignment)}>
                    {uniqueAlignments.map(alignment => (
                      <option key={alignment} value={alignment}>{alignment === '' ? 'Todos' : alignment}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterOrigin">Origen:</label>
                  <select id="filterOrigin" value={filterOrigin} onChange={handleFilterChange(setFilterOrigin)}>
                    {uniqueOrigins.map(origin => (
                      <option key={origin} value={origin}>{origin === '' ? 'Todos' : origin}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterSize">Tamaño:</label>
                  <select id="filterSize" value={filterSize} onChange={handleFilterChange(setFilterSize)}>
                    {uniqueSizes.map(size => (
                      <option key={size} value={size}>{size === '' ? 'Todos' : size}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterPx">PX:</label>
                  <select id="filterPx" value={filterPx} onChange={handleFilterChange(setFilterPx)}>
                    {uniquePx.map(px => (
                      <option key={px} value={px}>{px === '' ? 'Todos' : px}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterLanguages">Idiomas:</label>
                  <select id="filterLanguages" value={filterLanguages} onChange={handleFilterChange(setFilterLanguages)}>
                    {uniqueLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang === '' ? 'Todos' : lang}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterDamageResistances">Resistencias al daño:</label>
                  <select id="filterDamageResistances" value={filterDamageResistances} onChange={handleFilterChange(setFilterDamageResistances)}>
                    {uniqueDamageResistances.map(res => (
                      <option key={res} value={res}>{res === '' ? 'Todos' : res}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterDamageImmunities">Inmunidades al daño:</label>
                  <select id="filterDamageImmunities" value={filterDamageImmunities} onChange={handleFilterChange(setFilterDamageImmunities)}>
                    {uniqueDamageImmunities.map(imm => (
                      <option key={imm} value={imm}>{imm === '' ? 'Todos' : imm}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterConditionImmunities">Inmunidades al estado:</label>
                  <select id="filterConditionImmunities" value={filterConditionImmunities} onChange={handleFilterChange(setFilterConditionImmunities)}>
                    {uniqueConditionImmunities.map(imm => (
                      <option key={imm} value={imm}>{imm === '' ? 'Todos' : imm}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="filterDamageVulnerabilities">Vulnerabilidades al daño:</label>
                  <select id="filterDamageVulnerabilities" value={filterDamageVulnerabilities} onChange={handleFilterChange(setFilterDamageVulnerabilities)}>
                    {uniqueDamageVulnerabilities.map(vul => (
                      <option key={vul} value={vul}>{vul === '' ? 'Todos' : vul}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="monster-list-container">
              <h3>Monstruos Disponibles:</h3>
              <ul className="available-monsters-list">
                {filteredMonsters.length > 0 ? (
                  filteredMonsters.map((monster) => (
                    <li key={monster.id} className="monster-list-item">
                      <span>{monster.name}</span>
                      <button type="button" onClick={() => handleAddMonster(monster)}>Añadir</button>
                    </li>
                  ))
                ) : (
                  <li>No se encontraron monstruos.</li>
                )}
              </ul>
            </div>

            <div className="selected-monsters-container">
              <h3>Monstruos en el Encuentro: ({selectedMonsters.length})</h3>
              <ul className="selected-monsters-list">
                {selectedMonsters.length > 0 ? (
                  selectedMonsters.map((monster, index) => (
                    <li key={`${monster.id}-${index}`} className="monster-list-item">
                      <span>{monster.name}</span>
                      <button type="button" onClick={() => handleRemoveMonster(index)}>Eliminar</button>
                    </li>
                  ))
                ) : (
                  <li>No hay monstruos seleccionados.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label>Personajes:</label>
            <SelectableList
              options={allCharacters}
              selected={selectedCharacters}
              onChange={setSelectedCharacters}
            />
          </div>

          <div className="form-group difficulty-display">
            <p>Dificultad del Encuentro: <strong>{difficultyData.difficulty}</strong></p>
            {difficultyData.adjustedXP > 0 && difficultyData.allThresholds.easy > 0 && (
              <DifficultyProgressBar
                adjustedXP={difficultyData.adjustedXP}
                currentThreshold={difficultyData.currentThreshold}
                allThresholds={difficultyData.allThresholds}
                difficultyText={difficultyData.difficulty}
              />
            )}
            {difficultyData.adjustedXP > 0 && (
              <div className="difficulty-formula">
                <h4>Detalles de la Dificultad:</h4>
                <p><strong>Umbrales de PX por Jugador:</strong></p>
                <ul>
                  {difficultyData.playerThresholdDetails.map((detail, index) => (
                    <li key={index}>
                      {detail.name} (Nivel {detail.level}): Fácil {detail.thresholds.easy}, Media {detail.thresholds.medium}, Difícil {detail.thresholds.difficult}, Mortal {detail.thresholds.deadly}
                    </li>
                  ))}
                </ul>
                <p><strong>Total Umbrales del Grupo:</strong> Fácil {difficultyData.allThresholds.easy}, Media {difficultyData.allThresholds.medium}, Difícil {difficultyData.allThresholds.difficult}, Mortal {difficultyData.allThresholds.deadly}</p>
                <p><strong>PX Base de Monstruos:</strong> {difficultyData.totalMonsterXP} PX</p>
                <p><strong>Multiplicador de Encuentro:</strong> {difficultyData.multiplier} ({difficultyData.multiplierExplanation})</p>
                <p><strong>PX Ajustados del Encuentro:</strong> {difficultyData.adjustedXP} PX</p>
              </div>
            )}
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

export default EditEncounterModal;
