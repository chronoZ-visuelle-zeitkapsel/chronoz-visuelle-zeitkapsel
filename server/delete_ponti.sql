-- Lösche User mit Username 'ponti'
DELETE FROM users 
WHERE username = 'ponti';

-- Zeige verbleibende User an
SELECT id, username, email, email_verified, two_factor_enabled 
FROM users;
