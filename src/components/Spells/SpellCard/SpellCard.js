import React from 'react';
import './SpellCard.css';

function SpellCard({ spell, onClick }) {
  return (
    <div className="spell-card" onClick={() => onClick(spell)}>
      <h3>{spell.name}</h3>
      <p><strong>Nivel:</strong> {spell.level}</p>
      <p><strong>Escuela:</strong> {spell.school}</p>
    </div>
  );
}

export default SpellCard;