const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, setupDatabase, migrateDataFromJsons, getMonsters, addMonster, updateMonster, deleteMonster, deleteAllMonsters, getMaps, addMap, addMaps, updateMap, deleteMap, getShops, addShop, updateShop, deleteShop, addCategory, updateCategory, deleteCategory, getCategoryById, addItem, updateItem, deleteItem, getSongs, addSong, updateSong, deleteSong, syncShops, getCampaigns, addCampaign, updateCampaign, deleteCampaign, getCharacters, addCharacter, updateCharacter, deleteCharacter, getEncounters, addEncounter, updateEncounter, deleteEncounter, getSpells, addSpell, updateSpell, deleteSpell, deleteAllSpells, syncSpells, getCalendar, addCalendar, updateCalendar, deleteCalendar, getDiaryEntry, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry, getAllDiaryEntriesForCampaignAndYear, generateBackendId } = require('./database');

const app = express();
const port = 3001;

// Define the path to the music folder
const musicPath = path.join(__dirname, '..', 'data', 'music');

app.use(cors());
app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ limit: '250mb', extended: true }));

// Serve static files from the music folder
app.use('/music', express.static(musicPath));

// Initialize database and migrate data on startup
setupDatabase();
migrateDataFromJsons();

// API Endpoints for Monsters
app.get('/monsters', (req, res) => {
    const result = getMonsters();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/monsters', (req, res) => {
    const result = addMonster(req.body);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/monsters/:id', (req, res) => {
    const monster = { ...req.body, id: req.params.id };
    const result = updateMonster(monster);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/monsters/:id', (req, res) => {
    const result = deleteMonster(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/monsters', (req, res) => {
    const result = deleteAllMonsters();
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// API Endpoints for Spells
app.get('/spells', (req, res) => {
    const result = getSpells();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/spells', (req, res) => {
    const result = addSpell(req.body);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/spells/:id', (req, res) => {
    const spell = { ...req.body, id: req.params.id };
    const result = updateSpell(spell);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/spells/:id', (req, res) => {
    const result = deleteSpell(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/spells', (req, res) => {
    const result = deleteAllSpells();
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/spells/sync', (req, res) => {
    console.log('Backend: /spells/sync called with:', req.body);
    const result = syncSpells(req.body);
    if (result.success) {
        res.status(200).json({ message: 'Spells synced successfully' });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/spells/export', (req, res) => {
    // This will require more logic later to generate an Excel file
    res.status(501).json({ message: 'Spell export not yet implemented' });
});

// API Endpoints for Maps
app.get('/maps', (req, res) => {
    const result = getMaps();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/maps/bulk', (req, res) => {
    const result = addMaps(req.body);
    if (result.success) {
        res.status(201).json(result.ids);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/maps', (req, res) => {
    const result = addMap(req.body);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/maps/:id', (req, res) => {
    const map = { ...req.body, id: req.params.id };
    const result = updateMap(map);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/maps/:id', (req, res) => {
    const result = deleteMap(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// API Endpoints for Shops
app.get('/shops', (req, res) => {
    const result = getShops();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/shops/sync', (req, res) => {
    console.log('Backend: /shops/sync called with:', req.body);
    const result = syncShops(req.body);
    if (result.success) {
        res.status(200).json({ message: 'Shops synced successfully' });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/shops', (req, res) => {
    const result = addShop(req.body);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/shops/:id', (req, res) => {
    const shop = { ...req.body, id: req.params.id };
    const result = updateShop(shop);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/shops/:id', (req, res) => {
    const result = deleteShop(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// API Endpoints for Categories (Sections)
app.get('/categories/:id', (req, res) => {
    const result = getCategoryById(req.params.id);
    if (result.success) {
        if (result.data) {
            res.json(result.data);
        } else {
            res.status(404).json({ error: 'Category not found' });
        }
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/shops/:shopId/sections', (req, res) => {
    const { shopId } = req.params;
    const newSection = { ...req.body, id: generateBackendId('section'), shop_id: shopId };
    const result = addCategory(newSection);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/sections/:id', (req, res) => {
    const section = { ...req.body, id: req.params.id };
    const result = updateCategory(section);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/sections/:id', (req, res) => {
    const result = deleteCategory(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// API Endpoints for Items
app.post('/items', (req, res) => {
    const newItem = { ...req.body, id: generateBackendId('item'), data: req.body };
    const result = addItem(newItem);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/items/:id', (req, res) => {
    const item = { ...req.body, id: req.params.id, data: req.body };
    const result = updateItem(item);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/items/:id', (req, res) => {
    const result = deleteItem(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// API Endpoints for Songs
app.get('/songs', (req, res) => {
    const result = getSongs();
    if (result.success) {
        // Prepend the base URL for the music files
        const songsWithFullPaths = result.data.map(song => ({
            ...song,
            filePath: song.filePath ? `/music/${path.basename(song.filePath)}` : ''
        }));
        res.json(songsWithFullPaths);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/songs', (req, res) => {
    const result = addSong(req.body);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/songs/:id', (req, res) => {
    const song = { ...req.body, id: req.params.id };
    const result = updateSong(song);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/songs/:id', (req, res) => {
    const result = deleteSong(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// API Endpoints for Campaigns
app.get('/campaigns', (req, res) => {
    const result = getCampaigns();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/campaigns', (req, res) => {
    const result = addCampaign(req.body);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/campaigns/:id', (req, res) => {
    const campaign = { ...req.body, id: req.params.id };
    const result = updateCampaign(campaign);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/campaigns/:id', (req, res) => {
    const result = deleteCampaign(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// API Endpoints for Characters
app.get('/characters', (req, res) => {
    const campaignId = req.query.campaignId; // Get campaignId from query parameter
    const result = getCharacters(campaignId);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/characters', (req, res) => {
    // Ensure is_player_character is explicitly passed, defaulting to false if not provided
    const characterData = { ...req.body, is_player_character: !!req.body.is_player_character };
    const result = addCharacter(characterData);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/characters/:id', (req, res) => {
    // Ensure is_player_character is explicitly passed, defaulting to false if not provided
    const characterData = { ...req.body, id: req.params.id, is_player_character: !!req.body.is_player_character };
    const result = updateCharacter(characterData);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/characters/:id', (req, res) => {
    const result = deleteCharacter(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// API Endpoints for Encounters
app.get('/encounters', (req, res) => {
    const result = getEncounters();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/encounters/:id', (req, res) => {
    try {
        const encounterId = req.params.id;
        const encounter = db.prepare(`
            SELECT 
                e.id, e.name, e.campaign_id, e.song_id,
                c.name as campaign_name,
                s.name as song_name
            FROM encounters e
            LEFT JOIN campaigns c ON e.campaign_id = c.id
            LEFT JOIN songs s ON e.song_id = s.id
            WHERE e.id = ?
        `).get(encounterId);

        if (!encounter) {
            return res.status(404).json({ error: "Encounter not found" });
        }

        const monsterStmt = db.prepare(`
            SELECT m.* FROM monsters m
            JOIN encounter_monsters em ON m.id = em.monster_id
            WHERE em.encounter_id = ?
        `);
        const characterStmt = db.prepare(`
            SELECT c.* FROM characters c
            JOIN encounter_characters ec ON c.id = ec.character_id
            WHERE ec.encounter_id = ?
        `);

        encounter.monsters = monsterStmt.all(encounterId);
        encounter.characters = characterStmt.all(encounterId);

        res.json(encounter);
    } catch (error) {
        console.error("Error in GET /encounters/:id:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/encounters', (req, res) => {
    try {
        const result = addEncounter(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/encounters/:id', (req, res) => {
    try {
        const encounter = { ...req.body, id: req.params.id };
        const result = updateEncounter(encounter);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/encounters/:id', (req, res) => {
    const result = deleteEncounter(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.message });
    }
});

// API Endpoints for Calendars
app.get('/calendars/:campaignId', (req, res) => {
    const result = getCalendar(req.params.campaignId);
    if (result.success) {
        // If no calendar is found, result.data will be null/undefined. Send null explicitly.
        res.json(result.data || null);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/calendars', (req, res) => {
    const result = addCalendar(req.body);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/calendars/:id', (req, res) => {
    const calendar = { ...req.body, id: req.params.id };
    const result = updateCalendar(calendar);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/calendars/:id', (req, res) => {
    const result = deleteCalendar(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

// API Endpoints for Diary Entries
app.get('/diary/:campaignId/:year/:monthIndex/:day', (req, res) => {
    const { campaignId, year, monthIndex, day } = req.params;
    const result = getDiaryEntry(campaignId, year, parseInt(monthIndex, 10), parseInt(day, 10));
    if (result.success) {
        res.json(result.data || null);
    } else {
        res.status(500).json({ error: result.error });
    }
});

// New endpoint to get all diary entries for a campaign and year
app.get('/diary/campaign/:campaignId/year/:year', (req, res) => {
    const { campaignId, year } = req.params;
    const result = getAllDiaryEntriesForCampaignAndYear(campaignId, year);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/diary', (req, res) => {
    const result = addDiaryEntry(req.body);
    if (result.success) {
        res.status(201).json({ id: result.id });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/diary/:id', (req, res) => {
    const entry = { ...req.body, id: req.params.id };
    const result = updateDiaryEntry(entry);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/diary/:id', (req, res) => {
    const result = deleteDiaryEntry(req.params.id);
    if (result.success) {
        res.json({ changes: result.changes });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server listening at http://0.0.0.0:${port}`);
});
