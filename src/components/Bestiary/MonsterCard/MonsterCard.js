import React, { useState, useEffect, useRef } from 'react';
import './MonsterCard.css';

function MonsterCard({ monster, monsterImage }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px 0px 100px 0px', // Pre-load images 100px before they enter the viewport
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      const currentCardRef = cardRef.current;
      if (currentCardRef) {
        observer.unobserve(currentCardRef);
      }
    };
  }, []);

  const cardStyle = {
    backgroundImage: isVisible && monsterImage ? `url(${monsterImage})` : 'none',
  };

  return (
    <div className="monster-card" ref={cardRef} style={cardStyle}>
      {isVisible && monster.image && (
        <img src={monster.image} alt={monster.name} className="monster-thumbnail" loading="lazy" />
      )}
      <div className="monster-info">
        <h3>{monster.name}</h3>
        <p><strong>VD:</strong> {monster.vd}</p>
        <p><strong>Tipo:</strong> {monster.type}</p>
        <p><strong>Alineamiento:</strong> {monster.alignment}</p>
      </div>
    </div>
  );
}

export default MonsterCard;