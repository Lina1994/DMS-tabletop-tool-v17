import React, { useState, useEffect, useRef } from 'react';
import './MonsterSheetModal.css';

function MonsterSheetModal({ onClose, monster, onUpdateMonster, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMonster, setEditedMonster] = useState(monster);
  const modalRef = useRef(null);

  useEffect(() => {
    setEditedMonster(monster);
  }, [monster]);

  useEffect(() => {
    if (modalRef.current) {
      const styles = window.getComputedStyle(modalRef.current);
      console.log('Modal classes:', modalRef.current.className);
      console.log('Modal width:', styles.width);
      console.log('Modal max-width:', styles.maxWidth);
    }
  }, [monster]);

  if (!monster) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedMonster(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSave = () => {
    onUpdateMonster(editedMonster);
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    setEditedMonster(monster); // Reset to original monster data
    setIsEditing(false);
  };

  const renderField = (label, name, value) => {
    if (isEditing) {
      return (
        <div className="form-group">
          <label htmlFor={name}>{label}:</label>
          {name === 'traits' || name === 'actions' || name === 'legendaryActions' || name === 'reactions' || name === 'description' ? (
            <textarea id={name} name={name} value={value || ''} onChange={handleChange}></textarea>
          ) : (
            <input type="text" id={name} name={name} value={value || ''} onChange={handleChange} />
          )}
        </div>
      );
    } else {
      return <p><strong>{label}:</strong> {value}</p>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={modalRef} className="modal-content monster-sheet-modal-content" onClick={(e) => e.stopPropagation()}>
        {isEditing ? (
          <input type="text" name="name" value={editedMonster.name || ''} onChange={handleChange} className="monster-name-edit" />
        ) : (
          <h2>{monster.name}</h2>
        )}
        <div className="monster-details-grid">
          {monster.image && (
            <div className="monster-image-container">
              <img src={monster.image} alt={monster.name} className="monster-image-sheet" />
            </div>
          )}
          <div className="detail-group">
            {renderField('VD', 'vd', editedMonster.vd)}
            {renderField('Tipo', 'type', editedMonster.type)}
            {renderField('Alineamiento', 'alignment', editedMonster.alignment)}
            {renderField('Origen', 'origin', editedMonster.origin)}
            {renderField('Tamaño', 'size', editedMonster.size)}
            {renderField('PX', 'px', editedMonster.px)}
            {renderField('Armadura', 'armor', editedMonster.armor)}
            {renderField('Puntos de golpe', 'hp', editedMonster.hp)}
            {renderField('Velocidad', 'speed', editedMonster.speed)}
          </div>

          <div className="detail-group">
            <h3>Estadísticas</h3>
            {renderField('FUE', 'str', editedMonster.str)}
            {renderField('DES', 'dex', editedMonster.dex)}
            {renderField('CONS', 'con', editedMonster.con)}
            {renderField('INT', 'int', editedMonster.int)}
            {renderField('SAB', 'wis', editedMonster.wis)}
            {renderField('CAR', 'car', editedMonster.car)}
          </div>

          <div className="detail-group full-width">
            {renderField('Tiradas de salvación', 'savingThrows', editedMonster.savingThrows)}
            {renderField('Habilidades', 'skills', editedMonster.skills)}
            {renderField('Sentidos', 'senses', editedMonster.senses)}
            {renderField('Idiomas', 'languages', editedMonster.languages)}
            {renderField('Resistencias al daño', 'damageResistances', editedMonster.damageResistances)}
            {renderField('Inmunidades al daño', 'damageImmunities', editedMonster.damageImmunities)}
            {renderField('Inmunidades al estado', 'conditionImmunities', editedMonster.conditionImmunities)}
            {renderField('Vulnerabilidades al daño', 'damageVulnerabilities', editedMonster.damageVulnerabilities)}
          </div>

          <div className="detail-group full-width">
            <h3>Rasgos</h3>
            {renderField('Rasgos', 'traits', editedMonster.traits)}
          </div>
          <div className="detail-group full-width">
            <h3>Acciones</h3>
            {renderField('Acciones', 'actions', editedMonster.actions)}
          </div>
          <div className="detail-group full-width">
            <h3>Acciones legendarias</h3>
            {renderField('Acciones legendarias', 'legendaryActions', editedMonster.legendaryActions)}
          </div>
          <div className="detail-group full-width">
            <h3>Reacciones</h3>
            {renderField('Reacciones', 'reactions', editedMonster.reactions)}
          </div>
          <div className="detail-group full-width">
            <h3>Descripción</h3>
            {renderField('Descripción', 'description', editedMonster.description)}
          </div>
          {isEditing && (
            <div className="detail-group full-width">
              {renderField('URL de la Imagen', 'image', editedMonster.image)}
            </div>
          )}
        </div>
        <div className="modal-actions">
          {isEditing ? (
            <>
              <button type="button" onClick={handleSave}>Guardar</button>
              <button type="button" onClick={handleCancel}>Cancelar</button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)}>Editar</button>
          )}
          <button type="button" onClick={() => onDelete(monster.id, monster.name)}>Eliminar</button>
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default MonsterSheetModal;
