-- =========================================================
-- Floor Escape - PostgreSQL Miqrasiya Sxemi (Initial Schema)
-- Versiya: 001
-- =========================================================

-- 1. OYUNÇULAR VƏ HESABLAR CƏDVƏLİ
CREATE TABLE IF NOT EXISTS players (
    player_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    pin_hash VARCHAR(128) NOT NULL,
    gold DOUBLE PRECISION DEFAULT 75,
    diamonds INTEGER DEFAULT 0,
    red_diamonds INTEGER DEFAULT 0,
    best_floor INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    perm_upgrades JSONB DEFAULT '{}'::jsonb,
    claimed_chests JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_best_floor ON players(best_floor DESC);
CREATE INDEX IF NOT EXISTS idx_players_total_score ON players(total_score DESC);

-- 2. QLOBAL ÇAT MESAJLARI CƏDVƏLİ
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- 3. İNBOX / POÇT BİLDİRİŞLƏRİ VƏ HƏDİYYƏLƏR CƏDVƏLİ
CREATE TABLE IF NOT EXISTS inbox_messages (
    id SERIAL PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL DEFAULT 'ALL',
    player_id VARCHAR(50) DEFAULT 'ALL',
    title VARCHAR(255) NOT NULL,
    note TEXT,
    gift_code VARCHAR(100) NOT NULL,
    blue_diamonds INTEGER DEFAULT 0,
    red_diamonds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_claimed INTEGER DEFAULT 0,
    claimed_by VARCHAR(50) DEFAULT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_inbox_player ON inbox_messages(player_id);
CREATE INDEX IF NOT EXISTS idx_inbox_gift_code ON inbox_messages(gift_code);

-- 4. MƏKTUBLARIN QƏBUL EDİLMƏSİ (CLAIM) CƏDVƏLİ
CREATE TABLE IF NOT EXISTS claimed_messages (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    player_id VARCHAR(50) NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_claimed_msg_player UNIQUE(message_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_claimed_player ON claimed_messages(player_id);

-- 5. ƏTRAFLI HƏDİYYƏ KODLARI CƏDVƏLİ
CREATE TABLE IF NOT EXISTS gift_codes_advanced (
    code VARCHAR(100) PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL DEFAULT 'ALL',
    target_player_id VARCHAR(50) DEFAULT 'ALL',
    blue_diamonds INTEGER DEFAULT 0,
    red_diamonds INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_gift_codes_active ON gift_codes_advanced(is_active);
