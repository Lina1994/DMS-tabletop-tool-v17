import React, { useState, useEffect } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import './AddCharacterModal.css';
import API_BASE_URL from '../../apiConfig';
import { experienceTable } from '../../utils/experienceTable';

function AddCharacterModal({ onClose, onAddCharacter }) {
  const { currentCampaign } = useCampaign();
  const [name, setName] = useState('');
  const [charClass, setCharClass] = useState('');
  const [level, setLevel] = useState('');
  const [background, setBackground] = useState('');
  const [race, setRace] = useState('');
  const [alignment, setAlignment] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [experiencePoints, setExperiencePoints] = useState('');
  const [strength, setStrength] = useState('');
  const [dexterity, setDexterity] = useState('');
  const [constitution, setConstitution] = useState('');
  const [intelligence, setIntelligence] = useState('');
  const [wisdom, setWisdom] = useState('');
  const [charisma, setCharisma] = useState('');
  const [proficiencyBonus, setProficiencyBonus] = useState('');
  const [armorClass, setArmorClass] = useState('');
  const [initiative, setInitiative] = useState('');
  const [speed, setSpeed] = useState('');
  const [maxHitPoints, setMaxHitPoints] = useState('');
  const [currentHitPoints, setCurrentHitPoints] = useState('');
  const [temporaryHitPoints, setTemporaryHitPoints] = useState('');
  const [hitDice, setHitDice] = useState('');
  const [otherProficienciesAndLanguages, setOtherProficienciesAndLanguages] = useState('');
  const [equipment, setEquipment] = useState('');
  const [featuresAndTraits, setFeaturesAndTraits] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [eyes, setEyes] = useState('');
  const [skin, setSkin] = useState('');
  const [hair, setHair] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [base64Image, setBase64Image] = useState(''); // New state for base64 image preview
  const [spellcastingAbility, setSpellcastingAbility] = useState('');
  const [spellSaveDC, setSpellSaveDC] = useState('');
  const [spellAttackBonus, setSpellAttackBonus] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [isPlayerCharacter, setIsPlayerCharacter] = useState(true); // New state for PC/NPC

  useEffect(() => {
    fetch(`${API_BASE_URL}/campaigns`)
      .then(response => response.json())
      .then(data => setCampaigns(data))
      .catch(error => console.error('Error fetching campaigns:', error));

    if (currentCampaign) {
      setSelectedCampaign(currentCampaign.id);
    }
  }, [currentCampaign]);

  useEffect(() => {
    if (level && experienceTable[level]) {
      setExperiencePoints(experienceTable[level]);
    } else {
      setExperiencePoints('');
    }
  }, [level]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl(''); // Clear URL if file is selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result); // Set base64 for preview
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setBase64Image(''); // Clear base64 if no file is selected
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const createCharacterObject = (imageData) => ({
      name,
      class: charClass, // Changed from charClass to class
      level: level ? parseInt(level) : null,
      background,
      race,
      alignment,
      playerName,
      experiencePoints: experiencePoints ? parseInt(experiencePoints) : null,
      strength: strength ? parseInt(strength) : null,
      dexterity: dexterity ? parseInt(dexterity) : null,
      constitution: constitution ? parseInt(constitution) : null,
      intelligence: intelligence ? parseInt(intelligence) : null,
      wisdom: wisdom ? parseInt(wisdom) : null,
      charisma: charisma ? parseInt(charisma) : null,
      proficiencyBonus: proficiencyBonus ? parseInt(proficiencyBonus) : null,
      armorClass: armorClass ? parseInt(armorClass) : null,
      initiative: initiative ? parseInt(initiative) : null,
      speed: speed ? parseInt(speed) : null,
      maxHitPoints: maxHitPoints ? parseInt(maxHitPoints) : null,
      currentHitPoints: currentHitPoints ? parseInt(currentHitPoints) : null,
      temporaryHitPoints: temporaryHitPoints ? parseInt(temporaryHitPoints) : null,
      hitDice,
      otherProficienciesAndLanguages,
      equipment,
      featuresAndTraits,
      age,
      height,
      weight,
      eyes,
      skin,
      hair,
      image: imageData,
      spellcastingAbility,
      spellSaveDC: spellSaveDC ? parseInt(spellSaveDC) : null,
      spellAttackBonus: spellAttackBonus ? parseInt(spellAttackBonus) : null,
      campaign_id: selectedCampaign || null,
      is_player_character: isPlayerCharacter, // Include new attribute
    });

    if (imageFile) {
      // Image data is already in base64Image state from handleFileChange
      const newCharacter = createCharacterObject(base64Image);
      onAddCharacter(newCharacter);
      onClose();
    } else {
      const newCharacter = createCharacterObject(imageUrl);
      onAddCharacter(newCharacter);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}> {/* Added onClick to overlay */}
      <div className="modal-content wide-modal-content" onClick={(e) => e.stopPropagation()}> {/* Added stopPropagation */}
        <h2>Añadir Nuevo Personaje</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre del Personaje:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="isPlayerCharacter">Es Personaje Jugador (PC):</label>
            <input
              type="checkbox"
              id="isPlayerCharacter"
              checked={isPlayerCharacter}
              onChange={(e) => setIsPlayerCharacter(e.target.checked)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="charClass">Clase:</label>
            <input type="text" id="charClass" value={charClass} onChange={(e) => setCharClass(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="level">Nivel:</label>
            <input type="number" id="level" value={level} onChange={(e) => setLevel(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="background">Trasfondo:</label>
            <input type="text" id="background" value={background} onChange={(e) => setBackground(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="race">Raza:</label>
            <input type="text" id="race" value={race} onChange={(e) => setRace(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="alignment">Alineamiento:</label>
            <input type="text" id="alignment" value={alignment} onChange={(e) => setAlignment(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="playerName">Nombre del Jugador:</label>
            <input type="text" id="playerName" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          </div>

          {/* Abilities */}
          <fieldset>
            <legend>Atributos</legend>
            <div className="form-group-inline">
              <label htmlFor="strength">Fuerza:</label>
              <input type="number" id="strength" value={strength} onChange={(e) => setStrength(e.target.value)} />
              <label htmlFor="dexterity">Destreza:</label>
              <input type="number" id="dexterity" value={dexterity} onChange={(e) => setDexterity(e.target.value)} />
              <label htmlFor="constitution">Constitución:</label>
              <input type="number" id="constitution" value={constitution} onChange={(e) => setConstitution(e.target.value)} />
              <label htmlFor="intelligence">Inteligencia:</label>
              <input type="number" id="intelligence" value={intelligence} onChange={(e) => setIntelligence(e.target.value)} />
              <label htmlFor="wisdom">Sabiduría:</label>
              <input type="number" id="wisdom" value={wisdom} onChange={(e) => setWisdom(e.target.value)} />
              <label htmlFor="charisma">Carisma:</label>
              <input type="number" id="charisma" value={charisma} onChange={(e) => setCharisma(e.target.value)} />
            </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="proficiencyBonus">Bonificación por Competencia:</label>
            <input type="number" id="proficiencyBonus" value={proficiencyBonus} onChange={(e) => setProficiencyBonus(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="armorClass">Clase de Armadura:</label>
            <input type="number" id="armorClass" value={armorClass} onChange={(e) => setArmorClass(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="initiative">Iniciativa:</label>
            <input type="number" id="initiative" value={initiative} onChange={(e) => setInitiative(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="speed">Velocidad:</label>
            <input type="number" id="speed" value={speed} onChange={(e) => setSpeed(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="maxHitPoints">Puntos de Golpe Máximos:</label>
            <input type="number" id="maxHitPoints" value={maxHitPoints} onChange={(e) => setMaxHitPoints(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="currentHitPoints">Puntos de Golpe Actuales:</label>
            <input type="number" id="currentHitPoints" value={currentHitPoints} onChange={(e) => setCurrentHitPoints(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="temporaryHitPoints">Puntos de Golpe Temporales:</label>
            <input type="number" id="temporaryHitPoints" value={temporaryHitPoints} onChange={(e) => setTemporaryHitPoints(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="hitDice">Dados de Golpe:</label>
            <input type="text" id="hitDice" value={hitDice} onChange={(e) => setHitDice(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="otherProficienciesAndLanguages">Otras Competencias e Idiomas:</label>
            <textarea id="otherProficienciesAndLanguages" value={otherProficienciesAndLanguages} onChange={(e) => setOtherProficienciesAndLanguages(e.target.value)}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="equipment">Equipo:</label>
            <textarea id="equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="featuresAndTraits">Rasgos y Atributos:</label>
            <textarea id="featuresAndTraits" value={featuresAndTraits} onChange={(e) => setFeaturesAndTraits(e.target.value)}></textarea>t>
          </div>

          {/* Physical Description */}
          <fieldset>
            <legend>Descripción Física</legend>
            <div className="form-group-inline">
              <label htmlFor="age">Edad:</label>
              <input type="text" id="age" value={age} onChange={(e) => setAge(e.target.value)} />
              <label htmlFor="height">Altura:</label>
              <input type="text" id="height" value={height} onChange={(e) => setHeight(e.target.value)} />
              <label htmlFor="weight">Peso:</label>
              <input type="text" id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="form-group-inline">
              <label htmlFor="eyes">Ojos:</label>
              <input type="text" id="eyes" value={eyes} onChange={(e) => setEyes(e.target.value)} />
              <label htmlFor="skin">Piel:</label>
              <input type="text" id="skin" value={skin} onChange={(e) => setSkin(e.target.value)} />
              <label htmlFor="hair">Pelo:</label>
              <input type="text" id="hair" value={hair} onChange={(e) => setHair(e.target.value)} />
            </div>
          </fieldset>

          {/* Image */}
          <div className="form-group">
            <label htmlFor="imageUrl">URL de la Imagen:</label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setBase64Image(''); }} // Clear file and base64 if URL is entered
            />
          </div>
          <div className="form-group">
            <label htmlFor="imageFile">Archivo de Imagen:</label>
            <input
              type="file"
              id="imageFile"
              onChange={handleFileChange}
              accept="image/*"
            />
            {base64Image && !imageUrl && (
              <div className="current-image-preview">
                <p>Previsualización:</p>
                <img src={base64Image} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
              </div>
            )}
          </div>

          {/* Spellcasting */}
          <fieldset>
            <legend>Aptitud Mágica</legend>
            <div className="form-group">
              <label htmlFor="spellcastingAbility">Aptitud Mágica:</label>
              <input type="text" id="spellcastingAbility" value={spellcastingAbility} onChange={(e) => setSpellcastingAbility(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="spellSaveDC">CD Tirada de Salvación de Conjuros:</label>
              <input type="number" id="spellSaveDC" value={spellSaveDC} onChange={(e) => setSpellSaveDC(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="spellAttackBonus">Bonificador de Ataque de Conjuro:</label>
              <input type="number" id="spellAttackBonus" value={spellAttackBonus} onChange={(e) => setSpellAttackBonus(e.target.value)} />
            </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="campaign">Campaña:</label>
            <select
              id="campaign"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
            >
              <option value="">Sin campaña</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit">Añadir Personaje</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCharacterModal;
