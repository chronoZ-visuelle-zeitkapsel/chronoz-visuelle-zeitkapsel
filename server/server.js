const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 5000;
const SECRET_KEY = "meinGeheimesToken"; 


app.use(cors());
app.use(express.json());

// DB anlegen
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error("Fehler beim Öffnen der Datenbank:", err.message);
  } else {
    console.log("SQLite-Datenbank verbunden.");
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT
  )
`);

// ----------- Register -----------
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Alle Felder erforderlich" });
  }

  // Passwort hashen
  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
  db.run(sql, [username, email, hashedPassword], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(400).json({ error: "Benutzer existiert bereits oder Fehler" });
    }

    const token = jwt.sign({ id: this.lastID, username, email }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token, user: { id: this.lastID, username, email } });
  });
});

// ----------- Login -----------
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Alle Felder erforderlich" });
  }

  const sql = `SELECT * FROM users WHERE username = ? OR email = ?`;
  db.get(sql, [identifier, identifier], (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Serverfehler" });
    }

    if (!user) {
      return res.status(400).json({ error: "Benutzer nicht gefunden" });
    }

    // Passwort prüfen
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Falsches Passwort" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  });
});

// ----------- Me Endpoint -----------
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Token erforderlich" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Ungültiger Token" });
    }
    
    res.json({ 
      id: decoded.id, 
      username: decoded.username, 
      email: decoded.email 
    });
  });
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
