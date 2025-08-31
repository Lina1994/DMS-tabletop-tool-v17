import React, { useState, useEffect, useMemo } from 'react';
import SpellCard from './SpellCard/SpellCard';
import AddSpellModal from './AddSpellModal';
import EditSpellModal from './EditSpellModal';
import SpellSheetModal from './SpellSheetModal';
import ConfirmModal from '../Maps/ConfirmModal';
import InfoModal from '../shared/InfoModal/InfoModal';
import MultiSelectFilter from './MultiSelectFilter'; 
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import './Spells.css';
import API_BASE_URL from '../../apiConfig';

function Spells() {
  const [spells, setSpells] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [spellToDelete, setSpellToDelete] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteAllConfirmModal, setShowDeleteAllConfirmModal] = useState(false);
  const [confirmDeleteAllLevel, setConfirmDeleteAllLevel] = useState(0);
  const [deleteAllConfirmMessage, setDeleteAllConfirmMessage] = useState('');

  // Filter states
  const [filterSchool, setFilterSchool] = useState([]);
  const [filterLevel, setFilterLevel] = useState([]);
  const [filterClasses, setFilterClasses] = useState([]);
  const [filterRitual, setFilterRitual] = useState([]);
  const [filterConcentration, setFilterConcentration] = useState([]);
  const [filterComponents, setFilterComponents] = useState([]);

  useEffect(() => {
    fetchSpells();
  }, []);

  const fetchSpells = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/spells`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSpells(data);
    } catch (error) {
      console.error("Error fetching spells:", error);
    }
  };

  const uniqueSchools = useMemo(() => {
    const values = new Set(spells.map(s => s.school).filter(Boolean));
    return Array.from(values).sort().map(v => ({ value: v, label: v }));
  }, [spells]);

  const uniqueLevels = useMemo(() => {
    const values = new Set(spells.map(s => s.level).filter(Boolean));
    return Array.from(values).sort((a, b) => a - b).map(v => ({ value: v, label: `Nivel ${v}` }));
  }, [spells]);

  const uniqueClasses = useMemo(() => {
    const values = new Set();
    spells.forEach(s => {
      if (s.classes) {
        s.classes.split(',').forEach(c => values.add(c.trim()));
      }
    });
    return Array.from(values).sort().map(v => ({ value: v, label: v }));
  }, [spells]);

  const uniqueComponents = useMemo(() => {
    const values = new Set();
    spells.forEach(s => {
        if (s.components) {
            s.components.split(',').forEach(c => values.add(c.trim()));
        }
    });
    return Array.from(values).sort().map(v => ({ value: v, label: v }));
  }, [spells]);

  const ritualOptions = [{ value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' }];
  const concentrationOptions = [{ value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' }];

  const handleAddSpell = async (newSpell) => {
    try {
      const response = await fetch(`${API_BASE_URL}/spells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpell),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      fetchSpells();
    } catch (error) {
      console.error("Error adding spell:", error);
    }
  };

  const handleEditSpell = async (updatedSpell) => {
    try {
      const response = await fetch(`${API_BASE_URL}/spells/${updatedSpell.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSpell),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      fetchSpells();
    } catch (error) {
      console.error("Error updating spell:", error);
    }
  };

  const handleDeleteSpell = async (spellId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/spells/${spellId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      fetchSpells();
    } catch (error) {
      console.error("Error deleting spell:", error);
    }
  };

  const confirmDelete = (spellId) => {
    setSpellToDelete(spellId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    handleDeleteSpell(spellToDelete);
    setShowConfirmModal(false);
    setSpellToDelete(null);
    setShowSheetModal(false);
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setSpellToDelete(null);
  };

  const handleImportSpells = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const formattedSpells = json.map(row => ({
          id: uuidv4(),
          name: row['Nombre'] || '',
          school: row['Escuela'] || '',
          level: row['Nivel'] ?? '',
          range: row['Alcance'] || '',
          duration: row['Duración'] || '',
          cost: row['Coste'] || '',
          is_ritual: row['Ritual'] === 'Sí' || row['Ritual'] === true,
          requires_concentration: row['Concentración'] === 'Sí' || row['Concentración'] === true,
          has_material_components: row['Material'] === 'Sí' || row['Material'] === true,
          components: row['Componentes'] || '',
          classes: row['Clases'] || '',
          description: row['Descripción'] || '',
          damage_attack: row['Daño / Ataque'] || '',
          aoe: row['Área de Efecto'] || '',
          saving_throw: row['Clase de Dificultad'] || '',
          higher_level_casting: row['Lanzamiento a Nivel Superior'] || '',
        }));

        fetch(`${API_BASE_URL}/spells/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedSpells),
        })
          .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
          })
          .then(() => {
            setInfoModalMessage('Hechizos importados y sincronizados correctamente.');
            setShowInfoModal(true);
            fetchSpells();
          })
          .catch(error => {
            console.error("Error syncing spells:", error);
            setInfoModalMessage(`Error al importar hechizos: ${error.message}`);
            setShowInfoModal(true);
          });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleExportSpells = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/spells`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      const exportData = data.map(spell => ({
        'Nombre': spell.name,
        'Escuela': spell.school,
        'Nivel': spell.level,
        'Alcance': spell.range,
        'Duración': spell.duration,
        'Coste': spell.cost,
        'Ritual': spell.is_ritual ? 'Sí' : 'No',
        'Concentración': spell.requires_concentration ? 'Sí' : 'No',
        'Material': spell.has_material_components ? 'Sí' : 'No',
        'Componentes': spell.components,
        'Clases': spell.classes,
        'Descripción': spell.description,
        'Daño / Ataque': spell.damage_attack,
        'Área de Efecto': spell.aoe,
        'Clase de Dificultad': spell.saving_throw,
        'Lanzamiento a Nivel Superior': spell.higher_level_casting,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hechizos");
      XLSX.writeFile(workbook, "hechizos.xlsx");

    } catch (error) {
      console.error("Error exporting spells:", error);
      setInfoModalMessage(`Error al exportar hechizos: ${error.message}`);
      setShowInfoModal(true);
    }
  };

  const handleDeleteAllSpellsRequest = () => {
    if (confirmDeleteAllLevel === 0) {
      setDeleteAllConfirmMessage('¿Estás seguro de que quieres eliminar TODOS los hechizos? Haz clic de nuevo para confirmar.');
      setConfirmDeleteAllLevel(1);
    } else if (confirmDeleteAllLevel === 1) {
      setDeleteAllConfirmMessage('Esta acción es IRREVERSIBLE. Haz clic de nuevo para la CONFIRMACIÓN FINAL.');
      setConfirmDeleteAllLevel(2);
    } else if (confirmDeleteAllLevel === 2) {
      setDeleteAllConfirmMessage('¡ÚLTIMA ADVERTENCIA! Todos los hechizos serán eliminados permanentemente.');
      setShowDeleteAllConfirmModal(true);
      setConfirmDeleteAllLevel(3);
    }
  };

  const confirmDeleteAllSpells = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/spells`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchSpells();
    } catch (error) {
      console.error('Error deleting all spells:', error);
    } finally {
      setConfirmDeleteAllLevel(0);
      setDeleteAllConfirmMessage('');
      setShowDeleteAllConfirmModal(false);
    }
  };

  const cancelDeleteAllSpells = () => {
    setShowDeleteAllConfirmModal(false);
    setConfirmDeleteAllLevel(0);
    setDeleteAllConfirmMessage('');
  };

  const filteredSpells = useMemo(() => spells.filter(spell => {
    const nameMatch = spell.name.toLowerCase().includes(searchTerm.toLowerCase());
    const schoolMatch = filterSchool.length === 0 || filterSchool.includes(spell.school);
    const levelMatch = filterLevel.length === 0 || filterLevel.includes(spell.level);
    const classesMatch = filterClasses.length === 0 || filterClasses.some(c => spell.classes.includes(c));
    const ritualMatch = filterRitual.length === 0 || filterRitual.includes(spell.is_ritual ? 'yes' : 'no');
    const concentrationMatch = filterConcentration.length === 0 || filterConcentration.includes(spell.requires_concentration ? 'yes' : 'no');
    const componentsMatch = filterComponents.length === 0 || filterComponents.some(c => spell.components.includes(c));

    return nameMatch && schoolMatch && levelMatch && classesMatch && ritualMatch && concentrationMatch && componentsMatch;
  }), [spells, searchTerm, filterSchool, filterLevel, filterClasses, filterRitual, filterConcentration, filterComponents]);

  return (
    <div className="spells-container">
      <h1>Gestión de Hechizos</h1>
      <div className="spells-actions">
        <button className="button primary" onClick={() => setShowAddModal(true)}>Añadir Hechizo</button>
        <input
          type="file"
          id="import-spells"
          accept=".xlsx, .xls"
          onChange={handleImportSpells}
          style={{ display: 'none' }}
        />
        <label htmlFor="import-spells" className="button">Importar Hechizos</label>
        <button className="button" onClick={handleExportSpells}>Exportar Hechizos</button>
        <button onClick={() => setShowFilters(!showFilters)} className="button">
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      <div className="spell-search-bar">
        <input
          type="text"
          placeholder="Buscar hechizos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showFilters && (
        <div className="spells-filters">
          <div className="filter-group">
            <label>Escuela:</label>
            <MultiSelectFilter options={uniqueSchools} selectedValues={filterSchool} onChange={setFilterSchool} placeholder="Escuelas" />
          </div>
          <div className="filter-group">
            <label>Nivel:</label>
            <MultiSelectFilter options={uniqueLevels} selectedValues={filterLevel} onChange={setFilterLevel} placeholder="Niveles" />
          </div>
          <div className="filter-group">
            <label>Clases:</label>
            <MultiSelectFilter options={uniqueClasses} selectedValues={filterClasses} onChange={setFilterClasses} placeholder="Clases" />
          </div>
          <div className="filter-group">
            <label>Componentes:</label>
            <MultiSelectFilter options={uniqueComponents} selectedValues={filterComponents} onChange={setFilterComponents} placeholder="Componentes" />
          </div>
          <div className="filter-group">
            <label>Ritual:</label>
            <MultiSelectFilter options={ritualOptions} selectedValues={filterRitual} onChange={setFilterRitual} placeholder="Ritual" />
          </div>
          <div className="filter-group">
            <label>Concentración:</label>
            <MultiSelectFilter options={concentrationOptions} selectedValues={filterConcentration} onChange={setFilterConcentration} placeholder="Concentración" />
          </div>
        </div>
      )}

      <div className="spells-list">
        {filteredSpells.length === 0 ? (
          <p>No hay hechizos para mostrar. Añade algunos o impórtalos.</p>
        ) : (
          filteredSpells.map(spell => (
            <SpellCard
              key={spell.id}
              spell={spell}
              onClick={() => {
                setSelectedSpell(spell);
                setShowSheetModal(true);
              }}
            />
          ))
        )}
      </div>

      <div className="spells-footer-controls">
        <button 
          onClick={handleDeleteAllSpellsRequest}
          className="delete-all-spells-btn"
        >
          Eliminar Todos los Hechizos
        </button>
        {confirmDeleteAllLevel > 0 && confirmDeleteAllLevel < 3 && (
          <p className="delete-all-warning-message">{deleteAllConfirmMessage}</p>
        )}
      </div>

      {showAddModal && <AddSpellModal onAddSpell={handleAddSpell} onClose={() => setShowAddModal(false)} />}
      {showEditModal && selectedSpell && <EditSpellModal spell={selectedSpell} onEditSpell={handleEditSpell} onClose={() => setShowEditModal(false)} />}
      {showSheetModal && selectedSpell && <SpellSheetModal spell={selectedSpell} onClose={() => setShowSheetModal(false)} onEdit={() => { setShowSheetModal(false); setShowEditModal(true); }} onDelete={confirmDelete} />}
      {showConfirmModal && <ConfirmModal message="¿Estás seguro de que quieres eliminar este hechizo? Esta acción no se puede deshacer." onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />}
      {showDeleteAllConfirmModal && <ConfirmModal message={deleteAllConfirmMessage} onConfirm={confirmDeleteAllSpells} onCancel={cancelDeleteAllSpells} />}
      {showInfoModal && <InfoModal message={infoModalMessage} onClose={() => setShowInfoModal(false)} />}
    </div>
  );
}

export default Spells;