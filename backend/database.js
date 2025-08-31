const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Paths
const dbPath = path.resolve(__dirname, '..', 'data', 'dms_tool.db');
const dataDir = path.resolve(__dirname, '..', 'data');
const monstersFilePath = path.join(dataDir, 'monsters.json');
const mapsFilePath = path.join(dataDir, 'maps.json');
const shopsFilePath = path.join(dataDir, 'shops.json');

const db = new Database(dbPath);

const generateBackendId = (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// SQL to create the tables
const createTablesStmt = `

CREATE TABLE IF NOT EXISTS monsters (
    id TEXT PRIMARY KEY,
    name TEXT, vd TEXT, type TEXT, alignment TEXT, origin TEXT, size TEXT, px TEXT, armor TEXT, hp TEXT, speed TEXT, str TEXT, dex TEXT, con TEXT, int TEXT, wis TEXT, car TEXT, savingThrows TEXT, skills TEXT, senses TEXT, languages TEXT, damageResistances TEXT, damageImmunities TEXT, conditionImmunities TEXT, damageVulnerabilities TEXT, traits TEXT, actions TEXT, legendaryActions TEXT, reactions TEXT, description TEXT, image TEXT
);

CREATE TABLE IF NOT EXISTS spells (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    school TEXT,
    level INTEGER,
    range TEXT,
    duration TEXT,
    cost TEXT,
    is_ritual BOOLEAN,
    requires_concentration BOOLEAN,
    has_material_components BOOLEAN,
    components TEXT,
    classes TEXT,
    description TEXT,
    damage_attack TEXT,
    aoe TEXT,
    saving_throw TEXT,
    higher_level_casting TEXT
);

CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    name TEXT,
    group_name TEXT,
    url TEXT,
    imagePath TEXT,
    image_data BLOB,
    keepOpen INTEGER,
    zoom REAL,
    rotation REAL,
    panX REAL,
    panY REAL,
    original_width INTEGER,
    original_height INTEGER,
    notes TEXT,
    song_id TEXT,
    campaign_id TEXT,
    easy_battle_song_id TEXT,
    medium_battle_song_id TEXT,
    hard_battle_song_id TEXT,
    deadly_battle_song_id TEXT,
    extreme_battle_song_id TEXT,
    FOREIGN KEY (song_id) REFERENCES songs (id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id),
    FOREIGN KEY (easy_battle_song_id) REFERENCES songs (id),
    FOREIGN KEY (medium_battle_song_id) REFERENCES songs (id),
    FOREIGN KEY (hard_battle_song_id) REFERENCES songs (id),
    FOREIGN KEY (deadly_battle_song_id) REFERENCES songs (id),
    FOREIGN KEY (extreme_battle_song_id) REFERENCES songs (id)
);

CREATE TABLE IF NOT EXISTS shops ( id TEXT PRIMARY KEY, name TEXT );

CREATE TABLE IF NOT EXISTS categories ( 
    id TEXT PRIMARY KEY, 
    shop_id TEXT, 
    name TEXT, 
    columns_definition TEXT, 
    FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    category_id TEXT,
    data TEXT, /* Stores item properties as JSON */
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    name TEXT,
    group_name TEXT,
    filePath TEXT
);

CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_data BLOB,
    description TEXT,
    author TEXT,
    game TEXT,
    participants TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT,
    level INTEGER,
    background TEXT,
    race TEXT,
    alignment TEXT,
    playerName TEXT,
    experiencePoints INTEGER,
    strength INTEGER,
    dexterity INTEGER,
    constitution INTEGER,
    intelligence INTEGER,
    wisdom INTEGER,
    charisma INTEGER,
    proficiencyBonus INTEGER,
    armorClass INTEGER,
    initiative INTEGER,
    speed INTEGER,
    maxHitPoints INTEGER,
    currentHitPoints INTEGER,
    temporaryHitPoints INTEGER,
    hitDice TEXT,
    otherProficienciesAndLanguages TEXT,
    equipment TEXT,
    featuresAndTraits TEXT,
    age TEXT,
    height TEXT,
    weight TEXT,
    eyes TEXT,
    skin TEXT,
    hair TEXT,
    image BLOB,
    spellcastingAbility TEXT,
    spellSaveDC INTEGER,
    spellAttackBonus INTEGER,
    campaign_id TEXT,
    is_player_character BOOLEAN, /* New column for PC/NPC */
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
);

CREATE TABLE IF NOT EXISTS encounters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    campaign_id TEXT,
    song_id TEXT,
    easy_battle_song_id TEXT,
    medium_battle_song_id TEXT,
    hard_battle_song_id TEXT,
    deadly_battle_song_id TEXT,
    extreme_battle_song_id TEXT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE SET NULL,
    FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE SET NULL,
    FOREIGN KEY (easy_battle_song_id) REFERENCES songs (id),
    FOREIGN KEY (medium_battle_song_id) REFERENCES songs (id),
    FOREIGN KEY (hard_battle_song_id) REFERENCES songs (id),
    FOREIGN KEY (deadly_battle_song_id) REFERENCES songs (id),
    FOREIGN KEY (extreme_battle_song_id) REFERENCES songs (id)
);

CREATE TABLE IF NOT EXISTS encounter_monsters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    encounter_id TEXT NOT NULL,
    monster_id TEXT NOT NULL,
    FOREIGN KEY (encounter_id) REFERENCES encounters (id) ON DELETE CASCADE,
    FOREIGN KEY (monster_id) REFERENCES monsters (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS encounter_characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    encounter_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    FOREIGN KEY (encounter_id) REFERENCES encounters (id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calendars (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL UNIQUE,
    num_months INTEGER NOT NULL,
    month_names TEXT NOT NULL,
    days_in_month TEXT NOT NULL,
    days_in_week INTEGER NOT NULL,
    weekday_names TEXT NOT NULL,
    current_year TEXT, /* New column for the year */
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diary_entries (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    year TEXT NOT NULL,
    month_index INTEGER NOT NULL,
    day INTEGER NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, year, month_index, day),
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE
);

`;

// Add migration for song_id column to maps table
const addSongIdColumnStmt = `
    PRAGMA foreign_keys = OFF;
    CREATE TABLE IF NOT EXISTS maps_backup (
        id TEXT PRIMARY KEY, name TEXT, group_name TEXT, url TEXT, imagePath TEXT, image_data BLOB, keepOpen INTEGER, zoom REAL, rotation REAL, panX REAL, panY REAL, original_width INTEGER, original_height INTEGER, notes TEXT, song_id TEXT
    );
    INSERT OR IGNORE INTO maps_backup SELECT id, name, group_name, url, imagePath, image_data, keepOpen, zoom, rotation, panX, panY, original_width, original_height, notes, NULL FROM maps;
    DROP TABLE IF EXISTS maps;
    ALTER TABLE maps_backup RENAME TO maps;
    CREATE INDEX IF NOT EXISTS idx_maps_song_id ON maps (song_id);
    PRAGMA foreign_keys = ON;
`;

const addCampaignIdColumnStmt = `
    PRAGMA foreign_keys = OFF;
    CREATE TABLE IF NOT EXISTS maps_backup_campaign (
        id TEXT PRIMARY KEY, name TEXT, group_name TEXT, url TEXT, imagePath TEXT, image_data BLOB, keepOpen INTEGER, zoom REAL, rotation REAL, panX REAL, panY REAL, original_width INTEGER, original_height INTEGER, notes TEXT, song_id TEXT, campaign_id TEXT
    );
    INSERT OR IGNORE INTO maps_backup_campaign SELECT id, name, group_name, url, imagePath, image_data, keepOpen, zoom, rotation, panX, panY, original_width, original_height, notes, song_id, NULL FROM maps;
    DROP TABLE IF EXISTS maps;
    ALTER TABLE maps_backup_campaign RENAME TO maps;
    CREATE INDEX IF NOT EXISTS idx_maps_campaign_id ON maps (campaign_id);
    PRAGMA foreign_keys = ON;
`;

// Function to check if a column exists
function columnExists(tableName, columnName) {
    const result = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return result.some(column => column.name === columnName);
}

// Function to initialize the database
function setupDatabase() {
    // Drop old item tables if they exist
    // The following lines are commented out to ensure data persistence across restarts.
    // If you need to reset the database (e.g., for schema changes or to start fresh),
    // you will need to manually delete the 'dms_tool.db' file in the 'data' directory.
    // db.exec('DROP TABLE IF EXISTS items;');
    // db.exec('DROP TABLE IF EXISTS categories;');
    // db.exec('DROP TABLE IF EXISTS shops;');
    db.exec('DROP TABLE IF EXISTS items_weapons;'); // Keep for old schema cleanup
    db.exec('DROP TABLE IF EXISTS items_armors;'); // Keep for old schema cleanup

    db.exec(createTablesStmt);

    // Run migration for song_id column if it doesn't exist
    if (!columnExists('maps', 'song_id')) {
        console.log('Adding song_id column to maps table...');
        db.exec('ALTER TABLE maps ADD COLUMN song_id TEXT;');
        console.log('song_id column added to maps table.');
    }
    if (!columnExists('maps', 'campaign_id')) {
        console.log('Adding campaign_id column to maps table...');
        db.exec('ALTER TABLE maps ADD COLUMN campaign_id TEXT;');
        console.log('campaign_id column added to maps table.');
    }
    if (!columnExists('maps', 'easy_battle_song_id')) {
        console.log('Adding easy_battle_song_id column to maps table...');
        db.exec('ALTER TABLE maps ADD COLUMN easy_battle_song_id TEXT;');
        console.log('easy_battle_song_id column added to maps table.');
    }
    if (!columnExists('maps', 'medium_battle_song_id')) {
        console.log('Adding medium_battle_song_id column to maps table...');
        db.exec('ALTER TABLE maps ADD COLUMN medium_battle_song_id TEXT;');
        console.log('medium_battle_song_id column added to maps table.');
    }
    if (!columnExists('maps', 'hard_battle_song_id')) {
        console.log('Adding hard_battle_song_id column to maps table...');
        db.exec('ALTER TABLE maps ADD COLUMN hard_battle_song_id TEXT;');
        console.log('hard_battle_song_id column added to maps table.');
    }
    if (!columnExists('maps', 'deadly_battle_song_id')) {
        console.log('Adding deadly_battle_song_id column to maps table...');
        db.exec('ALTER TABLE maps ADD COLUMN deadly_battle_song_id TEXT;');
        console.log('deadly_battle_song_id column added to maps table.');
    }
    if (!columnExists('maps', 'extreme_battle_song_id')) {
        console.log('Adding extreme_battle_song_id column to maps table...');
        db.exec('ALTER TABLE maps ADD COLUMN extreme_battle_song_id TEXT;');
        console.log('extreme_battle_song_id column added to maps table.');
    }
    if (!columnExists('encounters', 'easy_battle_song_id')) {
        console.log('Adding easy_battle_song_id column to encounters table...');
        db.exec('ALTER TABLE encounters ADD COLUMN easy_battle_song_id TEXT;');
        console.log('easy_battle_song_id column added to encounters table.');
    }
    if (!columnExists('encounters', 'medium_battle_song_id')) {
        console.log('Adding medium_battle_song_id column to encounters table...');
        db.exec('ALTER TABLE encounters ADD COLUMN medium_battle_song_id TEXT;');
        console.log('medium_battle_song_id column added to encounters table.');
    }
    if (!columnExists('encounters', 'hard_battle_song_id')) {
        console.log('Adding hard_battle_song_id column to encounters table...');
        db.exec('ALTER TABLE encounters ADD COLUMN hard_battle_song_id TEXT;');
        console.log('hard_battle_song_id column added to encounters table.');
    }
    if (!columnExists('encounters', 'deadly_battle_song_id')) {
        console.log('Adding deadly_battle_song_id column to encounters table...');
        db.exec('ALTER TABLE encounters ADD COLUMN deadly_battle_song_id TEXT;');
        console.log('deadly_battle_song_id column added to encounters table.');
    }
    if (!columnExists('encounters', 'extreme_battle_song_id')) {
        console.log('Adding extreme_battle_song_id column to encounters table...');
        db.exec('ALTER TABLE encounters ADD COLUMN extreme_battle_song_id TEXT;');
        console.log('extreme_battle_song_id column added to encounters table.');
    }
    // New migration for categories table
    if (columnExists('categories', 'type') && !columnExists('categories', 'columns_definition')) {
        console.log('Migrating categories table: adding columns_definition and dropping type...');
        db.exec('ALTER TABLE categories ADD COLUMN columns_definition TEXT;');
        // You might want to populate columns_definition based on existing 'type' here
        // For simplicity, I'm assuming a fresh start or manual migration for existing data.
        db.exec('CREATE TABLE categories_backup AS SELECT id, shop_id, name, columns_definition FROM categories;');
        db.exec('DROP TABLE categories;');
        db.exec('ALTER TABLE categories_backup RENAME TO categories;');
        console.log('categories table migrated.');
    } else if (!columnExists('categories', 'columns_definition')) {
        // If 'type' column doesn't exist but 'columns_definition' also doesn't, just add it.
        db.exec('ALTER TABLE categories ADD COLUMN columns_definition TEXT;');
        console.log('columns_definition column added to categories table.');
    }

    if (columnExists('campaigns', 'image')) {
        db.exec('ALTER TABLE campaigns RENAME COLUMN image TO image_data_old');
        db.exec('ALTER TABLE campaigns ADD COLUMN image_data BLOB');
        // Here you could add logic to migrate data from image to image_data if needed
        db.exec('ALTER TABLE campaigns DROP COLUMN image_data_old');
    }
    // Add migration for current_year column to calendars table
    if (!columnExists('calendars', 'current_year')) {
        console.log('Adding current_year column to calendars table...');
        db.exec('ALTER TABLE calendars ADD COLUMN current_year TEXT;');
        console.log('current_year column added to calendars table.');
    }
    // Add migration for diary_entries table
    if (!columnExists('diary_entries', 'id')) {
        console.log('Adding diary_entries table...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS diary_entries (
                id TEXT PRIMARY KEY,
                campaign_id TEXT NOT NULL,
                year TEXT NOT NULL,
                month_index INTEGER NOT NULL,
                day INTEGER NOT NULL,
                content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(campaign_id, year, month_index, day),
                FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE
            );
        `);
        console.log('diary_entries table added.');
    }
    // Add migration for is_player_character column to characters table
    if (!columnExists('characters', 'is_player_character')) {
        console.log('Adding is_player_character column to characters table...');
        db.exec('ALTER TABLE characters ADD COLUMN is_player_character BOOLEAN DEFAULT 0;');
        console.log('is_player_character column added to characters table.');
    }
    db.exec(`PRAGMA foreign_keys = ON;`); // Ensure foreign keys are on after setup
    console.log('Base de datos SQLite inicializada y lista.');
}

function getMonsters() {
    try {
        const stmt = db.prepare('SELECT * FROM monsters');
        return { success: true, data: stmt.all() };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function addMonster(monster) {
    console.log('Backend: addMonster called with:', monster);
    try {
        const monsterToInsert = {
            ...monster,
            car: monster.cha // Map 'cha' from frontend to 'car' for DB
        };
        const stmt = db.prepare('INSERT INTO monsters (id, name, vd, type, alignment, origin, size, px, armor, hp, speed, str, dex, con, int, wis, car, savingThrows, skills, senses, languages, damageResistances, damageImmunities, conditionImmunities, damageVulnerabilities, traits, actions, legendaryActions, reactions, description, image) VALUES (@id, @name, @vd, @type, @alignment, @origin, @size, @px, @armor, @hp, @speed, @str, @dex, @con, @int, @wis, @car, @savingThrows, @skills, @senses, @languages, @damageResistances, @damageImmunities, @conditionImmunities, @damageVulnerabilities, @traits, @actions, @legendaryActions, @reactions, @description, @image)');
        const info = stmt.run(monsterToInsert);
        console.log('Backend: addMonster successful, info:', info);
        return { success: true, id: monster.id }; // Return the ID that was passed in
    } catch (error) {
        console.error('Backend: Error in addMonster:', error.message);
        return { success: false, error: error.message };
    }
}

function updateMonster(monster) {
    try {
        const monsterToUpdate = {
            ...monster,
            car: monster.cha // Map 'cha' from frontend to 'car' for DB
        };
        const stmt = db.prepare('UPDATE monsters SET name = @name, vd = @vd, type = @type, alignment = @alignment, origin = @origin, size = @size, px = @px, armor = @armor, hp = @hp, speed = @speed, str = @str, dex = @dex, con = @con, int = @int, wis = @wis, car = @car, savingThrows = @savingThrows, skills = @skills, senses = @senses, languages = @languages, damageResistances = @damageResistances, damageImmunities = @damageImmunities, conditionImmunities = @conditionImmunities, damageVulnerabilities = @damageVulnerabilities, traits = @traits, actions = @actions, legendaryActions = @legendaryActions, reactions = @reactions, description = @description, image = @image WHERE id = @id');
        const info = stmt.run(monsterToUpdate);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteMonster(monsterId) {
    try {
        const stmt = db.prepare('DELETE FROM monsters WHERE id = ?');
        const info = stmt.run(monsterId);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteAllMonsters() {
    try {
        const stmt = db.prepare('DELETE FROM monsters');
        const info = stmt.run();
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function getMaps() {
    console.log('Backend: getMaps called');
    try {
        const stmt = db.prepare('SELECT m.*, s.name AS song_name, s.filePath AS song_filePath, c.name AS campaign_name, s_easy.name AS easy_battle_song_name, s_easy.filePath AS easy_battle_song_filePath, s_medium.name AS medium_battle_song_name, s_medium.filePath AS medium_battle_song_filePath, s_hard.name AS hard_battle_song_name, s_hard.filePath AS hard_battle_song_filePath, s_deadly.name AS deadly_battle_song_name, s_deadly.filePath AS deadly_battle_song_filePath, s_extreme.name AS extreme_battle_song_name, s_extreme.filePath AS extreme_battle_song_filePath FROM maps m LEFT JOIN songs s ON m.song_id = s.id LEFT JOIN campaigns c ON m.campaign_id = c.id LEFT JOIN songs s_easy ON m.easy_battle_song_id = s_easy.id LEFT JOIN songs s_medium ON m.medium_battle_song_id = s_medium.id LEFT JOIN songs s_hard ON m.hard_battle_song_id = s_hard.id LEFT JOIN songs s_deadly ON m.deadly_battle_song_id = s_deadly.id LEFT JOIN songs s_extreme ON m.extreme_battle_song_id = s_extreme.id');
        const data = stmt.all();
        const mapsWithImageData = data.map(map => {
            const newMap = { ...map }; // Create a copy to avoid modifying the original map object
            if (newMap.image_data) {
                newMap.image_data = `data:image/png;base64,${newMap.image_data.toString('base64')}`;
            }
            // If song_filePath exists, extract only the filename
            if (newMap.song_filePath) {
                newMap.song_filePath = path.basename(newMap.song_filePath);
            }
            if (newMap.easy_battle_song_filePath) {
                newMap.easy_battle_song_filePath = path.basename(newMap.easy_battle_song_filePath);
            }
            if (newMap.medium_battle_song_filePath) {
                newMap.medium_battle_song_filePath = path.basename(newMap.medium_battle_song_filePath);
            }
            if (newMap.hard_battle_song_filePath) {
                newMap.hard_battle_song_filePath = path.basename(newMap.hard_battle_song_filePath);
            }
            if (newMap.deadly_battle_song_filePath) {
                newMap.deadly_battle_song_filePath = path.basename(newMap.deadly_battle_song_filePath);
            }
            if (newMap.extreme_battle_song_filePath) {
                newMap.extreme_battle_song_filePath = path.basename(newMap.extreme_battle_song_filePath);
            }
            return newMap;
        });
        console.log('Backend: getMaps successful');
        return { success: true, data: mapsWithImageData };
    } catch (error) {
        console.error('Backend: Error in getMaps:', error.message);
        return { success: false, error: error.message };
    }
}

function addMap(map) {
    console.log('Backend: addMap called with:', map.name);
    try {
        let imageDataBuffer = null;
        if (map.image_data) {
            const base64Data = map.image_data.replace(/^data:image\/\w+;base64,/, "");
            imageDataBuffer = Buffer.from(base64Data, 'base64');
        }

        const newMapId = map.id || generateBackendId('map'); // Generate ID if not provided

        const stmt = db.prepare('INSERT INTO maps (id, name, group_name, url, imagePath, image_data, keepOpen, zoom, rotation, panX, panY, original_width, original_height, notes, song_id, campaign_id, easy_battle_song_id, medium_battle_song_id, hard_battle_song_id, deadly_battle_song_id, extreme_battle_song_id) VALUES (@id, @name, @group_name, @url, @imagePath, @image_data, @keepOpen, @zoom, @rotation, @panX, @panY, @original_width, @original_height, @notes, @song_id, @campaign_id, @easy_battle_song_id, @medium_battle_song_id, @hard_battle_song_id, @deadly_battle_song_id, @extreme_battle_song_id)');
        const mapToInsert = {
            id: newMapId,
            name: map.name,
            group_name: map.group_name || null,
            url: map.url || null,
            imagePath: map.imagePath || null,
            image_data: imageDataBuffer,
            keepOpen: map.keepOpen ? 1 : 0,
            zoom: map.zoom || 1,
            rotation: map.rotation || 0,
            panX: map.panX || 0,
            panY: map.panY || 0,
            original_width: map.originalWidth || null,
            original_height: map.originalHeight || null,
            notes: map.notes || null,
            song_id: map.song_id || null,
            campaign_id: map.campaign_id || null,
            easy_battle_song_id: map.easy_battle_song_id || null,
            medium_battle_song_id: map.medium_battle_song_id || null,
            hard_battle_song_id: map.hard_battle_song_id || null,
            deadly_battle_song_id: map.deadly_battle_song_id || null,
            extreme_battle_song_id: map.extreme_battle_song_id || null
        };
        const info = stmt.run(mapToInsert);
        console.log('Backend: addMap successful, info:', info);
        return { success: true, id: newMapId }; // Return the newly generated ID
    } catch (error) {
        console.error('Backend: Error in addMap:', error.message);
        return { success: false, error: error.message };
    }
}

function addMaps(maps) {
    const stmt = db.prepare('INSERT INTO maps (id, name, group_name, url, imagePath, image_data, keepOpen, zoom, rotation, panX, panY, original_width, original_height, notes, song_id, campaign_id) VALUES (@id, @name, @group_name, @url, @imagePath, @image_data, @keepOpen, @zoom, @rotation, @panX, @panY, @original_width, @original_height, @notes, @song_id, @campaign_id)');
    const transaction = db.transaction((maps) => {
        const ids = [];
        for (const map of maps) {
            let imageDataBuffer = null;
            if (map.image_data) {
                const base64Data = map.image_data.replace(/^data:image\/\w+;base64,/, "");
                imageDataBuffer = Buffer.from(base64Data, 'base64');
            }
            const newMapId = map.id || generateBackendId('map'); // Generate ID if not provided
            const mapToInsert = {
                id: newMapId,
                name: map.name,
                group_name: map.group_name || null,
                url: map.url || null,
                imagePath: map.imagePath || null,
                image_data: imageDataBuffer,
                keepOpen: map.keepOpen ? 1 : 0,
                zoom: map.zoom || 1,
                rotation: map.rotation || 0,
                panX: map.panX || 0,
                panY: map.panY || 0,
                original_width: map.originalWidth || null,
                original_height: map.originalHeight || null,
                notes: map.notes || null,
                song_id: map.song_id || null,
                campaign_id: map.campaign_id || null
            };
            stmt.run(mapToInsert);
            ids.push({ id: newMapId }); // Return the newly generated ID
        }
        return ids;
    });

    try {
        const ids = transaction(maps);
        return { success: true, ids };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function updateMap(map) {
    console.log('Backend: updateMap called with:', map.name);
    try {
        let imageDataBuffer = null;
        if (map.image_data && map.image_data.startsWith('data:image')) {
            const base64Data = map.image_data.replace(/^data:image\/\w+;base64,/, "");
            imageDataBuffer = Buffer.from(base64Data, 'base64');
        }

        const stmt = db.prepare('UPDATE maps SET name = @name, group_name = @group_name, url = @url, imagePath = @imagePath, image_data = @image_data, keepOpen = @keepOpen, zoom = @zoom, rotation = @rotation, panX = @panX, panY = @panY, original_width = @original_width, original_height = @original_height, notes = @notes, song_id = @song_id, campaign_id = @campaign_id, easy_battle_song_id = @easy_battle_song_id, medium_battle_song_id = @medium_battle_song_id, hard_battle_song_id = @hard_battle_song_id, deadly_battle_song_id = @deadly_battle_song_id, extreme_battle_song_id = @extreme_battle_song_id WHERE id = @id');
        const mapToUpdate = {
            id: map.id,
            name: map.name,
            group_name: map.group_name || null,
            url: map.url || null,
            imagePath: map.imagePath || null,
            image_data: imageDataBuffer,
            keepOpen: map.keepOpen ? 1 : 0,
            zoom: map.zoom || 1,
            rotation: map.rotation || 0,
            panX: map.panX || 0,
            panY: map.panY || 0,
            original_width: map.originalWidth || null,
            original_height: map.originalHeight || null,
            notes: map.notes || null,
            song_id: map.song_id || null,
            campaign_id: map.campaign_id || null,
            easy_battle_song_id: map.easy_battle_song_id || null,
            medium_battle_song_id: map.medium_battle_song_id || null,
            hard_battle_song_id: map.hard_battle_song_id || null,
            deadly_battle_song_id: map.deadly_battle_song_id || null,
            extreme_battle_song_id: map.extreme_battle_song_id || null
        };
        const info = stmt.run(mapToUpdate);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteMap(mapId) {
    console.log('Backend: deleteMap called with ID:', mapId);
    try {
        const stmt = db.prepare('DELETE FROM maps WHERE id = ?');
        const info = stmt.run(mapId);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Shop CRUD
function getShops() {
    try {
        const shops = db.prepare('SELECT * FROM shops').all();
        const categories = db.prepare('SELECT * FROM categories').all();
        const items = db.prepare('SELECT * FROM items').all();

        const shopsMap = new Map(shops.map(s => [s.id, { ...s, categories: [] }]));
        const categoriesMap = new Map(categories.map(c => [
            c.id, 
            { 
                ...c, 
                columns: c.columns_definition ? JSON.parse(c.columns_definition) : [], 
                items: [] 
            }
        ]));

        items.forEach(item => {
            if (categoriesMap.has(item.category_id)) {
                categoriesMap.get(item.category_id).items.push({ ...item, ...JSON.parse(item.data) });
            }
        });

        categories.forEach(category => {
            if (shopsMap.has(category.shop_id)) {
                shopsMap.get(category.shop_id).categories.push(categoriesMap.get(category.id));
            }
        });

        return { success: true, data: Array.from(shopsMap.values()) };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function addShop(shop) {
    try {
        const newShopId = generateBackendId('shop');
        const stmt = db.prepare('INSERT INTO shops (id, name) VALUES (@id, @name)');
        const info = stmt.run({ id: newShopId, name: shop.name });
        return { success: true, id: newShopId };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function updateShop(shop) {
    try {
        const stmt = db.prepare('UPDATE shops SET name = @name WHERE id = @id');
        const info = stmt.run(shop);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteShop(shopId) {
    try {
        db.transaction(() => {
            const categories = db.prepare('SELECT id FROM categories WHERE shop_id = ?').all(shopId);
            const categoryIds = categories.map(c => c.id);
            if (categoryIds.length > 0) {
                const placeholders = categoryIds.map(() => '?').join(',');
                db.prepare(`DELETE FROM items WHERE category_id IN (${placeholders})`).run(...categoryIds);
            }
            db.prepare('DELETE FROM categories WHERE shop_id = ?').run(shopId);
            db.prepare('DELETE FROM shops WHERE id = ?').run(shopId);
        })();
        return { success: true, changes: 1 }; // Indicate at least one change
    } catch (error) {
        return { success: false, error: error.message };
    }
}


function deleteAllShops() {
    try {
        db.transaction(() => {
            db.prepare('DELETE FROM items').run();
            db.prepare('DELETE FROM categories').run();
            db.prepare('DELETE FROM shops').run();
        })();
        return { success: true, changes: 1 };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function syncShops(shops) {
    try {
        deleteAllShops();
        const insertShop = db.prepare('INSERT INTO shops (id, name) VALUES (@id, @name)');
        const insertCategory = db.prepare('INSERT INTO categories (id, shop_id, name, columns_definition) VALUES (@id, @shop_id, @name, @columns_definition)');
        const insertItem = db.prepare('INSERT INTO items (id, category_id, data) VALUES (@id, @category_id, @data)');

        db.transaction((data) => {
            for (const shop of data) {
                insertShop.run({ id: shop.id, name: shop.name });
                if (shop.categories) {
                    for (const category of shop.categories) {
                        insertCategory.run({
                            id: category.id,
                            shop_id: shop.id,
                            name: category.name,
                            columns_definition: JSON.stringify(category.columns || [])
                        });
                        if (category.items) {
                            for (const item of category.items) {
                                insertItem.run({
                                    id: item.id,
                                    category_id: item.category_id, // Use item.category_id directly
                                    data: JSON.stringify(item.data || {})
                                });
                            }
                        }
                    }
                }
            }
        })(shops);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Category CRUD
function addCategory(category) {
    try {
        const stmt = db.prepare('INSERT INTO categories (id, shop_id, name, columns_definition) VALUES (@id, @shop_id, @name, @columns_definition)');
        const info = stmt.run({
            id: category.id,
            shop_id: category.shop_id,
            name: category.name,
            columns_definition: JSON.stringify(category.columns || [])
        });
        return { success: true, id: category.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function updateCategory(category) {
    try {
        const stmt = db.prepare('UPDATE categories SET name = @name, columns_definition = @columns_definition WHERE id = @id');
        const info = stmt.run({
            id: category.id,
            name: category.name,
            columns_definition: JSON.stringify(category.columns || [])
        });
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteCategory(categoryId) {
    try {
        db.transaction(() => {
            db.prepare('DELETE FROM items WHERE category_id = ?').run(categoryId);
            db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId);
        })();
        return { success: true, changes: 1 };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function getCategoryById(categoryId) {
    console.log(`Backend: getCategoryById called with ID: ${categoryId}`);
    try {
        const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
        const category = stmt.get(categoryId);
        console.log('Backend: Raw category from DB:', category);
        if (category && category.columns_definition) {
            category.columns = JSON.parse(category.columns_definition);
            console.log('Backend: Parsed category columns:', category.columns);
        } else {
            category.columns = [];
            console.log('Backend: No columns_definition or category found, setting empty array.');
        }
        console.log('Backend: Returning category:', category);
        return { success: true, data: category };
    } catch (error) {
        console.error('Backend: Error in getCategoryById:', error.message);
        return { success: false, error: error.message };
    }
}

// Item CRUD
function addItem(item) {
    try {
        const stmt = db.prepare('INSERT INTO items (id, category_id, data) VALUES (@id, @category_id, @data)');
        const info = stmt.run({
            id: item.id,
            category_id: item.category_id,
            data: JSON.stringify(item.data || {})
        });
        return { success: true, id: item.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function updateItem(item) {
    try {
        const stmt = db.prepare('UPDATE items SET data = @data WHERE id = @id');
        const info = stmt.run({
            id: item.id,
            data: JSON.stringify(item.data || {})
        });
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteItem(itemId) {
    try {
        const stmt = db.prepare('DELETE FROM items WHERE id = ?');
        const info = stmt.run(itemId);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}


// Song CRUD
function getSongs() {
    try {
        const stmt = db.prepare('SELECT * FROM songs');
        return { success: true, data: stmt.all() };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function addSong(song) {
    console.log('Adding song to database:', song);
    try {
        const songToInsert = {
            id: song.id,
            name: song.name,
            group_name: song.group, // Map 'group' from frontend to 'group_name' for DB
            filePath: song.filePath
        };
        const stmt = db.prepare('INSERT INTO songs (id, name, group_name, filePath) VALUES (@id, @name, @group_name, @filePath)');
        const info = stmt.run(songToInsert);
        console.log('Song added successfully:', info);
        return { success: true, id: song.id }; // Return the ID that was passed in
    } catch (error) {
        console.error('Error adding song to database:', error);
        return { success: false, error: error.message };
    }
}

function updateSong(song) {
    try {
        const songToUpdate = {
            id: song.id,
            name: song.name,
            group_name: song.group, // Map 'group' from frontend to 'group_name' for DB
            filePath: song.filePath
        };
        const stmt = db.prepare('UPDATE songs SET name = @name, group_name = @group_name, filePath = @filePath WHERE id = @id');
        const info = stmt.run(songToUpdate);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteSong(songId) {
    try {
        // Check if the song is associated with any map
        const referringMaps = db.prepare('SELECT id, name FROM maps WHERE song_id = ?').all(songId);
        if (referringMaps.length > 0) {
            const mapNames = referringMaps.map(m => m.name).join(', ');
            return { success: false, error: `La canción no se puede eliminar porque está asociada a los siguientes mapas: ${mapNames}` };
        }

        // Get file path before deleting the song record
        const song = db.prepare('SELECT filePath FROM songs WHERE id = ?').get(songId);
        if (!song) {
            return { success: false, error: 'No se encontró la canción para eliminar.' };
        }

        // Delete the song from the database
        const stmt = db.prepare('DELETE FROM songs WHERE id = ?');
        const info = stmt.run(songId);

        if (info.changes > 0) {
            // If the DB delete was successful, delete the physical file
            try {
                if (fs.existsSync(song.filePath)) {
                    fs.unlinkSync(song.filePath);
                    console.log(`Archivo de audio eliminado: ${song.filePath}`);
                }
            } catch (fileError) {
                console.error(`Error al eliminar el archivo de audio ${song.filePath}:`, fileError);
                // We don't return an error here, as the main DB operation was successful
            }
        }

        return { success: true, changes: info.changes };
    } catch (error) {
        console.error('Error al eliminar la canción:', error);
        return { success: false, error: error.message };
    }
}

// Campaign CRUD
function getCampaigns() {
    try {
        const stmt = db.prepare('SELECT * FROM campaigns');
        const data = stmt.all();
        const campaignsWithImageData = data.map(campaign => {
            const newCampaign = { ...campaign };
            if (newCampaign.image_data) {
                newCampaign.image_data = `data:image/png;base64,${newCampaign.image_data.toString('base64')}`;
            }
            return newCampaign;
        });
        return { success: true, data: campaignsWithImageData };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function addCampaign(campaign) {
    try {
        let imageDataBuffer = null;
        if (campaign.image_data) {
            const base64Data = campaign.image_data.replace(/^data:image\/\w+;base64,/, "");
            imageDataBuffer = Buffer.from(base64Data, 'base64');
        }
        const stmt = db.prepare('INSERT INTO campaigns (id, name, image_data, description, author, game, participants, notes) VALUES (@id, @name, @image_data, @description, @author, @game, @participants, @notes)');
        const campaignToInsert = { ...campaign, image_data: imageDataBuffer };
        const info = stmt.run(campaignToInsert);
        return { success: true, id: campaign.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function updateCampaign(campaign) {
    try {
        let imageDataBuffer = null;
        if (campaign.image_data && campaign.image_data.startsWith('data:image')) {
            const base64Data = campaign.image_data.replace(/^data:image\/\w+;base64,/, "");
            imageDataBuffer = Buffer.from(base64Data, 'base64');
        }
        const stmt = db.prepare('UPDATE campaigns SET name = @name, image_data = @image_data, description = @description, author = @author, game = @game, participants = @participants, notes = @notes WHERE id = @id');
        const campaignToUpdate = { ...campaign, image_data: imageDataBuffer };
        const info = stmt.run(campaignToUpdate);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteCampaign(campaignId) {
    try {
        const stmt = db.prepare('DELETE FROM campaigns WHERE id = ?');
        const info = stmt.run(campaignId);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Character CRUD
function getCharacters(campaignId = null) {
    try {
        let stmt;
        if (campaignId) {
            stmt = db.prepare('SELECT c.*, ca.name AS campaign_name FROM characters c LEFT JOIN campaigns ca ON c.campaign_id = ca.id WHERE c.campaign_id = ?');
            return { success: true, data: stmt.all(campaignId).map(char => {
                if (char.image) {
                    char.image = `data:image/png;base64,${char.image.toString('base64')}`;
                }
                return char;
            }) };
        } else {
            stmt = db.prepare('SELECT c.*, ca.name AS campaign_name FROM characters c LEFT JOIN campaigns ca ON c.campaign_id = ca.id');
            return { success: true, data: stmt.all().map(char => {
                if (char.image) {
                    char.image = `data:image/png;base64,${char.image.toString('base64')}`;
                }
                return char;
            }) };
        }
    } catch (error) {
        console.error('Backend: Error in getCharacters:', error.message);
        return { success: false, error: error.message };
    }
}

function addCharacter(character) {
    console.log('Backend: addCharacter called with:', character.name);
    try {
        let imageDataBuffer = null;
        if (character.image) {
            const base64Data = character.image.replace(/^data:image\/\w+;base64,/, "");
            imageDataBuffer = Buffer.from(base64Data, 'base64');
        }

        const stmt = db.prepare('INSERT INTO characters (id, name, class, level, background, race, alignment, playerName, experiencePoints, strength, dexterity, constitution, intelligence, wisdom, charisma, proficiencyBonus, armorClass, initiative, speed, maxHitPoints, currentHitPoints, temporaryHitPoints, hitDice, otherProficienciesAndLanguages, equipment, featuresAndTraits, age, height, weight, eyes, skin, hair, image, spellcastingAbility, spellSaveDC, spellAttackBonus, campaign_id, is_player_character) VALUES (@id, @name, @class, @level, @background, @race, @alignment, @playerName, @experiencePoints, @strength, @dexterity, @constitution, @intelligence, @wisdom, @charisma, @proficiencyBonus, @armorClass, @initiative, @speed, @maxHitPoints, @currentHitPoints, @temporaryHitPoints, @hitDice, @otherProficienciesAndLanguages, @equipment, @featuresAndTraits, age, height, weight, eyes, skin, hair, image, spellcastingAbility, spellSaveDC, spellAttackBonus, campaign_id, is_player_character)');
        const characterToInsert = {
            ...character,
            image: imageDataBuffer,
            level: character.level || null,
            experiencePoints: character.experiencePoints || null,
            strength: character.strength || null,
            dexterity: character.dexterity || null,
            constitution: character.constitution || null,
            intelligence: character.intelligence || null,
            wisdom: character.wisdom || null,
            charisma: character.charisma || null,
            proficiencyBonus: character.proficiencyBonus || null,
            armorClass: character.armorClass || null,
            initiative: character.initiative || null,
            speed: character.speed || null,
            maxHitPoints: character.maxHitPoints || null,
            currentHitPoints: character.currentHitPoints || null,
            temporaryHitPoints: character.temporaryHitPoints || null,
            spellSaveDC: character.spellSaveDC || null,
            spellAttackBonus: character.spellAttackBonus || null,
            is_player_character: character.is_player_character ? 1 : 0, // Ensure boolean is stored as 0 or 1
        };
        const info = stmt.run(characterToInsert);
        console.log('Backend: addCharacter successful, info:', info);
        return { success: true, id: character.id };
    } catch (error) {
        console.error('Backend: Error in addCharacter:', error.message);
        return { success: false, error: error.message };
    }
}

function updateCharacter(character) {
    console.log('Backend: updateCharacter called with:', character.name);
    console.log('Backend: Raw character object received:', character); // NEW LOG
    try {
        let imageDataBuffer = null;
        if (typeof character.image === 'string' && character.image.startsWith('data:image')) {
            try {
                const base64Data = character.image.replace(/^data:image\/\w+;base64,/, "");
                imageDataBuffer = Buffer.from(base64Data, 'base64');
            } catch (imageError) {
                console.error('Backend: Error processing image data for character', character.id, ':', imageError.message);
                imageDataBuffer = null;
            }
        } else if (character.image instanceof Buffer) {
            imageDataBuffer = character.image;
        } else if (character.image === null) {
            imageDataBuffer = null;
        } else if (character.image && typeof character.image === 'object' && character.image.type === 'Buffer' && Array.isArray(character.image.data)) {
            // This is the case where the image is already a Buffer object from the database
            imageDataBuffer = Buffer.from(character.image.data);
        }
        const stmt = db.prepare('UPDATE characters SET name = @name, class = @class, level = @level, background = @background, race = @race, alignment = @alignment, playerName = @playerName, experiencePoints = @experiencePoints, strength = @strength, dexterity = @dexterity, constitution = @constitution, intelligence = @intelligence, wisdom = @wisdom, charisma = @charisma, proficiencyBonus = @proficiencyBonus, armorClass = @armorClass, initiative = @initiative, speed = @speed, maxHitPoints = @maxHitPoints, currentHitPoints = @currentHitPoints, temporaryHitPoints = @temporaryHitPoints, hitDice = @hitDice, otherProficienciesAndLanguages = @otherProficienciesAndLanguages, equipment = @equipment, featuresAndTraits = @featuresAndTraits, age = @age, height = @height, weight = @weight, eyes = @eyes, skin = @skin, hair = @hair, image = @image, spellcastingAbility = @spellcastingAbility, spellSaveDC = @spellSaveDC, spellAttackBonus = @spellAttackBonus, campaign_id = @campaign_id, is_player_character = @is_player_character WHERE id = @id');
        const characterToUpdate = {
            ...character,
            image: imageDataBuffer,
            level: character.level || null,
            experiencePoints: character.experiencePoints || null,
            strength: character.strength || null,
            dexterity: character.dexterity || null,
            constitution: character.constitution || null,
            intelligence: character.intelligence || null,
            wisdom: character.wisdom || null,
            charisma: character.charisma || null,
            proficiencyBonus: character.proficiencyBonus || null,
            armorClass: character.armorClass || null,
            initiative: character.initiative || null,
            speed: character.speed || null,
            maxHitPoints: character.maxHitPoints || null,
            currentHitPoints: character.currentHitPoints || null,
            temporaryHitPoints: character.temporaryHitPoints || null,
            spellSaveDC: character.spellSaveDC || null,
            spellAttackBonus: character.spellAttackBonus || null,
            is_player_character: character.is_player_character ? 1 : 0, // Ensure boolean is stored as 0 or 1
        };
        console.log('Backend: updateCharacter received (after processing):', characterToUpdate); // Renamed this log for clarity
        const info = stmt.run(characterToUpdate);
        return { success: true, changes: info.changes };
    } catch (error) {
        console.error('Backend: Error in updateCharacter (outer catch):', error.message);
        return { success: false, error: error.message };
    }
}

function deleteCharacter(characterId) {
    console.log('Backend: deleteCharacter called with ID:', characterId);
    try {
        const stmt = db.prepare('DELETE FROM characters WHERE id = ?');
        const info = stmt.run(characterId);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Encounter CRUD
function getEncounters() {
    try {
        const encounters = db.prepare(`
            SELECT 
                e.id, e.name, e.campaign_id, e.song_id,
                e.easy_battle_song_id, e.medium_battle_song_id, e.hard_battle_song_id, e.deadly_battle_song_id, e.extreme_battle_song_id,
                c.name as campaign_name,
                s.name as song_name,
                s_easy.name AS easy_battle_song_name, s_easy.filePath AS easy_battle_song_filePath,
                s_medium.name AS medium_battle_song_name, s_medium.filePath AS medium_battle_song_filePath,
                s_hard.name AS hard_battle_song_name, s_hard.filePath AS hard_battle_song_filePath,
                s_deadly.name AS deadly_battle_song_name, s_deadly.filePath AS deadly_battle_song_filePath,
                s_extreme.name AS extreme_battle_song_name, s_extreme.filePath AS extreme_battle_song_filePath
            FROM encounters e
            LEFT JOIN campaigns c ON e.campaign_id = c.id
            LEFT JOIN songs s ON e.song_id = s.id
            LEFT JOIN songs s_easy ON e.easy_battle_song_id = s_easy.id
            LEFT JOIN songs s_medium ON e.medium_battle_song_id = s_medium.id
            LEFT JOIN songs s_hard ON e.hard_battle_song_id = s_hard.id
            LEFT JOIN songs s_deadly ON e.deadly_battle_song_id = s_deadly.id
            LEFT JOIN songs s_extreme ON e.extreme_battle_song_id = s_extreme.id
        `).all();

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

        for (const encounter of encounters) {
            encounter.monsters = monsterStmt.all(encounter.id);
            encounter.characters = characterStmt.all(encounter.id);
        }

        return { success: true, data: encounters };
    } catch (error) {
        console.error("Error in getEncounters:", error);
        return { success: false, error: error.message };
    }
}

function getEncounterById(encounterId) {
    try {
        const encounter = db.prepare(`
            SELECT 
                e.id, e.name, e.campaign_id, e.song_id,
                e.easy_battle_song_id, e.medium_battle_song_id, e.hard_battle_song_id, e.deadly_battle_song_id, e.extreme_battle_song_id,
                c.name as campaign_name,
                s.name as song_name,
                s_easy.name AS easy_battle_song_name, s_easy.filePath AS easy_battle_song_filePath,
                s_medium.name AS medium_battle_song_name, s_medium.filePath AS medium_battle_song_filePath,
                s_hard.name AS hard_battle_song_name, s_hard.filePath AS hard_battle_song_filePath,
                s_deadly.name AS deadly_battle_song_name, s_deadly.filePath AS deadly_battle_song_filePath,
                s_extreme.name AS extreme_battle_song_name, s_extreme.filePath AS extreme_battle_song_filePath
            FROM encounters e
            LEFT JOIN campaigns c ON e.campaign_id = c.id
            LEFT JOIN songs s ON e.song_id = s.id
            LEFT JOIN songs s_easy ON e.easy_battle_song_id = s_easy.id
            LEFT JOIN songs s_medium ON e.medium_battle_song_id = s_medium.id
            LEFT JOIN songs s_hard ON e.hard_battle_song_id = s_hard.id
            LEFT JOIN songs s_deadly ON e.deadly_battle_song_id = s_deadly.id
            LEFT JOIN songs s_extreme ON e.extreme_battle_song_id = s_extreme.id
            WHERE e.id = ?
        `).get(encounterId);

        if (!encounter) {
            return { success: false, error: "Encounter not found" };
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

        return { success: true, data: encounter };
    } catch (error) {
        console.error("Error in getEncounterById:", error);
        return { success: false, error: error.message };
    }
}

const addEncounter = db.transaction((encounter) => {
    try {
        const { id, name, campaign_id, song_id, easy_battle_song_id, medium_battle_song_id, hard_battle_song_id, deadly_battle_song_id, extreme_battle_song_id, monsters, characters } = encounter;
        
        // Insert into encounters table
        const encounterStmt = db.prepare('INSERT INTO encounters (id, name, campaign_id, song_id, easy_battle_song_id, medium_battle_song_id, hard_battle_song_id, deadly_battle_song_id, extreme_battle_song_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        encounterStmt.run(id, name, campaign_id, song_id, easy_battle_song_id, medium_battle_song_id, hard_battle_song_id, deadly_battle_song_id, extreme_battle_song_id);

        // Insert into encounter_monsters
        const monsterStmt = db.prepare('INSERT INTO encounter_monsters (encounter_id, monster_id) VALUES (?, ?)');
        for (const monsterId of monsters) {
            monsterStmt.run(id, monsterId);
        }

        // Insert into encounter_characters
        const characterStmt = db.prepare('INSERT INTO encounter_characters (encounter_id, character_id) VALUES (?, ?)');
        for (const characterId of characters) {
            characterStmt.run(id, characterId);
        }

        return { success: true, id: id };
    } catch (error) {
        console.error("Error in addEncounter transaction:", error);
        // How to handle error return in a transaction?
        // For now, we rely on the outer try-catch of the endpoint.
        throw error;
    }
});

const updateEncounter = db.transaction((encounter) => {
    try {
        const { id, name, campaign_id, song_id, easy_battle_song_id, medium_battle_song_id, hard_battle_song_id, deadly_battle_song_id, extreme_battle_song_id, monsters, characters } = encounter;

        // Update encounters table
        const encounterStmt = db.prepare('UPDATE encounters SET name = ?, campaign_id = ?, song_id = ?, easy_battle_song_id = ?, medium_battle_song_id = ?, hard_battle_song_id = ?, deadly_battle_song_id = ?, extreme_battle_song_id = ? WHERE id = ?');
        encounterStmt.run(name, campaign_id, song_id, easy_battle_song_id, medium_battle_song_id, hard_battle_song_id, deadly_battle_song_id, extreme_battle_song_id, id);

        // Clear old associations
        db.prepare('DELETE FROM encounter_monsters WHERE encounter_id = ?').run(id);
        db.prepare('DELETE FROM encounter_characters WHERE encounter_id = ?').run(id);

        // Insert new associations
        const monsterStmt = db.prepare('INSERT INTO encounter_monsters (encounter_id, monster_id) VALUES (?, ?)');
        for (const monsterId of monsters) {
            monsterStmt.run(id, monsterId);
        }

        const characterStmt = db.prepare('INSERT INTO encounter_characters (encounter_id, character_id) VALUES (?, ?)');
        for (const characterId of characters) {
            characterStmt.run(id, characterId);
        }

        return { success: true, id: id };
    } catch (error) {
        console.error("Error in updateEncounter transaction:", error);
        throw error;
    }
});

function deleteEncounter(encounterId) {
    try {
        const stmt = db.prepare('DELETE FROM encounters WHERE id = ?');
        const info = stmt.run(encounterId);
        // ON DELETE CASCADE will handle the junction tables
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}


// Function to migrate data from JSON
function migrateDataFromJsons() {
    console.log('Comprobando si es necesaria la migración de datos...');
    // Migrate Monsters
    const monsterCount = db.prepare('SELECT COUNT(*) as count FROM monsters').get().count;
    if (monsterCount === 0 && fs.existsSync(monstersFilePath)) {
        const monsters = JSON.parse(fs.readFileSync(monstersFilePath, 'utf8'));
        const insert = db.prepare('INSERT INTO monsters (id, name, vd, type, alignment, origin, size, px, armor, hp, speed, str, dex, con, int, wis, car, savingThrows, skills, senses, languages, damageResistances, damageImmunities, conditionImmunities, damageVulnerabilities, traits, actions, legendaryActions, reactions, description, image) VALUES (@id, @name, @vd, @type, @alignment, @origin, @size, @px, @armor, @hp, @speed, @str, @dex, @con, @int, @wis, @car, @savingThrows, @skills, @senses, @languages, @damageResistances, @damageImmunities, @conditionImmunities, @damageVulnerabilities, @traits, @actions, @legendaryActions, @reactions, @description, @image)');
        db.transaction((data) => {
            for (const monster of data) insert.run(monster);
        })(monsters);
        console.log(`${monsters.length} monstruos migrados.`);
    }

    // Migrate Maps
    const mapCount = db.prepare('SELECT COUNT(*) as count FROM maps').get().count;
    if (mapCount === 0 && fs.existsSync(mapsFilePath)) {
        const maps = JSON.parse(fs.readFileSync(mapsFilePath, 'utf8'));
        const insert = db.prepare('INSERT INTO maps (id, name, group_name, url, imagePath, keepOpen, zoom, rotation, panX, panY) VALUES (@id, @name, @group_name, @url, @imagePath, @keepOpen, @zoom, @rotation, @panX, @panY)');
        
        const insertManyMaps = db.transaction((data) => {
            for (const map of data) {
                const mapToInsert = {
                    id: map.id,
                    name: map.name,
                    group_name: map.group, // Mapeo correcto
                    url: map.url,
                    imagePath: map.imagePath,
                    keepOpen: map.keepOpen ? 1 : 0,
                    zoom: map.zoom ?? 1,
                    rotation: map.rotation ?? 0,
                    panX: map.panX ?? 0,
                    panY: map.panY ?? 0
                };
                insert.run(mapToInsert);
            }
        });

        insertManyMaps(maps);
        console.log(`${maps.length} mapas migrados.`);
    }

    // Migrate Tiendas
    const shopCount = db.prepare('SELECT COUNT(*) as count FROM shops').get().count;
    if (shopCount === 0 && fs.existsSync(shopsFilePath)) {
        const shops = JSON.parse(fs.readFileSync(shopsFilePath, 'utf8'));
        const insertShop = db.prepare('INSERT INTO shops (id, name) VALUES (@id, @name)');
        const insertCategory = db.prepare('INSERT INTO categories (id, shop_id, name, columns_definition) VALUES (@id, @shop_id, @name, @columns_definition)');
        const insertItem = db.prepare('INSERT INTO items (id, category_id, data) VALUES (@id, @category_id, @data)');
        
        db.transaction((data) => {
            const oldCategoryIdToNewCategoryIdMap = new Map();

            for (const shop of data) {
                const newShopId = generateBackendId('shop');
                insertShop.run({ id: newShopId, name: shop.name });
                if (shop.categories) {
                    for (const category of shop.categories) {
                        const newCategoryId = generateBackendId('category');
                        oldCategoryIdToNewCategoryIdMap.set(category.id, newCategoryId);

                        let columns = [];
                        if (category.name.toLowerCase().includes('armas')) {
                            columns = [
                                { name: 'Nombre', type: 'text' },
                                { name: 'Tipo', type: 'text' },
                                { name: 'Precio', type: 'text' },
                                { name: 'Daño', type: 'text' },
                                { name: 'Peso', type: 'text' },
                                { name: 'Propiedades', type: 'text' },
                                { name: 'Origen', type: 'text' }
                            ];
                        } else if (category.name.toLowerCase().includes('armaduras')) {
                            columns = [
                                { name: 'Nombre', type: 'text' },
                                { name: 'Tipo', type: 'text' },
                                { name: 'Precio', type: 'text' },
                                { name: 'Tipo de armadura', type: 'text' },
                                { name: 'Clase de Armadura (CA)', type: 'text' },
                                { name: 'Fuerza', type: 'text' },
                                { name: 'Sigilo', type: 'text' },
                                { name: 'Origen', type: 'text' }
                            ];
                        }

                        insertCategory.run({
                            id: newCategoryId,
                            shop_id: newShopId,
                            name: category.name,
                            columns_definition: JSON.stringify(columns)
                        });
                        if (category.items) {
                            for (const item of category.items) {
                                const newItemId = generateBackendId('item');
                                let itemData = {};
                                if (category.name.toLowerCase().includes('armas')) {
                                    itemData = {
                                        Nombre: item.name,
                                        Tipo: item.type,
                                        Precio: item.price,
                                        Daño: item.damage,
                                        Peso: item.weight,
                                        Propiedades: item.properties,
                                        Origen: item.origin
                                    };
                                } else if (category.name.toLowerCase().includes('armaduras')) {
                                    itemData = {
                                        Nombre: item.name,
                                        Tipo: item.type,
                                        Precio: item.price,
                                        "Tipo de armadura": item.type,
                                        "Clase de Armadura (CA)": item.armorClass,
                                        Fuerza: item.strength,
                                        Sigilo: item.stealth,
                                        Origen: item.origin
                                    };
                                }
                                insertItem.run({
                                    id: newItemId,
                                    category_id: newCategoryId, // Use the newly generated category ID
                                    data: JSON.stringify(itemData)
                                });
                            }
                        }
                    }
                }
            }
        })(shops);
        console.log(`${shops.length} tiendas migradas.`);
    }
    console.log('Migración de datos completada.');
}

// Exportamos
// Spell CRUD
function getSpells() {
    try {
        const stmt = db.prepare('SELECT * FROM spells');
        return { success: true, data: stmt.all() };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function addSpell(spell) {
    console.log('Backend: addSpell called with:', spell);
    try {
        const spellToInsert = {
            ...spell,
            level: spell.level === '' ? null : parseInt(spell.level, 10),
            is_ritual: spell.is_ritual ? 1 : 0,
            requires_concentration: spell.requires_concentration ? 1 : 0,
            has_material_components: spell.has_material_components ? 1 : 0
        };
        const stmt = db.prepare('INSERT INTO spells (id, name, school, level, range, duration, cost, is_ritual, requires_concentration, has_material_components, components, classes, description, damage_attack, aoe, saving_throw, higher_level_casting) VALUES (@id, @name, @school, @level, @range, @duration, @cost, @is_ritual, @requires_concentration, @has_material_components, @components, @classes, @description, @damage_attack, @aoe, @saving_throw, @higher_level_casting)');
        const info = stmt.run(spellToInsert);
        console.log('Backend: addSpell successful, info:', info);
        return { success: true, id: spell.id };
    } catch (error) {
        console.error('Backend: Error in addSpell:', error);
        return { success: false, error: error.message };
    }
}

function updateSpell(spell) {
    try {
        const spellToUpdate = {
            ...spell,
            level: spell.level === '' ? null : parseInt(spell.level, 10),
            is_ritual: spell.is_ritual ? 1 : 0,
            requires_concentration: spell.requires_concentration ? 1 : 0,
            has_material_components: spell.has_material_components ? 1 : 0
        };
        const stmt = db.prepare('UPDATE spells SET name = @name, school = @school, level = @level, range = @range, duration = @duration, cost = @cost, is_ritual = @is_ritual, requires_concentration = @requires_concentration, has_material_components = @has_material_components, components = @components, classes = @classes, description = @description, damage_attack = @damage_attack, aoe = @aoe, saving_throw = @saving_throw, higher_level_casting = @higher_level_casting WHERE id = @id');
        const info = stmt.run(spellToUpdate);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteSpell(spellId) {
    try {
        const stmt = db.prepare('DELETE FROM spells WHERE id = ?');
        const info = stmt.run(spellId);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteAllSpells() {
    try {
        const stmt = db.prepare('DELETE FROM spells');
        const info = stmt.run();
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function syncSpells(spells) {
    try {
        deleteAllSpells(); // Clear existing spells
        const insert = db.prepare('INSERT INTO spells (id, name, school, level, range, duration, cost, is_ritual, requires_concentration, has_material_components, components, classes, description, damage_attack, aoe, saving_throw, higher_level_casting) VALUES (@id, @name, @school, @level, @range, @duration, @cost, @is_ritual, @requires_concentration, @has_material_components, @components, @classes, @description, @damage_attack, @aoe, @saving_throw, @higher_level_casting)');
        db.transaction((data) => {
            for (const spell of data) {
                const spellToInsert = {
                    ...spell,
                    level: spell.level === '' ? null : parseInt(spell.level, 10),
                    is_ritual: spell.is_ritual ? 1 : 0,
                    requires_concentration: spell.requires_concentration ? 1 : 0,
                    has_material_components: spell.has_material_components ? 1 : 0
                };
                insert.run(spellToInsert);
            }
        })(spells);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Calendar CRUD
function getCalendar(campaignId) {
    try {
        const stmt = db.prepare('SELECT * FROM calendars WHERE campaign_id = ?');
        const calendar = stmt.get(campaignId);
        if (calendar) {
            // Parse JSON strings back to arrays/objects
            calendar.month_names = JSON.parse(calendar.month_names);
            calendar.days_in_month = JSON.parse(calendar.days_in_month);
            calendar.weekday_names = JSON.parse(calendar.weekday_names);
        }
        return { success: true, data: calendar };
    } catch (error) {
        console.error('Error getting calendar:', error);
        return { success: false, error: error.message };
    }
}

function addCalendar(calendar) {
    try {
        const stmt = db.prepare('INSERT INTO calendars (id, campaign_id, num_months, month_names, days_in_month, days_in_week, weekday_names, current_year) VALUES (@id, @campaign_id, @num_months, @month_names, @days_in_month, @days_in_week, @weekday_names, @current_year)');
        const calendarToInsert = {
            ...calendar,
            month_names: JSON.stringify(calendar.month_names),
            days_in_month: JSON.stringify(calendar.days_in_month),
            weekday_names: JSON.stringify(calendar.weekday_names),
        };
        const info = stmt.run(calendarToInsert);
        return { success: true, id: calendar.id };
    } catch (error) {
        console.error('Error adding calendar:', error);
        return { success: false, error: error.message };
    }
}

function updateCalendar(calendar) {
    try {
        const stmt = db.prepare('UPDATE calendars SET num_months = @num_months, month_names = @month_names, days_in_month = @days_in_month, days_in_week = @days_in_week, weekday_names = @weekday_names, current_year = @current_year WHERE id = @id');
        const calendarToUpdate = {
            ...calendar,
            month_names: JSON.stringify(calendar.month_names),
            days_in_month: JSON.stringify(calendar.days_in_month),
            weekday_names: JSON.stringify(calendar.weekday_names),
        };
        const info = stmt.run(calendarToUpdate);
        return { success: true, changes: info.changes };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteCalendar(calendarId) {
    try {
        const stmt = db.prepare('DELETE FROM calendars WHERE id = ?');
        const info = stmt.run(calendarId);
        return { success: true, changes: info.changes };
    } catch (error) {
        console.error('Error deleting calendar:', error);
        return { success: false, error: error.message };
    }
}

// Diary Entry CRUD
function getDiaryEntry(campaignId, year, monthIndex, day) {
    try {
        const stmt = db.prepare('SELECT * FROM diary_entries WHERE campaign_id = ? AND year = ? AND month_index = ? AND day = ?');
        const entry = stmt.get(campaignId, year, monthIndex, day);
        return { success: true, data: entry };
    } catch (error) {
        console.error('Error getting diary entry:', error);
        return { success: false, error: error.message };
    }
}

function addDiaryEntry(entry) {
    try {
        console.log('Attempting to add diary entry:', entry);
        const stmt = db.prepare('INSERT INTO diary_entries (id, campaign_id, year, month_index, day, content) VALUES (@id, @campaign_id, @year, @month_index, @day, @content)');
        const info = stmt.run(entry);
        console.log('Successfully added diary entry. Info:', info);
        return { success: true, id: entry.id };
    } catch (error) {
        console.error('Error adding diary entry:', error);
        return { success: false, error: error.message };
    }
}

function updateDiaryEntry(entry) {
    try {
        const stmt = db.prepare('UPDATE diary_entries SET content = @content, updated_at = CURRENT_TIMESTAMP WHERE id = @id');
        const info = stmt.run(entry);
        return { success: true, changes: info.changes };
    } catch (error) {
        console.error('Error updating diary entry:', error);
        return { success: false, error: error.message };
    }
}

function deleteDiaryEntry(id) {
    try {
        const stmt = db.prepare('DELETE FROM diary_entries WHERE id = ?');
        const info = stmt.run(id);
        return { success: true, changes: info.changes };
    } catch (error) {
        console.error('Error deleting diary entry:', error);
        return { success: false, error: error.message };
    }
}

function getAllDiaryEntriesForCampaignAndYear(campaignId, year) {
    try {
        console.log(`Fetching diary entries for Campaign ID: ${campaignId}, Year: ${year}`);
        const stmt = db.prepare('SELECT * FROM diary_entries WHERE campaign_id = ? AND year = ?');
        const entries = stmt.all(campaignId, year);
        console.log(`Found ${entries.length} diary entries for Campaign ID: ${campaignId}, Year: ${year}`);
        return { success: true, data: entries };
    } catch (error) {
        console.error('Error getting all diary entries for campaign and year:', error);
        return { success: false, error: error.message };
    }
}

// Exportamos
module.exports = { db, setupDatabase, migrateDataFromJsons, getMonsters, addMonster, updateMonster, deleteMonster, deleteAllMonsters, getMaps, addMap, addMaps, updateMap, deleteMap, getShops, addShop, updateShop, deleteShop, addCategory, updateCategory, deleteCategory, getCategoryById, addItem, updateItem, deleteItem, getSongs, addSong, updateSong, deleteSong, syncShops, getCampaigns, addCampaign, updateCampaign, deleteCampaign, getCharacters, addCharacter, updateCharacter, deleteCharacter, getEncounters, addEncounter, updateEncounter, deleteEncounter, getSpells, addSpell, updateSpell, deleteSpell, deleteAllSpells, syncSpells, getCalendar, addCalendar, updateCalendar, deleteCalendar, getDiaryEntry, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry, getAllDiaryEntriesForCampaignAndYear, generateBackendId };