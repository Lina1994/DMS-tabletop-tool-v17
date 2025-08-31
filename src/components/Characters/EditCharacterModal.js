import React, { useState, useEffect } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import './EditCharacterModal.css';
import API_BASE_URL from '../../apiConfig';

function EditCharacterModal({ onClose, onUpdateCharacter, character }) {
  const { currentCampaign } = useCampaign();
  const [name, setName] = useState(character.name || '');
  const [charClass, setCharClass] = useState(character.class || '');
  const [level, setLevel] = useState(character.level || '');
  const [background, setBackground] = useState(character.background || '');
  const [race, setRace] = useState(character.race || '');
  const [alignment, setAlignment] = useState(character.alignment || '');
  const [playerName, setPlayerName] = useState(character.playerName || '');
  const [experiencePoints, setExperiencePoints] = useState(character.experiencePoints || '');
  const [strength, setStrength] = useState(character.strength || '');
  const [dexterity, setDexterity] = useState(character.dexterity || '');
  const [constitution, setConstitution] = useState(character.constitution || '');
  const [intelligence, setIntelligence] = useState(character.intelligence || '');
  const [wisdom, setWisdom] = useState(character.wisdom || '');
  const [charisma, setCharisma] = useState(character.charisma || '');
  const [proficiencyBonus, setProficiencyBonus] = useState(character.proficiencyBonus || '');
  const [armorClass, setArmorClass] = useState(character.armorClass || '');
  const [initiative, setInitiative] = useState(character.initiative || '');
  const [speed, setSpeed] = useState(character.speed || '');
  const [maxHitPoints, setMaxHitPoints] = useState(character.maxHitPoints || '');
  const [currentHitPoints, setCurrentHitPoints] = useState(character.currentHitPoints || '');
  const [temporaryHitPoints, setTemporaryHitPoints] = useState(character.temporaryHitPoints || '');
  const [hitDice, setHitDice] = useState(character.hitDice || '');
  const [otherProficienciesAndLanguages, setOtherProficienciesAndLanguages] = useState(character.otherProficienciesAndLanguages || '');
  const [equipment, setEquipment] = useState(character.equipment || '');
  const [featuresAndTraits, setFeaturesAndTraits] = useState(character.featuresAndTraits || '');
  const [age, setAge] = useState(character.age || '');
  const [height, setHeight] = useState(character.height || '');
  const [weight, setWeight] = useState(character.weight || '');
  const [eyes, setEyes] = useState(character.eyes || '');
  const [skin, setSkin] = useState(character.skin || '');
  const [hair, setHair] = useState(character.hair || '');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(character.image && !character.image.startsWith('data:image') ? character.image : '');
  const [base64Image, setBase64Image] = useState(character.image && character.image.startsWith('data:image') ? character.image : '');
  const [spellcastingAbility, setSpellcastingAbility] = useState(character.spellcastingAbility || '');
  const [spellSaveDC, setSpellSaveDC] = useState(character.spellSaveDC || '');
  const [spellAttackBonus, setSpellAttackBonus] = useState(character.spellAttackBonus || '');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(character.campaign_id || '');
  const [isPlayerCharacter, setIsPlayerCharacter] = useState(character.is_player_character || false); // New state for PC/NPC

  useEffect(() => {
    fetch(`${API_BASE_URL}/campaigns`)
      .then(response => response.json())
      .then(data => setCampaigns(data))
      .catch(error => console.error('Error fetching campaigns:', error));

    if (currentCampaign && !character.campaign_id) { // Only set if no campaign is already assigned to character
      setSelectedCampaign(currentCampaign.id);
    }
  }, [currentCampaign, character.campaign_id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl(''); // Clear URL if file is selected
      setBase64Image(''); // Clear base64 if file is selected
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageData = character.image; // Default to existing image data

    const createUpdatedCharacterObject = (imgData) => ({
      ...character, // Keep existing character properties
      name, class: charClass, level: level ? parseInt(level) : null, background, race, alignment, playerName,
      experiencePoints: experiencePoints ? parseInt(experiencePoints) : null,
      strength: strength ? parseInt(strength) : null, dexterity: dexterity ? parseInt(dexterity) : null,
      constitution: constitution ? parseInt(constitution) : null, intelligence: intelligence ? parseInt(intelligence) : null,
      wisdom: wisdom ? parseInt(wisdom) : null, charisma: charisma ? parseInt(charisma) : null,
      proficiencyBonus: proficiencyBonus ? parseInt(proficiencyBonus) : null, armorClass: armorClass ? parseInt(armorClass) : null,
      initiative: initiative ? parseInt(initiative) : null, speed: speed ? parseInt(speed) : null,
      maxHitPoints: maxHitPoints ? parseInt(maxHitPoints) : null, currentHitPoints: currentHitPoints ? parseInt(currentHitPoints) : null,
      temporaryHitPoints: temporaryHitPoints ? parseInt(temporaryHitPoints) : null,
      hitDice, otherProficienciesAndLanguages, equipment, featuresAndTraits,
      age, height, weight, eyes, skin, hair,
      image: imgData, // Base64 string or URL string
      spellcastingAbility, spellSaveDC: spellSaveDC ? parseInt(spellSaveDC) : null,
      spellAttackBonus: spellAttackBonus ? parseInt(spellAttackBonus) : null,
      campaign_id: selectedCampaign || null,
      is_player_character: isPlayerCharacter, // Include new attribute
    });

    if (imageFile) {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = () => {
        imageData = reader.result;
        onUpdateCharacter(createUpdatedCharacterObject(imageData));
        onClose();
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };
    } else if (imageUrl) {
      imageData = imageUrl; // Use URL if provided
      onUpdateCharacter(createUpdatedCharacterObject(imageData));
      onClose();
    } else {
      // If no new file or URL, retain existing base64Image or clear if it was a URL that's now empty
      imageData = base64Image || ''; // Use base64Image if it exists, otherwise empty
      onUpdateCharacter(createUpdatedCharacterObject(imageData));
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Editar Personaje</h2>
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
          <div className="form-group">
            <label htmlFor="experiencePoints">Puntos de Experiencia:</label>
            <input type="number" id="experiencePoints" value={experiencePoints} onChange={(e) => setExperiencePoints(e.target.value)} />
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
            <textarea id="featuresAndTraits" value={featuresAndTraits} onChange={(e) => setFeaturesAndTraits(e.target.value)}></textarea>
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
                <p>Imagen actual:</p>
                <img src={base64Image} alt="Current Character" style={{ maxWidth: '100px', maxHeight: '100px' }} />
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
            <button type="submit">Guardar Cambios</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCharacterModal;