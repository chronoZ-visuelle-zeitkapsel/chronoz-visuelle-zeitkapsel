const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5000;
const SECRET_KEY = process.env.JWT_SECRET;

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
    const { data, error } = await supabase
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

    // Benutzer in Supabase einfügen
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        { username, email, password: hashedPassword }
      ])
      .select('id, username, email')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation error code
        return res.status(400).json({ error: "Benutzername oder E-Mail existiert bereits" });
      }
      throw error;
    }

    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      email: user.email 
    }, SECRET_KEY, { expiresIn: "1h" });
    
    res.json({ token, user });
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
        email: user.email
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
      .select('id, username, email')
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

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
