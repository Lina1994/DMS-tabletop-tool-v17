import React from 'react';
import './InfoModal.css';

function InfoModal({ message, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content info-modal">
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="accept-btn">Aceptar</button>
        </div>
      </div>
    </div>
  );
}

export default InfoModal;