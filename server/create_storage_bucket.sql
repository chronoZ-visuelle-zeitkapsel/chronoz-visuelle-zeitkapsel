-- WICHTIG: Gehe zuerst zu Storage im Supabase Dashboard (links in der Sidebar)
-- Klicke auf "New Bucket"
-- Name: postcard-images
-- Public bucket: JA (aktivieren!)
-- Klicke auf "Create bucket"

-- Dann führe dieses SQL aus, um die Policies zu setzen:

-- Lösche alte Policies falls vorhanden
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- Storage Policy: Jeder kann Bilder hochladen
CREATE POLICY "Anyone can upload images" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'postcard-images');

-- Storage Policy: Jeder kann Bilder ansehen
CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT
USING (bucket_id = 'postcard-images');

-- Storage Policy: Jeder kann Bilder löschen (später einschränken)
CREATE POLICY "Anyone can delete images" ON storage.objects
FOR DELETE
USING (bucket_id = 'postcard-images');
