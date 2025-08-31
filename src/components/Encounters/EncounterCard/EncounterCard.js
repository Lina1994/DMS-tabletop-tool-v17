import React from 'react';
import './EncounterCard.css';
import { calculateEncounterDifficulty } from '../../../utils/difficultyCalculator';
import DifficultyProgressBar from '../DifficultyProgressBar/DifficultyProgressBar'; // Import the new component

function EncounterCard({ encounter, onEdit, onDelete }) {
  const difficultyData = calculateEncounterDifficulty(encounter.characters, encounter.monsters);

  return (
    <li className="encounter-card">
      <div className="encounter-info">
        <h3>{encounter.name}</h3>
        <div className="encounter-details">
          <p>Campaña: {encounter.campaign_name || 'Ninguna'}</p>
          <p>Monstruos: {encounter.monsters.length}</p>
          <p>Personajes: {encounter.characters.length}</p>
          <p>Dificultad: <strong>{difficultyData.difficulty}</strong></p> {/* Display the difficulty text */}
          {difficultyData.adjustedXP > 0 && difficultyData.allThresholds.easy > 0 && (
            <DifficultyProgressBar
              adjustedXP={difficultyData.adjustedXP}
              currentThreshold={difficultyData.currentThreshold}
              allThresholds={difficultyData.allThresholds}
              difficultyText={difficultyData.difficulty}
            />
          )}
        </div>
      </div>
      <div className="encounter-controls">
        <button onClick={() => onEdit(encounter)}>Editar</button>
        <button onClick={() => onDelete(encounter.id)}>Eliminar</button>
      </div>
    </li>
  );
}

export default EncounterCard;