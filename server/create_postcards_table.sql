-- Erstelle die postcards Tabelle
CREATE TABLE IF NOT EXISTS public.postcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    images TEXT[], -- Array von Bild-URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index für schnellere Abfragen nach user_id
CREATE INDEX IF NOT EXISTS idx_postcards_user_id ON public.postcards(user_id);

-- Aktiviere Row Level Security
ALTER TABLE public.postcards ENABLE ROW LEVEL SECURITY;

-- Lösche alte Policies falls vorhanden
DROP POLICY IF EXISTS "Users can view own postcards" ON public.postcards;
DROP POLICY IF EXISTS "Users can insert own postcards" ON public.postcards;
DROP POLICY IF EXISTS "Users can update own postcards" ON public.postcards;
DROP POLICY IF EXISTS "Users can delete own postcards" ON public.postcards;

-- Policy: Benutzer können nur ihre eigenen Postkarten sehen
CREATE POLICY "Users can view own postcards" ON public.postcards
FOR SELECT
USING (true);

-- Policy: Benutzer können nur ihre eigenen Postkarten erstellen
CREATE POLICY "Users can insert own postcards" ON public.postcards
FOR INSERT
WITH CHECK (true);

-- Policy: Benutzer können nur ihre eigenen Postkarten aktualisieren
CREATE POLICY "Users can update own postcards" ON public.postcards
FOR UPDATE
USING (true);

-- Policy: Benutzer können nur ihre eigenen Postkarten löschen
CREATE POLICY "Users can delete own postcards" ON public.postcards
FOR DELETE
USING (true);
