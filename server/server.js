const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_URL = NODE_ENV === 'production' ? process.env.PROD_APP_URL : process.env.DEV_APP_URL;

// Supabase Client mit direkter Verbindung initialisieren
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kiwfabsenxerpmgcgkxw.supabase.co',
  process.env.SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-connection-encrypted': 'true'
      }
    }
  }
);

app.use(cors());
app.use(express.json());

// DB Verbindung testen
const initDb = async () => {
  try {
    // Teste die Verbindung durch eine einfache Abfrage
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (ok für erste Verbindung)
      console.error('Database connection error:', error);
    } else {
      console.log('Connected to Supabase successfully');
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
};

initDb();

// ----------- Register -----------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Alle Felder erforderlich" });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generiere 6-stelligen Verifizierungscode
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden gültig

    // Benutzer in Supabase einfügen
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        { 
          username, 
          email, 
          password: hashedPassword,
          email_verified: false,
          two_factor_enabled: false,
          verification_code: verificationCode,
          verification_code_expires: codeExpires.toISOString()
        }
      ])
      .select('id, username, email, email_verified, two_factor_enabled')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Benutzername oder E-Mail existiert bereits" });
      }
      throw error;
    }

    // Sende Verifizierungsmail über Supabase Auth
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email,
        password: Math.random().toString(36), // Dummy password für Auth
        options: {
          data: {
            verification_code: verificationCode,
            username: username
          },
          emailRedirectTo: `${APP_URL}/verify?email=${encodeURIComponent(email)}`
        }
      });
      
      if (authError) {
        console.error('Email send error (non-critical):', authError);
      } else {
        console.log(`[DEV] E-Mail gesendet an ${email}`);
      }
      console.log(`[DEV] Verifizierungscode für ${email}: ${verificationCode}`);
    } catch (authError) {
      console.error('Email send error (non-critical):', authError);
    }

    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      email: user.email,
      email_verified: user.email_verified
    }, SECRET_KEY, { expiresIn: "1h" });
    
    res.json({ 
      token, 
      user,
      message: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail-Adresse für den Verifizierungscode.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Fehler bei der Registrierung" });
  }
});

// ----------- Login -----------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "Alle Felder erforderlich" });
    }

    // Benutzer in Supabase suchen
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "Benutzer nicht gefunden" });
    }

    // Passwort prüfen
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Falsches Passwort" });
    }

    // Prüfe ob E-Mail verifiziert ist
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: "Bitte verifizieren Sie zuerst Ihre E-Mail-Adresse",
        requires_verification: true
      });
    }

    // Prüfe ob 2FA aktiviert ist
    if (user.two_factor_enabled) {
      // Generiere 2FA Code
      const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 Minuten gültig

      // Speichere Code in DB
      await supabase
        .from('users')
        .update({
          verification_code: twoFactorCode,
          verification_code_expires: codeExpires.toISOString()
        })
        .eq('id', user.id);

      // In Produktion: Sende Code per Email
      console.log(`2FA Code für ${user.email}: ${twoFactorCode}`);

      return res.json({
        requires_2fa: true,
        user_id: user.id,
        message: `2FA Code wurde gesendet (Dev: ${twoFactorCode})`
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        email_verified: user.email_verified,
        two_factor_enabled: user.two_factor_enabled
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Fehler beim Login" });
  }
});

// ----------- Me Endpoint -----------
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Token erforderlich" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Aktuelle Benutzerdaten aus Supabase holen
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, two_factor_enabled, email_verified')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    res.json(user);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Ungültiger Token" });
    }
    console.error(err);
    res.status(500).json({ error: "Server Fehler" });
  }
});

//Test Route
app.get('/api/protected', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    res.json({ message: `Hallo ${user.username}, du bist eingeloggt!` });
  });
});

// ----------- Postkarten Endpoints -----------

// Get all postcards for a user
app.get('/api/postcards', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Token erforderlich" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    
    const { data: postcards, error } = await supabase
      .from('postcards')
      .select('*')
      .eq('user_id', decoded.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(postcards || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Laden der Postkarten" });
  }
});

// Create a new postcard
app.post('/api/postcards', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Token erforderlich" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const { title, description, date, images } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({ error: "Titel, Beschreibung und Datum sind erforderlich" });
    }

    const { data: postcard, error } = await supabase
      .from('postcards')
      .insert([
        {
          user_id: decoded.id,
          title,
          description,
          date,
          images: images || []
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json(postcard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Erstellen der Postkarte" });
  }
});

// Update a postcard
app.put('/api/postcards/:id', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Token erforderlich" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const { id } = req.params;
    const { title, description, date, images } = req.body;

    const { data: postcard, error } = await supabase
      .from('postcards')
      .update({
        title,
        description,
        date,
        images: images || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', decoded.id)
      .select()
      .single();

    if (error) throw error;

    res.json(postcard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Aktualisieren der Postkarte" });
  }
});

// Delete a postcard
app.delete('/api/postcards/:id', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Token erforderlich" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const { id } = req.params;

    const { error } = await supabase
      .from('postcards')
      .delete()
      .eq('id', id)
      .eq('user_id', decoded.id);

    if (error) throw error;

    res.json({ message: "Postkarte gelöscht" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Löschen der Postkarte" });
  }
});

// ----------- Email Verification -----------
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({ error: "Code und E-Mail erforderlich" });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('verification_code', code)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "Ungültiger Verifizierungscode" });
    }

    // Prüfe ob Code abgelaufen
    if (new Date(user.verification_code_expires) < new Date()) {
      return res.status(400).json({ error: "Verifizierungscode ist abgelaufen" });
    }

    // Update User als verifiziert
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_code: null,
        verification_code_expires: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Generate token and log user in after successful verification
    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      email: user.email,
      email_verified: true
    }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ 
      message: "E-Mail erfolgreich verifiziert",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        email_verified: true
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler bei der Verifizierung" });
  }
});

// ----------- 2FA Verify -----------
app.post('/api/auth/verify-2fa', async (req, res) => {
  try {
    const { user_id, code } = req.body;

    if (!user_id || !code) {
      return res.status(400).json({ error: "User ID und Code erforderlich" });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .eq('verification_code', code)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "Ungültiger 2FA Code" });
    }

    // Prüfe ob Code abgelaufen
    if (new Date(user.verification_code_expires) < new Date()) {
      return res.status(400).json({ error: "2FA Code ist abgelaufen" });
    }

    // Lösche Code
    await supabase
      .from('users')
      .update({
        verification_code: null,
        verification_code_expires: null
      })
      .eq('id', user.id);

    // Erstelle Token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        email_verified: user.email_verified,
        two_factor_enabled: user.two_factor_enabled
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler bei 2FA Verifizierung" });
  }
});

// ----------- Toggle 2FA -----------
app.post('/api/auth/toggle-2fa', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Token erforderlich" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: "enabled muss boolean sein" });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ two_factor_enabled: enabled })
      .eq('id', decoded.id)
      .select('id, username, email, email_verified, two_factor_enabled')
      .single();

    if (error) throw error;

    res.json({ 
      message: `2FA ${enabled ? 'aktiviert' : 'deaktiviert'}`,
      user 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fehler beim Ändern der 2FA Einstellung" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
  console.log(`Netzwerk-Zugriff: http://10.13.51.28:${PORT}`);
});
