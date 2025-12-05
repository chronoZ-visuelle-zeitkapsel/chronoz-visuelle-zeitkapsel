-- Lösche User aus der public.users Tabelle (außer chronoZ)
DELETE FROM public.users 
WHERE username != 'chronoZ';

-- Lösche entsprechende Auth-User aus auth.users
-- WICHTIG: Dies löscht die E-Mail-Adressen aus dem Auth-System
DELETE FROM auth.users 
WHERE email NOT IN (
  SELECT email FROM public.users WHERE username = 'chronoZ'
);

-- Zeige verbleibende User an
SELECT id, username, email, email_verified, two_factor_enabled 
FROM public.users;

-- Zeige verbleibende Auth-User an
SELECT id, email, created_at 
FROM auth.users;
