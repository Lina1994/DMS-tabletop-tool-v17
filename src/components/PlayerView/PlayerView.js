import React, { useState, useEffect } from 'react';
import './PlayerView.css';

const ipcRenderer = window.require && window.require('electron') ? window.require('electron').ipcRenderer : null;

function PlayerView() {
  const [currentMap, setCurrentMap] = useState(null);
  const [showGrid, setShowGrid] = useState(false); // New state for grid visibility
  const [gridSize, setGridSize] = useState(50); // New state for grid cell size, default 50px
  const [gridOffsetX, setGridOffsetX] = useState(0); // New state for grid X offset
  const [gridOffsetY, setGridOffsetY] = useState(0); // New state for grid Y offset

  useEffect(() => {
    if (ipcRenderer) {
      const handleUpdateMap = (event, mapData) => {
        setCurrentMap(mapData);
        setShowGrid(mapData.showGrid || false); // Update showGrid from mapData
        setGridSize(mapData.gridSize || 50); // Update gridSize from mapData
        setGridOffsetX(mapData.gridOffsetX || 0); // Update gridOffsetX from mapData
        setGridOffsetY(mapData.gridOffsetY || 0); // Update gridOffsetY from mapData
        console.log('PlayerView.js: Received update-player-map', mapData);
        console.log('PlayerView.js: image_data length:', mapData.image_data ? mapData.image_data.length : 'N/A');
        ipcRenderer.send('player-window-map-changed', mapData);
      };

      ipcRenderer.on('update-player-map', handleUpdateMap);

      return () => {
        ipcRenderer.removeListener('update-player-map', handleUpdateMap);
      };
    }
  }, []);

  useEffect(() => {
    const sendDimensions = () => {
      if (ipcRenderer) {
        ipcRenderer.send('player-window-resize', { 
          width: window.innerWidth, 
          height: window.innerHeight 
        });
      }
    };

    const interval = setInterval(sendDimensions, 1000); // Send dimensions every second

    // Also send dimensions on resize
    window.addEventListener('resize', sendDimensions);

    // Initial send
    sendDimensions();

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', sendDimensions);
    };
  }, []);

  const imageSource = currentMap ? (currentMap.image_data || currentMap.imageDataUrl || currentMap.imagePath || currentMap.url) : '';

  const getGridOverlayStyle = () => {
    const baseStyle = {
      backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
    };

    // Simplified square grid only
    console.log('PlayerView: Square Grid Style - gridSize:', gridSize, 'gridOffsetX:', gridOffsetX, 'gridOffsetY:', gridOffsetY);
    return {
      ...baseStyle,
      backgroundImage: `
        linear-gradient(to right, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 1px, transparent 1px)
      `,
      backgroundSize: `${gridSize}px ${gridSize}px`,
    };
  };

  return (
    <div className="player-view-container">
      {currentMap ? (
        <div className="map-display">
          {imageSource ? (
            <img
              src={imageSource}
              alt={currentMap.name}
              className="player-map-image"
              style={{
                transform: `translate(${currentMap.panX}px, ${currentMap.panY}px) scale(${currentMap.zoom}) rotate(${currentMap.rotation}deg)`,
              }}
            />
          ) : (
            <p>No hay imagen para mostrar.</p>
          )}
          {showGrid && (
            <div className="grid-overlay" style={getGridOverlayStyle()}></div>
          )}
        </div>
      ) : (
        <p>Esperando que el Master seleccione un mapa...</p>
      )}
    </div>
  );
}

export default PlayerView;
