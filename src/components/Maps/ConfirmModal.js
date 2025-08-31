import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-modal">
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onConfirm} className="confirm-btn">Confirmar</button>
          <button onClick={onCancel} className="cancel-btn">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;