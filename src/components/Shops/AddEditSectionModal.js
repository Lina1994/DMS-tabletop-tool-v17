import React, { useState, useEffect } from 'react';
import './AddEditSectionModal.css';

function AddEditSectionModal({ section, onClose, onSave }) {
  const [sectionName, setSectionName] = useState('');
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (section) {
      setSectionName(section.name);
      setColumns(section.columns || []);
    } else {
      setSectionName('');
      setColumns([]);
    }
  }, [section]);

  const handleAddColumn = () => {
    setColumns([...columns, { name: '', type: 'text' }]);
  };

  const handleColumnNameChange = (index, value) => {
    const newColumns = [...columns];
    newColumns[index].name = value;
    setColumns(newColumns);
  };

  const handleColumnTypeChange = (index, value) => {
    const newColumns = [...columns];
    newColumns[index].type = value;
    setColumns(newColumns);
  };

  const handleRemoveColumn = (index) => {
    const newColumns = columns.filter((_, i) => i !== index);
    setColumns(newColumns);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...section, name: sectionName, columns });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{section ? 'Editar Sección' : 'Añadir Nueva Sección'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sectionName">Nombre de la Sección:</label>
            <input
              type="text"
              id="sectionName"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              required
            />
          </div>

          <h3>Columnas:</h3>
          <div className="columns-list">
            {columns.map((col, index) => (
              <div key={index} className="column-item">
                <input
                  type="text"
                  placeholder="Nombre de la Columna"
                  value={col.name}
                  onChange={(e) => handleColumnNameChange(index, e.target.value)}
                  required
                />
                <select
                  value={col.type}
                  onChange={(e) => handleColumnTypeChange(index, e.target.value)}
                >
                  <option value="text">Texto</option>
                  <option value="number">Número</option>
                  <option value="boolean">Booleano</option>
                </select>
                <button type="button" onClick={() => handleRemoveColumn(index)}>Eliminar</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddColumn}>Añadir Columna</button>

          <div className="modal-actions">
            <button type="submit">Guardar</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditSectionModal;
