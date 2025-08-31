import React from 'react';
import './CharacterSheetDisplay.css';

function CharacterSheetDisplay({ character, currentHp, maxHp, tempHp }) { // Added currentHp, maxHp, tempHp props
  if (!character) {
    return <p>No character data available.</p>;
  }

  const renderField = (label, value) => {
    return <p><strong>{label}:</strong> {value || 'N/A'}</p>;
  };

  const renderImage = () => {
    if (character.image) {
      if (character.image.startsWith('data:image')) {
        return <img src={character.image} alt={character.name} className="character-sheet-image" />;
      } else {
        return <img src={character.image} alt={character.name} className="character-sheet-image" />;
      }
    }
    return null;
  };

  // Use props for HP if provided, otherwise fall back to character object
  const displayMaxHp = maxHp !== undefined ? maxHp : (character.maxHitPoints || 0);
  const displayCurrentHp = currentHp !== undefined ? currentHp : (character.currentHitPoints || 0);
  const displayTempHp = tempHp !== undefined ? tempHp : (character.temporaryHitPoints || 0);

  const currentHpPercentage = displayMaxHp > 0 ? (displayCurrentHp / displayMaxHp) * 100 : 0;

  return (
    <div className="character-sheet-display">
      <h3>{character.name}</h3>
      {renderImage() && (
        <div className="character-image-container">
          {renderImage()}
        </div>
      )}
      <div className="character-info-grid-display">
        <div className="detail-group-display">
          {renderField('Clase', character.class)}
          {renderField('Nivel', character.level)}
          {renderField('Trasfondo', character.background)}
          {renderField('Raza', character.race)}
          {renderField('Alineamiento', character.alignment)}
          {renderField('Nombre del Jugador', character.playerName)}
          {renderField('Puntos de Experiencia', character.experiencePoints)}
        </div>

        <div className="detail-group-display">
          <h4>Atributos</h4>
          {renderField('Fuerza', character.strength)}
          {renderField('Destreza', character.dexterity)}
          {renderField('Constitución', character.constitution)}
          {renderField('Inteligencia', character.intelligence)}
          {renderField('Sabiduría', character.wisdom)}
          {renderField('Carisma', character.charisma)}
        </div>

        <div className="detail-group-display">
          {renderField('Bonificación por Competencia', character.proficiencyBonus)}
          {renderField('Clase de Armadura', character.armorClass)}
          {renderField('Iniciativa', character.initiative)}
          {renderField('Velocidad', character.speed)}
        </div>

        <div className="detail-group-display full-width-display">
          <h4>Puntos de Golpe</h4>
          <div className="health-bar-group-container">
            <div className="main-hp-bar-container">
              <div className="health-bar-red" style={{ width: `${currentHpPercentage}%` }}></div>
              <span className="hp-text">{displayCurrentHp} / {displayMaxHp}</span>
            </div>
            {displayTempHp > 0 && (
              <div className="temp-hp-bar-container" style={{ width: `${(displayTempHp / displayMaxHp) * 100}%` }}>
                <div className="health-bar-temp"></div>
                <span className="hp-text-temp">+{displayTempHp}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-group-display full-width-display">
          {renderField('Dados de Golpe', character.hitDice)}
          {renderField('Otras Competencias e Idiomas', character.otherProficienciesAndLanguages)}
          {renderField('Equipo', character.equipment)}
          {renderField('Rasgos y Atributos', character.featuresAndTraits)}
        </div>

        <div className="detail-group-display">
          <h4>Descripción Física</h4>
          {renderField('Edad', character.age)}
          {renderField('Altura', character.height)}
          {renderField('Peso', character.weight)}
          {renderField('Ojos', character.eyes)}
          {renderField('Piel', character.skin)}
          {renderField('Pelo', character.hair)}
        </div>

        <div className="detail-group-display">
          <h4>Aptitud Mágica</h4>
          {renderField('Aptitud Mágica', character.spellcastingAbility)}
          {renderField('CD Tirada de Salvación de Conjuros', character.spellSaveDC)}
          {renderField('Bonificador de Ataque de Conjuro', character.spellAttackBonus)}
        </div>

        <div className="detail-group-display full-width-display">
          {renderField('Campaña', character.campaign_name)}
        </div>
      </div>
    </div>
  );
}

export default CharacterSheetDisplay;