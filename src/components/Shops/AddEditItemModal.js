import React, { useState, useEffect } from 'react';
import './AddEditItemModal.css';

function AddEditItemModal({ item, category, onClose, onSave }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const initialFormData = {};
    if (category && category.columns) {
      category.columns.forEach(col => {
        initialFormData[col.name] = item && item[col.name] !== undefined ? item[col.name] : '';
        if (col.type === 'number' && initialFormData[col.name] === '') {
          initialFormData[col.name] = 0;
        } else if (col.type === 'boolean' && initialFormData[col.name] === '') {
          initialFormData[col.name] = false;
        }
      });
    }
    setFormData(initialFormData);
  }, [item, category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{item ? 'Editar' : 'Añadir'} {category?.name.slice(0, -1) || 'Elemento'}</h2>
        <form onSubmit={handleSubmit}>
          {category && category.columns && category.columns.map(col => {
            const inputType = col.type === 'number' ? 'number' : col.type === 'boolean' ? 'checkbox' : 'text';
            return (
              <div key={col.name} className="form-group">
                <label htmlFor={col.name}>{col.name}:</label>
                <input
                  type={inputType}
                  id={col.name}
                  name={col.name}
                  value={inputType !== 'checkbox' ? (formData[col.name] || '') : undefined}
                  checked={inputType === 'checkbox' ? (formData[col.name] || false) : undefined}
                  onChange={handleChange}
                  required={col.type !== 'boolean'} // Make non-boolean fields required by default
                />
              </div>
            );
          })}
          <div className="modal-actions">
            <button type="submit">Guardar</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditItemModal;
