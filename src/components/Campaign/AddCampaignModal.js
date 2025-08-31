import React, { useState } from 'react';
import './AddCampaignModal.css';

function AddCampaignModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [image_data, setImageData] = useState(null);
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [game, setGame] = useState('');
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const newCampaign = { name, image_data, description, author, game, participants, notes };
    onSave(newCampaign);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Add New Campaign</h2>
        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <input type="text" placeholder="Author" value={author} onChange={e => setAuthor(e.target.value)} />
        <input type="text" placeholder="Game" value={game} onChange={e => setGame(e.target.value)} />
        <textarea placeholder="Participants" value={participants} onChange={e => setParticipants(e.target.value)} />
        <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
        <div className="modal-actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AddCampaignModal;