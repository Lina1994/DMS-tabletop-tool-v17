import React from 'react';
import './SpellSheetModal.css';

function SpellSheetModal({ spell, onClose, onEdit, onDelete }) {
  if (!spell) return null;

  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal-backdrop') {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{spell.name}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p><strong>Escuela:</strong> {spell.school}</p>
          <p><strong>Nivel:</strong> {spell.level}</p>
          <p><strong>Alcance:</strong> {spell.range}</p>
          <p><strong>Duración:</strong> {spell.duration}</p>
          <p><strong>Coste:</strong> {spell.cost}</p>
          <p><strong>Ritual:</strong> {spell.is_ritual ? 'Sí' : 'No'}</p>
          <p><strong>Concentración:</strong> {spell.requires_concentration ? 'Sí' : 'No'}</p>
          <p><strong>Material:</strong> {spell.has_material_components ? 'Sí' : 'No'}</p>
          <p><strong>Componentes:</strong> {spell.components}</p>
          <p><strong>Clases:</strong> {spell.classes}</p>
          <p><strong>Descripción:</strong> {spell.description}</p>
          <p><strong>Daño / Ataque:</strong> {spell.damage_attack}</p>
          <p><strong>Área de Efecto:</strong> {spell.aoe}</p>
          <p><strong>Clase de Dificultad:</strong> {spell.saving_throw}</p>
          <p><strong>Lanzamiento a Nivel Superior:</strong> {spell.higher_level_casting}</p>
        </div>
        <div className="modal-footer">
          <button className="button edit-button" onClick={() => onEdit(spell)}>Editar</button>
          <button className="button delete-button" onClick={() => onDelete(spell.id)}>Eliminar</button>
          <button className="button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default SpellSheetModal;
