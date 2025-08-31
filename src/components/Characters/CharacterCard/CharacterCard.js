import React from 'react';
import './CharacterCard.css';

function CharacterCard({ character, onOpenSheet, onEdit, onDelete, canLevelUp }) {
  const renderImage = () => {
    if (character.image) {
      // Check if it's a base64 string (from file upload) or a URL
      if (character.image.startsWith('data:image')) {
        return <img src={character.image} alt={character.name} className="character-card-image" />;
      } else {
        return <img src={character.image} alt={character.name} className="character-card-image" />;
      }
    }
    return <div className="character-card-image-placeholder"></div>;
  };

  return (
    <li className="character-card">
      <div className="character-card-image-container">
        {renderImage()}
      </div>
      <div className="character-card-info">
        <h3>
          {character.name}
          {character.is_player_character ? (
            <span className="character-type-tag pc-tag">PC</span>
          ) : (
            <span className="character-type-tag npc-tag">NPC</span>
          )}
          {canLevelUp && <span className="levelup-indicator">lvUP</span>}
        </h3>
        <p><strong>Clase:</strong> {character.class || 'N/A'}</p>
        <p><strong>Nivel:</strong> {character.level || 'N/A'}</p>
        <p><strong>Campaña:</strong> {character.campaign_name || 'N/A'}</p>
      </div>
      <div className="character-card-actions">
        <button onClick={() => onOpenSheet(character)} className="view-btn">Ver Ficha</button>
        <button onClick={() => onEdit(character)} className="edit-btn">Editar</button>
        <button onClick={() => onDelete(character.id)} className="delete-btn">Eliminar</button>
      </div>
    </li>
  );
}

export default CharacterCard;