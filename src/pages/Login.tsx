import React, { ReactElement, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Mode = 'login' | 'register';

function Login(): ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    const clientErr = validateClient();
    if (clientErr) {
      setError(clientErr);
      return;
    }
    setLoading(true);

    try {
      if (mode === 'login') {
      
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen');
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
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registrierung fehlgeschlagen');
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

  return (
    <div className="LoginPage">
      <div className="LoginCard">
        <h1 className="LoginTitle">chronoZ</h1>
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
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="Input"
                />
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
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="Input"
                />
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
          {error && <div className="CTAHint" style={{ color: '#ff8a8a' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default Login;
