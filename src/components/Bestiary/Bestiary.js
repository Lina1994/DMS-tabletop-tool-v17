import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MonsterCard from './MonsterCard/MonsterCard';
import AddMonsterModal from './AddMonsterModal';
import ConfirmModal from '../Maps/ConfirmModal';
import MonsterSheetModal from './MonsterSheetModal';
import MultiSelectFilter from '../Spells/MultiSelectFilter';
import './Bestiary.css';
import API_BASE_URL from '../../apiConfig';

// We will keep ipcRenderer for file operations (import/export) that are specific to Electron
// For data operations, we will use fetch to the backend.
let ipcRenderer = null;
if (window.require) {
  try {
    const electron = window.require('electron');
    if (electron && electron.ipcRenderer) {
      ipcRenderer = electron.ipcRenderer;
    }
  } catch (e) {
    console.warn("Could not load electron.ipcRenderer:", e);
  }
}

const generateUniqueId = () => {
  return `monster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

function Bestiary() {
  const [monsters, setMonsters] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [monsterToShow, setMonsterToShow] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [monsterToDeleteId, setMonsterToDeleteId] = useState(null);
  const [monsterToDeleteName, setMonsterToDeleteName] = useState('');
  const [confirmLevel, setConfirmLevel] = useState(0); // 0: no confirmation, 1-3: confirmation steps
  const [deleteAllConfirmMessage, setDeleteAllConfirmMessage] = useState('');

  // Filter states
  const [filterVd, setFilterVd] = useState([]);
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

  // Function to fetch monsters from the backend
  const fetchMonsters = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/monsters`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMonsters(data);
    } catch (error) {
      console.error('Error fetching monsters:', error);
    }
  }, []);

  // Effect for initial monster load
  useEffect(() => {
    fetchMonsters();
  }, [fetchMonsters]);

  // Effect for IPC listener (runs once on mount, cleans up on unmount)
  useEffect(() => {
    if (!ipcRenderer) return; // Only set up listeners if in Electron environment

    const handleImportedMonsters = async (event, { success, monsters: importedMonsters, error }) => {
      setIsImporting(false);
      if (success) {
        // Add monsters to the backend one by one
        for (const monster of importedMonsters) {
          try {
            // Ensure VD is '0' if it's empty or null from Excel import
            if (!monster.vd) {
              monster.vd = '0';
            }
            const monsterWithId = { ...monster, id: generateUniqueId() }; // Generate ID for imported monsters
            await fetch(`${API_BASE_URL}/monsters`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(monsterWithId),
            });
          } catch (addError) {
            console.error('Error adding imported monster to backend:', addError);
          }
        }
        fetchMonsters(); // Re-fetch all monsters after import
      } else {
        console.error(`Error al importar monstruos: ${error}`);
      }
    };

    const handleExportResult = (event, { success, error }) => {
      setIsExporting(false);
      if (success) {
        // No alert needed, success is implied by no error
      } else {
        console.error(`Error al exportar monstruos: ${error}`);
      }
    };

    ipcRenderer.on('imported-monsters', handleImportedMonsters);
    ipcRenderer.on('export-monsters-result', handleExportResult);

    return () => {
      ipcRenderer.removeListener('imported-monsters', handleImportedMonsters);
      ipcRenderer.removeListener('export-monsters-result', handleExportResult);
    };
  }, [fetchMonsters]);

  // Memoized unique values for dropdowns
  const uniqueVd = useMemo(() => {
    const values = new Set(monsters.map(m => m.vd).filter(Boolean));
    const sortedValues = Array.from(values).sort((a, b) => {
        const parseVd = (vd) => {
            if (String(vd).includes('/')) {
                const [num, den] = String(vd).split('/').map(Number);
                return num / den;
            }
            return Number(vd);
        };
        return parseVd(a) - parseVd(b);
    });
    return sortedValues.map(v => ({ value: v, label: v }));
}, [monsters]);

  const uniqueTypes = useMemo(() => {
    const values = new Set(monsters.map(m => m.type).filter(Boolean));
    return ['', ...Array.from(values).sort()];
  }, [monsters]);

  const uniqueAlignments = useMemo(() => {
    const values = new Set(monsters.map(m => m.alignment).filter(Boolean));
    return ['', ...Array.from(values).sort()];
  }, [monsters]);

  const uniqueOrigins = useMemo(() => {
    const values = new Set(monsters.map(m => m.origin).filter(Boolean));
    return ['', ...Array.from(values).sort()];
  }, [monsters]);

  const uniqueSizes = useMemo(() => {
    const values = new Set(monsters.map(m => m.size).filter(Boolean));
    return ['', ...Array.from(values).sort()];
  }, [monsters]);

  const uniquePx = useMemo(() => {
    const values = new Set(monsters.map(m => m.px).filter(Boolean));
    return ['', ...Array.from(values).sort((a, b) => Number(a) - Number(b))];
  }, [monsters]);

  const uniqueLanguages = useMemo(() => {
    const allLanguages = new Set();
    monsters.forEach(m => {
      if (m.languages) {
        m.languages.split(',').forEach(lang => allLanguages.add(lang.trim()));
      }    });
    return ['', ...Array.from(allLanguages).sort()];
  }, [monsters]);

  const uniqueDamageResistances = useMemo(() => {
    const allResistances = new Set();
    monsters.forEach(m => {
      if (m.damageResistances) {
        m.damageResistances.split(',').forEach(res => allResistances.add(res.trim()));
      }
    });
    return ['', ...Array.from(allResistances).sort()];
  }, [monsters]);

  const uniqueDamageImmunities = useMemo(() => {
    const allImmunities = new Set();
    monsters.forEach(m => {
      if (m.damageImmunities) {
        m.damageImmunities.split(',').forEach(imm => allImmunities.add(imm.trim()));
      }
    });
    return ['', ...Array.from(allImmunities).sort()];
  }, [monsters]);

  const uniqueConditionImmunities = useMemo(() => {
    const allImmunities = new Set();
    monsters.forEach(m => {
      if (m.conditionImmunities) {
        m.conditionImmunities.split(',').forEach(imm => allImmunities.add(imm.trim()));
      }
    });
    return ['', ...Array.from(allImmunities).sort()];
  }, [monsters]);

  const uniqueDamageVulnerabilities = useMemo(() => {
    const allVulnerabilities = new Set();
    monsters.forEach(m => {
      if (m.damageVulnerabilities) {
        m.damageVulnerabilities.split(',').forEach(vul => allVulnerabilities.add(vul.trim()));
      }
    });
    return ['', ...Array.from(allVulnerabilities).sort()];
  }, [monsters]);


  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);
  
  const handleCloseSheetModal = () => {
    setIsSheetModalOpen(false);
    setMonsterToShow(null);
  };

  const handleAddMonster = async (newMonsterData) => {
    try {
      const monsterWithId = { ...newMonsterData, id: generateUniqueId() }; // Generate ID here
      const response = await fetch(`${API_BASE_URL}/monsters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monsterWithId),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Assuming the backend returns the added monster with its ID
      const addedMonster = await response.json();
      setMonsters(prevMonsters => [...prevMonsters, { ...monsterWithId, id: addedMonster.id }]);
      fetchMonsters(); // Re-fetch to ensure data consistency and get actual ID if needed
    } catch (error) {
      console.error('Error adding monster:', error);
    }
  };

  const handleUpdateMonster = async (updatedMonster) => {
    try {
      const response = await fetch(`${API_BASE_URL}/monsters/${updatedMonster.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMonster),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setMonsters(prevMonsters =>
        prevMonsters.map(m => (m.id === updatedMonster.id ? updatedMonster : m))
      );
      fetchMonsters(); // Re-fetch to ensure data consistency
    } catch (error) {
      console.error('Error updating monster:', error);
    }
  };

  const confirmDeletion = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/monsters/${monsterToDeleteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setMonsters(prevMonsters => prevMonsters.filter(m => m.id !== monsterToDeleteId));
      fetchMonsters(); // Re-fetch to ensure data consistency
    } catch (error) {
      console.error('Error deleting monster:', error);
    } finally {
      setIsConfirmModalOpen(false);
      setMonsterToDeleteId(null);
      setMonsterToDeleteName('');
    }
  }, [monsterToDeleteId, fetchMonsters]); // Dependencies for useCallback

  const cancelDeletion = useCallback(() => {
    setIsConfirmModalOpen(false);
    setMonsterToDeleteId(null);
    setMonsterToDeleteName('');
    setConfirmLevel(0); // Reset confirmation level for delete all
    setDeleteAllConfirmMessage(''); // Clear delete all message
  }, []); // No dependencies needed as it only uses setters

  const handleDeleteMonster = (monsterId, monsterName) => {
    setMonsterToDeleteId(monsterId);
    setMonsterToDeleteName(monsterName);
    setIsConfirmModalOpen(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteAllMonstersRequest = () => {
    if (confirmLevel === 0) {
      setDeleteAllConfirmMessage('¿Estás seguro de que quieres eliminar TODOS los monstruos? Haz clic de nuevo para confirmar.');
      setConfirmLevel(1);
    } else if (confirmLevel === 1) {
      setDeleteAllConfirmMessage('Esta acción es IRREVERSIBLE. Haz clic de nuevo para la CONFIRMACIÓN FINAL.');
      setConfirmLevel(2);
    } else if (confirmLevel === 2) {
      setDeleteAllConfirmMessage('¡ÚLTIMA ADVERTENCIA! Todos los monstruos serán eliminados permanentemente.');
      setIsConfirmModalOpen(true); // Open the final confirmation modal
      setConfirmLevel(3); // Set level to 3, waiting for modal confirmation
    }
  };

  const confirmDeleteAllMonsters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/monsters`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setMonsters([]); // Clear all monsters from state
      fetchMonsters(); // Re-fetch to ensure data consistency (should be empty)
    } catch (error) {
      console.error('Error deleting all monsters:', error);
      alert(`Error al eliminar todos los monstruos: ${error.message}`);
    } finally {
      setConfirmLevel(0); // Reset confirmation level
      setDeleteAllConfirmMessage(''); // Clear message
      setIsConfirmModalOpen(false); // Close modal
    }
  };

  const handleFilterChange = (setter) => (e) => {
    if (e.target.multiple) {
      const { options } = e.target;
      const value = [];
      for (let i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) {
          value.push(options[i].value);
        }
      }
      setter(value);
    } else {
      setter(e.target.value);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleImportMonsters = async () => {
    if (!ipcRenderer) {
      alert("La importación de Excel solo está disponible en la aplicación de escritorio.");
      return;
    };
    setIsImporting(true);
    ipcRenderer.send('import-monsters-from-excel');
  };

  const handleExportMonsters = async () => {
    if (!ipcRenderer) {
      alert("La exportación a Excel solo está disponible en la aplicación de escritorio.");
      return;
    }
    setIsExporting(true);
    // Fetch current monsters from the backend before exporting
    try {
      const response = await fetch(`${API_BASE_URL}/monsters`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const monstersToExport = await response.json();
      ipcRenderer.send('export-monsters-to-excel', monstersToExport);
    } catch (error) {
      console.error('Error fetching monsters for export:', error);
      // Removed alert here
      setIsExporting(false);
    }
  };

  const handleOpenMonsterSheet = (monster) => {
    setMonsterToShow(monster);
    setIsSheetModalOpen(true);
  };

  const filteredMonsters = monsters.filter(monster => {
    const nameMatch = monster.name.toLowerCase().includes(searchTerm.toLowerCase());

    const vdMatch = filterVd.length === 0 || filterVd.includes(monster.vd);
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

  return (
    <div className="bestiary-container">
      <h2>Bestiario</h2>
      <div className="bestiary-controls">
        <button onClick={handleOpenAddModal}>Añadir Monstruo</button>
        <button onClick={handleImportMonsters} disabled={isImporting}>
          {isImporting ? 'Importando...' : 'Importar desde Excel'}
        </button>
        <button onClick={handleExportMonsters} disabled={isExporting}>
          {isExporting ? 'Exportando...' : 'Exportar a Excel'}
        </button>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="monster-search-input"
        />
        <button onClick={toggleFilters} className="toggle-filters-button">
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {showFilters && (
        <div className="bestiary-filters">
          <div className="filter-group">
            <label htmlFor="filterVd">VD:</label>
            <MultiSelectFilter
              options={uniqueVd}
              selectedValues={filterVd}
              onChange={setFilterVd}
              placeholder="VD"
            />
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

      <div className="monster-list">
        {filteredMonsters.length === 0 ? (
          <p>No hay monstruos que coincidan con la búsqueda o los filtros.</p>
        ) : (
          filteredMonsters.map(monster => (
            <div key={monster.id} className="monster-list-item" onClick={() => handleOpenMonsterSheet(monster)}>
              <MonsterCard
                monster={monster}
                onDelete={handleDeleteMonster}
                monsterImage={monster.image}
              />
            </div>
          ))
        )}
      </div>

      <div className="bestiary-footer-controls">
        <button 
          onClick={handleDeleteAllMonstersRequest}
          className="delete-all-monsters-btn"
        >
          Eliminar Todos los Monstruos
        </button>
        {confirmLevel > 0 && confirmLevel < 3 && (
          <p className="delete-all-warning-message">{deleteAllConfirmMessage}</p>
        )}
      </div>

      {isAddModalOpen && (
        <AddMonsterModal
          onClose={handleCloseAddModal}
          onAddMonster={handleAddMonster}
        />
      )}

      {isSheetModalOpen && monsterToShow && (
        <MonsterSheetModal
          onClose={handleCloseSheetModal}
          monster={monsterToShow}
          onDelete={handleDeleteMonster}
          onUpdateMonster={handleUpdateMonster}
        />
      )}

      {isConfirmModalOpen && (
        <ConfirmModal
          message={confirmLevel === 3 ? deleteAllConfirmMessage : `¿Estás seguro de que quieres eliminar a "${monsterToDeleteName}"?`}
          onConfirm={confirmLevel === 3 ? confirmDeleteAllMonsters : confirmDeletion}
          onCancel={cancelDeletion}
        />
      )}
    </div>
  );
}

export default Bestiary;