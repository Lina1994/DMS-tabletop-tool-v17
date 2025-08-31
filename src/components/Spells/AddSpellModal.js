import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './AddSpellModal.css';

function AddSpellModal({ onAddSpell, onClose }) {
  const [spellData, setSpellData] = useState({
    name: '',
    school: '',
    level: '',
    range: '',
    duration: '',
    cost: '',
    is_ritual: false,
    requires_concentration: false,
    has_material_components: false,
    components: '',
    classes: '',
    description: '',
    damage_attack: '',
    aoe: '',
    saving_throw: '',
    higher_level_casting: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSpellData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!spellData.name) {
      alert('El nombre del hechizo es obligatorio.');
      return;
    }
    onAddSpell({ ...spellData, id: uuidv4() });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Añadir Nuevo Hechizo</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre:</label>
            <input type="text" id="name" name="name" value={spellData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="school">Escuela:</label>
            <input type="text" id="school" name="school" value={spellData.school} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="level">Nivel:</label>
            <input type="number" id="level" name="level" value={spellData.level} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="range">Alcance:</label>
            <input type="text" id="range" name="range" value={spellData.range} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="duration">Duración:</label>
            <input type="text" id="duration" name="duration" value={spellData.duration} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="cost">Coste:</label>
            <input type="text" id="cost" name="cost" value={spellData.cost} onChange={handleChange} />
          </div>
          <div className="form-group checkbox-group">
            <input type="checkbox" id="is_ritual" name="is_ritual" checked={spellData.is_ritual} onChange={handleChange} />
            <label htmlFor="is_ritual">Ritual</label>
          </div>
          <div className="form-group checkbox-group">
            <input type="checkbox" id="requires_concentration" name="requires_concentration" checked={spellData.requires_concentration} onChange={handleChange} />
            <label htmlFor="requires_concentration">Concentración</label>
          </div>
          <div className="form-group checkbox-group">
            <input type="checkbox" id="has_material_components" name="has_material_components" checked={spellData.has_material_components} onChange={handleChange} />
            <label htmlFor="has_material_components">Material</label>
          </div>
          <div className="form-group">
            <label htmlFor="components">Componentes:</label>
            <input type="text" id="components" name="components" value={spellData.components} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="classes">Clases:</label>
            <input type="text" id="classes" name="classes" value={spellData.classes} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="description">Descripción:</label>
            <textarea id="description" name="description" value={spellData.description} onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="damage_attack">Daño / Ataque:</label>
            <input type="text" id="damage_attack" name="damage_attack" value={spellData.damage_attack} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="aoe">Área de Efecto:</label>
            <input type="text" id="aoe" name="aoe" value={spellData.aoe} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="saving_throw">Clase de Dificultad:</label>
            <input type="text" id="saving_throw" name="saving_throw" value={spellData.saving_throw} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="higher_level_casting">Lanzamiento a Nivel Superior:</label>
            <textarea id="higher_level_casting" name="higher_level_casting" value={spellData.higher_level_casting} onChange={handleChange}></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="button primary">Añadir Hechizo</button>
            <button type="button" className="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSpellModal;