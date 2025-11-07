-- Erstelle die Funktion zur Tabellenerstellung
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Überprüfe ob die Tabelle bereits existiert
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Erstelle die users Tabelle
        CREATE TABLE public.users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Setze die Row Level Security (RLS)
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Erstelle eine Policy die allen Zugriff erlaubt (kann später eingeschränkt werden)
        CREATE POLICY "Allow full access" ON public.users
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END;
$$;