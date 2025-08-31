import React, { useState, useEffect } from 'react';
import './EditCampaignModal.css';

function EditCampaignModal({ campaign, onSave, onClose }) {
  const [name, setName] = useState('');
  const [image_data, setImageData] = useState(null);
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [game, setGame] = useState('');
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || '');
      setImageData(campaign.image_data || null);
      setDescription(campaign.description || '');
      setAuthor(campaign.author || '');
      setGame(campaign.game || '');
      setParticipants(campaign.participants || '');
      setNotes(campaign.notes || '');
    }
  }, [campaign]);

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
    const updatedCampaign = { ...campaign, name, image_data, description, author, game, participants, notes };
    onSave(updatedCampaign);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Edit Campaign</h2>
        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        {image_data && <img src={image_data} alt="Campaign" style={{ maxWidth: '100px', maxHeight: '100px' }} />}
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

export default EditCampaignModal;