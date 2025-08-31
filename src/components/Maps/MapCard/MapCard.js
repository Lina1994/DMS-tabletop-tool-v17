import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MapCard.css';

const MapCard = ({ map, onOpenSheet, onDisplay, onEdit, onDelete, openSettingsMenu, onToggleSettingsMenu }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  console.log(`MapCard: ${map.name} (ID: ${map.id}) - openSettingsMenu: ${openSettingsMenu}`);

  const getMapImageSource = useCallback((map) => {
    if (map.image_data) {
      return map.image_data; // Base64 string
    }
    return ''; // No image source
  }, []);

  const imageSource = getMapImageSource(map);

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

  return (
    <li 
      ref={cardRef} 
      className="map-item" 
      style={{ backgroundImage: isVisible && imageSource ? `url('${imageSource.replace(/\\/g, '/')}')` : 'none' }}
    >
      <div className="map-info-container" onClick={() => onOpenSheet(map)}>
        {isVisible && imageSource && (
          <img src={imageSource} alt={map.name} className="map-thumbnail" loading="lazy" />
        )}
        <div className="map-details">
          <h3>{map.name}</h3>
          {map.group_name && <p>Grupo: {map.group_name}</p>}
        </div>
      </div>
      <div className="map-actions">
        <button onClick={() => onDisplay(map)} className="display-map-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-up-circle"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>
        </button>
        <div className="settings-menu-container">
          <button onClick={() => onToggleSettingsMenu(map.id)} className="settings-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-settings" style={{ width: '18px', height: '18px' }}>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 6.2 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          {openSettingsMenu === map.id && (
            <div className="settings-dropdown">
              <button onClick={() => { onEdit(map); onToggleSettingsMenu(null); }}>Editar</button>
              <button onClick={() => { onDelete(map); onToggleSettingsMenu(null); }}>Eliminar</button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default MapCard;
