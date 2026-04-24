const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const brevo = require('@getbrevo/brevo');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_URL = process.env.APP_URL || (NODE_ENV === 'production' ? process.env.PROD_APP_URL : process.env.DEV_APP_URL);

const isMissingColumnError = (error, columnName) => {
  if (!error || !error.message) return false;
  return error.code === 'PGRST204' && error.message.includes(`'${columnName}'`);
};

// Brevo API Setup
const brevoApiInstance = new brevo.TransactionalEmailsApi();
brevoApiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

// Supabase Client mit direkter Verbindung initialisieren
// Fuer dieses Setup wird bewusst nur der ANON key verwendet.
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing Supabase key: set SUPABASE_ANON_KEY');
}

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kiwfabsenxerpmgcgkxw.supabase.co',
  supabaseKey,
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

// CORS Configuration
const corsOptions = {
  origin: '*', // Temporär für Debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
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

// Setzt abgelaufene Locks automatisch zurueck.
const syncExpiredUserLock = async (user) => {
  if (!user) return user;

  if (!user.locked || !user.locked_until) {
    return user;
  }

  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lockUntilDate = new Date(`${user.locked_until}T00:00:00`);

  if (Number.isNaN(lockUntilDate.getTime())) {
    return user;
  }

  if (lockUntilDate >= todayDateOnly) {
    return user;
  }

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({ locked: false })
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('[LOCK SYNC ERROR]', error);
    return user;
  }

  return updatedUser || user;
};

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running',
    nodeEnv: NODE_ENV,
    appUrl: APP_URL,
    corsOrigin: NODE_ENV === 'production' 
      ? ['https://chronoz-visuelle-zeitkapsel.vercel.app']
      : ['http://10.13.51.28:5002', 'http://localhost:3000', 'http://localhost:5002']
  });
});

// ----------- Register -----------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Alle Felder erforderlich" });
    }

    // Email in Kleinbuchstaben konvertieren
    const normalizedEmail = email.toLowerCase();

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generiere 6-stelligen Verifizierungscode
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden gültig

    // Benutzer in Supabase einfügen.
    // Falls optionale Auth-Spalten im alten Schema fehlen, auf Basisfelder zurückfallen.
    let user = null;
    let error = null;

    const advancedInsert = await supabase
      .from('users')
      .insert([
        {
          username,
          email: normalizedEmail,
          password: hashedPassword,
          email_verified: false,
          two_factor_enabled: false,
          verification_code: verificationCode,
          verification_code_expires: codeExpires.toISOString()
        }
      ])
      .select('id, username, email, email_verified, two_factor_enabled')
      .single();

    user = advancedInsert.data;
    error = advancedInsert.error;

    if (
      error &&
      (
        isMissingColumnError(error, 'email_verified') ||
        isMissingColumnError(error, 'two_factor_enabled') ||
        isMissingColumnError(error, 'verification_code') ||
        isMissingColumnError(error, 'verification_code_expires')
      )
    ) {
      const basicInsert = await supabase
        .from('users')
        .insert([
          {
            username,
            email: normalizedEmail,
            password: hashedPassword
          }
        ])
        .select('id, username, email')
        .single();

      user = basicInsert.data;
      error = basicInsert.error;
    }

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Benutzername oder E-Mail existiert bereits" });
      }
      throw error;
    }


    // Sende Verifizierungs-E-Mail über Brevo
    if (process.env.BREVO_API_KEY) {
      try {
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = 'chronoZ - E-Mail Verifizierung';
        sendSmtpEmail.to = [{ email: normalizedEmail, name: username }];
        sendSmtpEmail.htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Willkommen bei chronoZ!</h2>
            <p>Hallo ${username},</p>
            <p>Vielen Dank für deine Registrierung bei chronoZ.</p>
            <p>Dein Verifizierungscode lautet:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="font-size: 32px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">${verificationCode}</h1>
            </div>
            <p>Dieser Code ist <strong>24 Stunden</strong> gültig.</p>
            <p>Bitte gib diesen Code auf der Verifizierungsseite ein, um deine E-Mail-Adresse zu bestätigen.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Falls du dich nicht registriert hast, ignoriere diese E-Mail.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              Viele Grüße,<br>Dein chronoZ Team
            </p>
          </div>
        `;
        sendSmtpEmail.sender = { 
          name: process.env.BREVO_SENDER_NAME || 'chronoZ', 
          email: process.env.BREVO_SENDER_EMAIL || 'chronoz.noreply@gmail.com' 
        };

        await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
      } catch (emailError) {
        console.error('[EMAIL ERROR]', emailError);
        // Registrierung trotzdem erfolgreich, User kann Code in DB finden
      }
    }

    const emailVerified = user.email_verified ?? true;

    const token = jwt.sign({
      id: user.id, 
      username: user.username, 
      email: user.email,
      email_verified: emailVerified
    }, SECRET_KEY, { expiresIn: "1h" });
    
    res.json({ 
      token, 
      user: {
        ...user,
        email_verified: emailVerified,
        two_factor_enabled: user.two_factor_enabled ?? false
      },
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

    // Identifier in Kleinbuchstaben für Email-Vergleich
    const normalizedIdentifier = identifier.toLowerCase();

    // Benutzer in Supabase suchen - zuerst per Email, dann per Username
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedIdentifier)
      .single();

    // Falls nicht gefunden per Email, versuche per Username
    if (error?.code === 'PGRST116' || !user) {
      const usernameRes = await supabase
        .from('users')
        .select('*')
        .eq('username', identifier)
        .single();
      user = usernameRes.data;
      error = usernameRes.error;

      // Optionaler Fallback: lowercase Username pruefen (falls historisch so gespeichert)
      if ((error?.code === 'PGRST116' || !user) && identifier !== normalizedIdentifier) {
        const usernameLowerRes = await supabase
          .from('users')
          .select('*')
          .eq('username', normalizedIdentifier)
          .single();
        user = usernameLowerRes.data;
        error = usernameLowerRes.error;
      }
    }

    if (!user) {
      return res.status(400).json({ error: "Benutzer nicht gefunden" });
    }

    // Passwort prüfen
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Falsches Passwort" });
    }

    // Lock-Status bei abgelaufenem Datum automatisch zuruecksetzen
    const syncedUser = await syncExpiredUserLock(user);

    const emailVerified = syncedUser.email_verified ?? true;
    const twoFactorEnabled = syncedUser.two_factor_enabled ?? false;

    // Prüfe ob E-Mail verifiziert ist (nur wenn das Feld im Schema existiert)
    if (!emailVerified) {
      return res.status(403).json({ 
        error: "Bitte verifizieren Sie zuerst Ihre E-Mail-Adresse",
        requires_verification: true
      });
    }

    // Prüfe ob 2FA aktiviert ist
    if (twoFactorEnabled) {
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
        .eq('id', syncedUser.id);

      return res.json({
        requires_2fa: true,
        user_id: syncedUser.id,
        message: '2FA Code wurde gesendet'
      });
    }

    const token = jwt.sign(
      { id: syncedUser.id, username: syncedUser.username, email: syncedUser.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    
    res.json({
      token,
      user: {
        id: syncedUser.id,
        username: syncedUser.username,
        email: syncedUser.email,
        email_verified: emailVerified,
        two_factor_enabled: twoFactorEnabled,
        locked: syncedUser.locked,
        locked_until: syncedUser.locked_until,
        reminder_mail_enabled: syncedUser.reminder_mail_enabled
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
    
    // Aktuelle Benutzerdaten aus Supabase holen (mit Fallback fuer alte Schemas).
    let user = null;

    const fullResult = await supabase
      .from('users')
      .select('id, username, email, two_factor_enabled, email_verified, locked, locked_until, reminder_mail_enabled')
      .eq('id', decoded.id)
      .single();

    if (!fullResult.error && fullResult.data) {
      user = fullResult.data;
    } else {
      const basicResult = await supabase
        .from('users')
        .select('id, username, email, two_factor_enabled, email_verified')
        .eq('id', decoded.id)
        .single();

      if (basicResult.error || !basicResult.data) {
        // Letzter Fallback: Token-Payload zurueckgeben, damit Session nicht unnoetig abbricht.
        return res.json({
          id: decoded.id,
          username: decoded.username || 'User',
          email: decoded.email || '',
          two_factor_enabled: false,
          email_verified: true,
          locked: false,
          locked_until: null,
          reminder_mail_enabled: true
        });
      }

      user = {
        ...basicResult.data,
        locked: false,
        locked_until: null,
        reminder_mail_enabled: true
      };
    }

    const syncedUser = await syncExpiredUserLock(user);

    res.json({
      id: syncedUser.id,
      username: syncedUser.username,
      email: syncedUser.email,
      two_factor_enabled: syncedUser.two_factor_enabled,
      email_verified: syncedUser.email_verified,
      locked: syncedUser.locked,
      locked_until: syncedUser.locked_until,
      reminder_mail_enabled: syncedUser.reminder_mail_enabled
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Ungültiger Token" });
    }
    console.error(err);
    res.status(500).json({ error: "Server Fehler" });
  }
});

// ----------- Forgot Password -----------
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "E-Mail oder Benutzername erforderlich" });
    }

    const normalizedInput = email.toLowerCase();

    // Prüfe ob Benutzer in unserer DB existiert (per Email oder Username)
    let user;
    let userError;

    // Versuche zuerst per Email
    const emailResult = await supabase
      .from('users')
      .select('id, email, username')
      .eq('email', normalizedInput)
      .single();

    if (emailResult.data) {
      user = emailResult.data;
    } else {
      // Falls nicht gefunden, versuche per Username (case-insensitive mit ilike)
      const usernameResult = await supabase
        .from('users')
        .select('id, email, username')
        .ilike('username', normalizedInput)
        .single();
      
      if (usernameResult.data) {
        user = usernameResult.data;
      } else {
        userError = usernameResult.error;
      }
    }

    if (userError || !user) {
      // Aus Sicherheitsgründen immer Success zurückgeben
      return res.json({ message: "Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Code gesendet." });
    }

    // Generiere 6-stelligen Reset-Code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 Minuten gültig

    // Speichere Code in DB
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_code: resetCode,
        verification_code_expires: codeExpires.toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[PASSWORD RESET] Error updating user:', updateError);
      throw updateError;
    }

    // Sende E-Mail über Brevo
    if (process.env.BREVO_API_KEY) {
      try {
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = 'chronoZ - Passwort zurücksetzen';
        sendSmtpEmail.to = [{ email: user.email, name: user.username }];
        sendSmtpEmail.htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Passwort zurücksetzen</h2>
            <p>Hallo ${user.username},</p>
            <p>Du hast einen Passwort-Reset für deinen chronoZ Account angefordert.</p>
            <p>Dein Reset-Code lautet:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="font-size: 32px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">${resetCode}</h1>
            </div>
            <p>Dieser Code ist <strong>30 Minuten</strong> gültig.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Falls du keinen Reset angefordert hast, ignoriere diese E-Mail.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              Viele Grüße,<br>Dein chronoZ Team
            </p>
          </div>
        `;
        sendSmtpEmail.sender = { 
          name: process.env.BREVO_SENDER_NAME || 'chronoZ', 
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@chronoz.app' 
        };

        await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
      } catch (emailError) {
        console.error('[EMAIL ERROR]', emailError);
        // Trotzdem weitermachen, Code ist in DB gespeichert
      }
    }

    res.json({ 
      message: "Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Code gesendet.",
      email: user.email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Fehler beim Passwort-Reset" });
  }
});

// ----------- Reset Password -----------
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Alle Felder erforderlich" });
    }

    const normalizedInput = email.toLowerCase();

    // Finde User in unserer DB (per Email oder Username)
    let user;
    let dbError;

    // Versuche zuerst per Email
    const emailResult = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedInput)
      .single();

    if (emailResult.data) {
      user = emailResult.data;
    } else {
      // Falls nicht gefunden, versuche per Username (case-insensitive)
      const usernameResult = await supabase
        .from('users')
        .select('*')
        .ilike('username', normalizedInput)
        .single();
      
      if (usernameResult.data) {
        user = usernameResult.data;
      } else {
        dbError = usernameResult.error;
      }
    }

    if (dbError || !user) {
      return res.status(400).json({ error: "Ungültiger Reset-Code" });
    }

    // Prüfe Code
    if (user.verification_code !== code) {
      return res.status(400).json({ error: "Ungültiger Reset-Code" });
    }

    // Prüfe ob Code abgelaufen ist
    const now = new Date();
    // Stelle sicher, dass der Timestamp korrekt als UTC interpretiert wird
    const expiresString = user.verification_code_expires.endsWith('Z') 
      ? user.verification_code_expires 
      : user.verification_code_expires + 'Z';
    const expiresAt = new Date(expiresString);
    
    if (now > expiresAt) {
      return res.status(400).json({ error: "Reset-Code ist abgelaufen. Bitte fordern Sie einen neuen an." });
    }

    // Hash neues Passwort
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Passwort und lösche Verification Code
    await supabase
      .from('users')
      .update({
        password: hashedPassword,
        verification_code: null,
        verification_code_expires: null
      })
      .eq('id', user.id);

    res.json({ message: "Passwort erfolgreich zurückgesetzt" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Fehler beim Passwort-Reset" });
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

// ----------- User Capsule Lock -----------
app.post('/api/users/lock', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token erforderlich' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const { locked_until, reminder_mail_enabled } = req.body;

    if (!locked_until) {
      return res.status(400).json({ error: 'locked_until ist erforderlich' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(locked_until)) {
      return res.status(400).json({ error: 'locked_until muss Format YYYY-MM-DD haben' });
    }

    const lockDate = new Date(`${locked_until}T00:00:00`);
    if (Number.isNaN(lockDate.getTime())) {
      return res.status(400).json({ error: 'Ungültiges Datum' });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (lockDate < today) {
      return res.status(400).json({ error: 'locked_until darf nicht in der Vergangenheit liegen' });
    }

    const reminderEnabled = reminder_mail_enabled !== false;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        locked: true,
        locked_until,
        reminder_mail_enabled: reminderEnabled
      })
      .eq('id', decoded.id)
      .select('id, username, email, locked, locked_until, reminder_mail_enabled')
      .single();

    if (error) throw error;

    res.json({
      message: 'Kapsel erfolgreich gesperrt',
      user
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Ungültiger Token' });
    }
    console.error('[LOCK ERROR]', err);
    res.status(500).json({ error: 'Server Fehler beim Sperren der Kapsel' });
  }
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
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Ungültiger oder abgelaufener Token' });
    }
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

    if (error) {
      throw error;
    }

    res.json(postcard);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Ungültiger oder abgelaufener Token' });
    }
    console.error('[POSTCARD CREATE] Error:', err);
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
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Ungültiger oder abgelaufener Token' });
    }
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
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Ungültiger oder abgelaufener Token' });
    }
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

    // Email in Kleinbuchstaben konvertieren
    const normalizedEmail = email.toLowerCase();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
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
