import React from 'react';
import './MonsterSheetDisplay.css';

function MonsterSheetDisplay({ monster, currentHp, maxHp }) { // Added currentHp, maxHp props
  if (!monster) {
    return <p>No monster data available.</p>;
  }

  // Helper function to render a field, similar to MonsterSheetModal's renderField but without editing
  const renderField = (label, value) => {
    return <p><strong>{label}:</strong> {value || 'N/A'}</p>;
  };

  return (
    <div className="monster-sheet-display">
      <h3>{monster.name}</h3>
      {monster.image && (
        <div className="monster-image-container">
          <img src={monster.image} alt={monster.name} className="monster-image-sheet" />
        </div>
      )}
      <div className="monster-details-grid-display">
        <div className="detail-group-display">
          {renderField('VD', monster.vd)}
          {renderField('Tipo', monster.type)}
          {renderField('Alineamiento', monster.alignment)}
          {renderField('Origen', monster.origin)}
          {renderField('Tamaño', monster.size)}
          {renderField('PX', monster.px)}
          {renderField('Armadura', monster.armor || 'N/A')}
          {renderField('Puntos de golpe', monster.hp || 'N/A')}
          {renderField('Velocidad', monster.speed)}
        </div>

        <div className="detail-group-display">
          <h4>Estadísticas</h4>
          {renderField('FUE', `${monster.str} (${monster.str_mod})`)}
          {renderField('DES', `${monster.dex} (${monster.dex_mod})`)}
          {renderField('CONS', `${monster.con} (${monster.con_mod})`)}
          {renderField('INT', `${monster.int} (${monster.int_mod})`)}
          {renderField('SAB', `${monster.wis} (${monster.wis_mod})`)}
          {renderField('CAR', `${monster.car} (${monster.car_mod})`)}
        </div>

        <div className="detail-group-display full-width-display">
          {renderField('Tiradas de salvación', monster.savingThrows)}
          {renderField('Habilidades', monster.skills)}
          {renderField('Sentidos', monster.senses)}
          {renderField('Idiomas', monster.languages)}
          {renderField('Resistencias al daño', monster.damageResistances)}
          {renderField('Inmunidades al daño', monster.damageImmunities)}
          {renderField('Inmunidades al estado', monster.conditionImmunities)}
          {renderField('Vulnerabilidades al daño', monster.damageVulnerabilities)}
        </div>

        <div className="detail-group-display full-width-display">
          <h4>Rasgos</h4>
          <p className="pre-formatted-text">{monster.traits || 'N/A'}</p>
        </div>
        <div className="detail-group-display full-width-display">
          <h4>Acciones</h4>
          <p className="pre-formatted-text">{monster.actions || 'N/A'}</p>
        </div>
        <div className="detail-group-display full-width-display">
          <h4>Acciones legendarias</h4>
          <p className="pre-formatted-text">{monster.legendaryActions || 'N/A'}</p>
        </div>
        <div className="detail-group-display full-width-display">
          <h4>Reacciones</h4>
          <p className="pre-formatted-text">{monster.reactions || 'N/A'}</p>
        </div>
        <div className="detail-group-display full-width-display">
          <h4>Descripción</h4>
          <p className="pre-formatted-text">{monster.description || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

export default MonsterSheetDisplay;