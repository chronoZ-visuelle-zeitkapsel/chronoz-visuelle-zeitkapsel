-- Füge Felder für Email-Verifizierung und 2FA hinzu
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP;

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code);
