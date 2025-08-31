import React from 'react';
import './CharacterSheetModal.css';

function CharacterSheetModal({ onClose, character }) {
  if (!character) return null;

  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('modal-overlay')) {
      onClose();
    }
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

  // Calculate HP bar widths
  const maxHp = character.maxHitPoints || 0;
  const currentHp = character.currentHitPoints || 0;
  const tempHp = character.temporaryHitPoints || 0;

  const currentHpPercentage = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content wide-modal-content">
        <h2>Detalles del Personaje</h2>
        <form>
          <div className="character-info-grid">
            <div className="form-group character-name-field">
              <label htmlFor="name">Nombre del Personaje:</label>
              <p>{character.name || 'N/A'}</p>
            </div>

            <div className="form-group">
              <label htmlFor="charClass">Clase:</label>
              <p>{character.class || 'N/A'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="level">Nivel:</label>
              <p>{character.level || 'N/A'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="background">Trasfondo:</label>
              <p>{character.background || 'N/A'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="race">Raza:</label>
              <p>{character.race || 'N/A'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="alignment">Alineamiento:</label>
              <p>{character.alignment || 'N/A'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="playerName">Nombre del Jugador:</label>
              <p>{character.playerName || 'N/A'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="experiencePoints">Puntos de Experiencia:</label>
              <p>{character.experiencePoints || 'N/A'}</p>
            </div>
          </div>

          {/* Abilities */}
          <fieldset>
            <legend>Atributos</legend>
            <div className="form-group-inline">
              <label htmlFor="strength">Fuerza:</label>
              <p>{character.strength || 'N/A'}</p>
              <label htmlFor="dexterity">Destreza:</label>
              <p>{character.dexterity || 'N/A'}</p>
              <label htmlFor="constitution">Constitución:</label>
              <p>{character.constitution || 'N/A'}</p>
              <label htmlFor="intelligence">Inteligencia:</label>
              <p>{character.intelligence || 'N/A'}</p>
              <label htmlFor="wisdom">Sabiduría:</label>
              <p>{character.wisdom || 'N/A'}</p>
              <label htmlFor="charisma">Carisma:</label>
              <p>{character.charisma || 'N/A'}</p>
            </div>
          </fieldset>

          <div className="form-group-inline">
            <label htmlFor="proficiencyBonus">Bonificación por Competencia:</label>
            <p>{character.proficiencyBonus || 'N/A'}</p>
            <label htmlFor="armorClass">Clase de Armadura:</label>
            <p>{character.armorClass || 'N/A'}</p>
            <label htmlFor="initiative">Iniciativa:</label>
            <p>{character.initiative || 'N/A'}</p>
            <label htmlFor="speed">Velocidad:</label>
            <p>{character.speed || 'N/A'}</p>
          </div>

          {/* Health Bar */}
          <div className="form-group">
            <label>Puntos de Golpe:</label>
            <div className="health-bar-group-container"> {/* New container for both bars */}
              <div className="main-hp-bar-container">
                <div className="health-bar-red" style={{ width: `${currentHpPercentage}%` }}></div>
                <span className="hp-text">{currentHp} / {maxHp}</span>
              </div>
              {tempHp > 0 && (
                <div className="temp-hp-bar-container" style={{ width: `${(tempHp / maxHp) * 100}%` }}>
                  <div className="health-bar-temp"></div>
                  <span className="hp-text-temp">+{tempHp}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="hitDice">Dados de Golpe:</label>
            <p>{character.hitDice || 'N/A'}</p>
          </div>
          <div className="form-group">
            <label htmlFor="otherProficienciesAndLanguages">Otras Competencias e Idiomas:</label>
            <p>{character.otherProficienciesAndLanguages || 'N/A'}</p>
          </div>
          <div className="form-group">
            <label htmlFor="equipment">Equipo:</label>
            <p>{character.equipment || 'N/A'}</p>
          </div>
          <div className="form-group">
            <label htmlFor="featuresAndTraits">Rasgos y Atributos:</label>
            <p>{character.featuresAndTraits || 'N/A'}</p>
          </div>

          {/* Physical Description */}
          <fieldset>
            <legend>Descripción Física</legend>
            <div className="form-group-inline">
              <label htmlFor="age">Edad:</label>
              <p>{character.age || 'N/A'}</p>
              <label htmlFor="height">Altura:</label>
              <p>{character.height || 'N/A'}</p>
              <label htmlFor="weight">Peso:</label>
              <p>{character.weight || 'N/A'}</p>
            </div>
            <div className="form-group-inline">
              <label htmlFor="eyes">Ojos:</label>
              <p>{character.eyes || 'N/A'}</p>
              <label htmlFor="skin">Piel:</label>
              <p>{character.skin || 'N/A'}</p>
              <label htmlFor="hair">Pelo:</label>
              <p>{character.hair || 'N/A'}</p>
            </div>
          </fieldset>

          {/* Image */}
          <div className="form-group">
            <label>Imagen:</label>
            {renderImage() || <p>N/A</p>}
          </div>

          {/* Spellcasting */}
          <fieldset>
            <legend>Aptitud Mágica</legend>
            <div className="form-group">
              <label htmlFor="spellcastingAbility">Aptitud Mágica:</label>
              <p>{character.spellcastingAbility || 'N/A'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="spellSaveDC">CD Tirada de Salvación de Conjuros:</label>
              <p>{character.spellSaveDC || 'N/A'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="spellAttackBonus">Bonificador de Ataque de Conjuro:</label>
              <p>{character.spellAttackBonus || 'N/A'}</p>
            </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="campaign">Campaña:</label>
            <p>{character.campaign_name || 'N/A'}</p>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cerrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CharacterSheetModal;