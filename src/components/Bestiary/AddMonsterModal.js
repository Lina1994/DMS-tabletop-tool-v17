import React, { useState } from 'react';
import './AddMonsterModal.css';

function AddMonsterModal({ onClose, onAddMonster }) {
  const [monsterData, setMonsterData] = useState({
    name: '',
    vd: '',
    type: '',
    alignment: '',
    origin: '',
    size: '',
    px: '',
    armor: '',
    hp: '',
    speed: '',
    str: '',
    dex: '',
    con: '',
    int: '',
    wis: '',
    cha: '',
    savingThrows: '',
    skills: '',
    senses: '',
    languages: '',
    damageResistances: '',
    damageImmunities: '',
    conditionImmunities: '',
    damageVulnerabilities: '',
    traits: '',
    actions: '',
    legendaryActions: '',
    reactions: '',
    description: '',
    image: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMonsterData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddMonster(monsterData);
    onClose(); // Close modal after adding
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Añadir Nuevo Monstruo</h2>
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="form-group">
            <label htmlFor="name">Nombre:</label>
            <input type="text" id="name" name="name" value={monsterData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="vd">VD:</label>
            <input type="text" id="vd" name="vd" value={monsterData.vd} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="type">Tipo:</label>
            <input type="text" id="type" name="type" value={monsterData.type} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="alignment">Alineamiento:</label>
            <input type="text" id="alignment" name="alignment" value={monsterData.alignment} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="origin">Origen:</label>
            <input type="text" id="origin" name="origin" value={monsterData.origin} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="size">Tamaño:</label>
            <input type="text" id="size" name="size" value={monsterData.size} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="px">PX:</label>
            <input type="text" id="px" name="px" value={monsterData.px} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="armor">Armadura:</label>
            <input type="text" id="armor" name="armor" value={monsterData.armor} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="hp">Puntos de golpe:</label>
            <input type="text" id="hp" name="hp" value={monsterData.hp} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="speed">Velocidad:</label>
            <input type="text" id="speed" name="speed" value={monsterData.speed} onChange={handleChange} />
          </div>

          {/* Stats */}
          <div className="form-group">
            <label htmlFor="str">FUE:</label>
            <input type="text" id="str" name="str" value={monsterData.str} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="dex">DES:</label>
            <input type="text" id="dex" name="dex" value={monsterData.dex} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="con">CONS:</label>
            <input type="text" id="con" name="con" value={monsterData.con} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="int">INT:</label>
            <input type="text" id="int" name="int" value={monsterData.int} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="wis">SAB:</label>
            <input type="text" id="wis" name="wis" value={monsterData.wis} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="cha">CAR:</label>
            <input type="text" id="cha" name="cha" value={monsterData.cha} onChange={handleChange} />
          </div>

          {/* Other Details */}
          <div className="form-group">
            <label htmlFor="savingThrows">Tiradas de salvación:</label>
            <input type="text" id="savingThrows" name="savingThrows" value={monsterData.savingThrows} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="skills">Habilidades:</label>
            <input type="text" id="skills" name="skills" value={monsterData.skills} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="senses">Sentidos:</label>
            <input type="text" id="senses" name="senses" value={monsterData.senses} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="languages">Idiomas:</label>
            <input type="text" id="languages" name="languages" value={monsterData.languages} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="damageResistances">Resistencias al daño:</label>
            <input type="text" id="damageResistances" name="damageResistances" value={monsterData.damageResistances} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="damageImmunities">Inmunidades al daño:</label>
            <input type="text" id="damageImmunities" name="damageImmunities" value={monsterData.damageImmunities} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="conditionImmunities">Inmunidades al estado:</label>
            <input type="text" id="conditionImmunities" name="conditionImmunities" value={monsterData.conditionImmunities} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="damageVulnerabilities">Vulnerabilidades al daño:</label>
            <input type="text" id="damageVulnerabilities" name="damageVulnerabilities" value={monsterData.damageVulnerabilities} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="traits">Rasgos:</label>
            <textarea id="traits" name="traits" value={monsterData.traits} onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="actions">Acciones:</label>
            <textarea id="actions" name="actions" value={monsterData.actions} onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="legendaryActions">Acciones legendarias:</label>
            <textarea id="legendaryActions" name="legendaryActions" value={monsterData.legendaryActions} onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="reactions">Reacciones:</label>
            <textarea id="reactions" name="reactions" value={monsterData.reactions} onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="description">Descripción:</label>
            <textarea id="description" name="description" value={monsterData.description} onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="image">URL de la Imagen:</label>
            <input type="text" id="image" name="image" value={monsterData.image} onChange={handleChange} />
          </div>

          <div className="modal-actions">
            <button type="submit">Añadir Monstruo</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMonsterModal;