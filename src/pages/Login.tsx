import React, { ReactElement, useMemo, useState } from 'react';
import './login.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../config/api';

type Mode = 'login' | 'register';

function Login(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  const passLenOk = useMemo(() => password.length >= 8, [password]);
  const passLowerOk = useMemo(() => /[a-z]/.test(password), [password]);
  const passUpperOk = useMemo(() => /[A-Z]/.test(password), [password]);
  const passDigitOk = useMemo(() => /[0-9]/.test(password), [password]);

  function validateClient(): string | null {
    if (mode === 'register') {
      if (username.trim().length < 3) return 'Benutzername muss mindestens 3 Zeichen haben';
      if (!passLenOk) return 'Passwort muss mindestens 8 Zeichen haben';
      if (!passLowerOk) return 'Passwort muss mindestens einen Kleinbuchstaben enthalten';
      if (!passUpperOk) return 'Passwort muss mindestens einen Großbuchstaben enthalten';
      if (!passDigitOk) return 'Passwort muss mindestens eine Zahl enthalten';
    }
    if (mode === 'login') {
      if (!passLenOk) return 'Passwort muss mindestens 8 Zeichen haben';
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setRegistrationSuccess(null);
    const clientErr = validateClient();
    if (clientErr) {
      setError(clientErr);
      return;
    }
    setLoading(true);

    try {
      if (mode === 'login') {
      
        const res = await fetch(apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email, password })
        });

        const data = await res.json();
        
        // Check if email verification is required
        if (!res.ok && data.requires_verification) {
          setError(data.error || 'Bitte verifizieren Sie zuerst Ihre E-Mail-Adresse');
          sessionStorage.setItem('pendingVerificationEmail', email);
          setTimeout(() => navigate('/verify'), 2000);
          return;
        }
        
        if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen');
        
        // Check if 2FA is required
        if (data.requires_2fa) {
          setRequires2FA(true);
          setUserId(data.user_id);
          setError(null);
          setRegistrationSuccess(data.message || 'Bitte geben Sie den 2FA-Code ein, der an Ihre E-Mail gesendet wurde.');
          setLoading(false);
          return;
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        window.dispatchEvent(new CustomEvent('userLogin', { detail: data.user }));
       
        // Prüfe ob ein redirect Parameter existiert
        const redirectTo = searchParams.get('redirect');
        if (redirectTo === 'history') {
          navigate('/history');
        } else {
          navigate('/');
        }
      } else {
        const res = await fetch(apiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registrierung fehlgeschlagen');
        
        // Show success message without verification code
        setRegistrationSuccess('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail-Adresse für den Verifizierungscode.');
        
        // DON'T log in user immediately - they must verify email first
        // Store email for verification page
        sessionStorage.setItem('pendingVerificationEmail', email);
        
        // Redirect to verification page after showing message
        setTimeout(() => {
          navigate('/verify');
        }, 3000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  function Rule({ ok, label }: { ok: boolean; label: string }) {
    return (
      <div className="CTAHint" style={{ color: ok ? '#7fff9f' : '#ffb3b3' }}>
        {ok ? '✓' : '•'} {label}
      </div>
    );
  }

  async function handle2FASubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/verify-2fa'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code: twoFactorCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '2FA-Verifizierung fehlgeschlagen');

      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      
      window.dispatchEvent(new CustomEvent('userLogin', { detail: data.user }));
      
      const redirectTo = searchParams.get('redirect');
      if (redirectTo === 'history') {
        navigate('/history');
      } else {
        navigate('/');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="LoginPage">
      <div className="LoginCard">
        <h1 className="LoginTitle">chronoZ</h1>
        
        {requires2FA ? (
          // 2FA Code Entry Form
          <form onSubmit={handle2FASubmit} className="LoginForm">
            <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Zwei-Faktor-Authentifizierung</h2>
            <label className="Field">
              <span>6-stelliger Code</span>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
                pattern="[0-9]{6}"
                required
                className="Input"
                placeholder="123456"
              />
            </label>
            <div className="Actions" style={{ flexDirection: 'column' as const }}>
              <button type="submit" className="CTAButton" disabled={loading}>
                {loading ? 'Bitte warten…' : 'Verifizieren'}
              </button>
              <button 
                type="button" 
                className="CTAButton" 
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onClick={() => {
                  setRequires2FA(false);
                  setTwoFactorCode('');
                  setUserId(null);
                }}
              >
                Zurück
              </button>
            </div>
            {registrationSuccess && <div className="CTAHint" style={{ color: '#7fff9f' }}>{registrationSuccess}</div>}
            {error && <div className="CTAHint" style={{ color: '#ff8a8a' }}>{error}</div>}
          </form>
        ) : (
          // Normal Login/Register Form
          <>
            <div className="SwitchContainer">
              <button 
                type="button" 
                className={`SwitchButton ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
              >
                Anmelden
              </button>
              <button 
                type="button" 
                className={`SwitchButton ${mode === 'register' ? 'active' : ''}`}
                onClick={() => setMode('register')}
              >
                Registrieren
              </button>
            </div>
            <form onSubmit={handleSubmit} className="LoginForm">
              {mode === 'login' ? (
                <>
                  <label className="Field">
                    <span>E-Mail oder Benutzername</span>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="Input"
                    />
                  </label>
                  <label className="Field">
                    <span>Passwort</span>
                    <div className="PasswordInputWrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="Input"
                      />
                      <button
                        type="button"
                        className="PasswordToggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </label>
                  <div className="Actions" style={{ flexDirection: 'column' as const }}>
                    <button type="submit" className="CTAButton" disabled={loading}>
                      {loading ? 'Bitte warten…' : 'Login'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="Field">
                    <span>Benutzername</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="Input"
                    />
                  </label>
                  <label className="Field">
                    <span>E-Mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="Input"
                    />
                  </label>
                  <label className="Field">
                    <span>Passwort</span>
                    <div className="PasswordInputWrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="Input"
                      />
                      <button
                        type="button"
                        className="PasswordToggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                    <Rule ok={passLenOk} label="Mindestens 8 Zeichen" />
                    <Rule ok={passLowerOk} label="Mindestens 1 Kleinbuchstabe (a–z)" />
                    <Rule ok={passUpperOk} label="Mindestens 1 Großbuchstabe (A–Z)" />
                    <Rule ok={passDigitOk} label="Mindestens 1 Zahl (0–9)" />
                  </label>
                  <div className="Actions" style={{ flexDirection: 'column' as const }}>
                    <button type="submit" className="CTAButton" disabled={loading}>
                      {loading ? 'Bitte warten…' : 'Registrieren'}
                    </button>
                  </div>
                </>
              )}
              {registrationSuccess && <div className="CTAHint" style={{ color: '#7fff9f' }}>{registrationSuccess}</div>}
              {error && <div className="CTAHint" style={{ color: '#ff8a8a' }}>{error}</div>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
