import React, { ReactElement, useState, useEffect, useMemo } from 'react';
import './login.css';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';

function ResetPassword(): ReactElement {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const passLenOk = useMemo(() => password.length >= 8, [password]);
  const passLowerOk = useMemo(() => /[a-z]/.test(password), [password]);
  const passUpperOk = useMemo(() => /[A-Z]/.test(password), [password]);
  const passDigitOk = useMemo(() => /[0-9]/.test(password), [password]);

  useEffect(() => {
    // Hole den access_token aus dem URL Hash (Supabase Format: #access_token=xxx)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');

    if (!token) {
      setError('Ungültiger oder abgelaufener Reset-Link');
    } else {
      setAccessToken(token);
    }
  }, []);

  function Rule({ ok, label }: { ok: boolean; label: string }) {
    return (
      <div className="CTAHint" style={{ color: ok ? '#539e66' : '#f17e7e' }}>
        {ok ? '✓' : '•'} {label}
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!accessToken) {
      setError('Ungültiger Reset-Link');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (!passLenOk || !passLowerOk || !passUpperOk || !passDigitOk) {
      setError('Passwort erfüllt nicht die Anforderungen');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, newPassword: password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Zurücksetzen des Passworts');

      setSuccess('Passwort erfolgreich zurückgesetzt! Sie werden zum Login weitergeleitet...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="LoginPage">
      <div className="LoginCard">
        <img src="/chronoZLogo.png" alt="chronoZ Logo" className="LoginLogo" />
        <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Neues Passwort festlegen</h2>
        
        {!accessToken ? (
          <div className="CTAHint" style={{ color: '#ff8a8a', textAlign: 'center' }}>
            Ungültiger oder abgelaufener Reset-Link. Bitte fordern Sie einen neuen an.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="LoginForm">
            <label className="Field">
              <span>Neues Passwort</span>
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
                  <img src={showPassword ? "/eye-closed.svg" : "/eye-open.svg"} alt="toggle password" style={{width: '20px', height: '20px'}} />
                </button>
              </div>
              <Rule ok={passLenOk} label="Mindestens 8 Zeichen" />
              <Rule ok={passLowerOk} label="Mindestens 1 Kleinbuchstabe (a–z)" />
              <Rule ok={passUpperOk} label="Mindestens 1 Großbuchstabe (A–Z)" />
              <Rule ok={passDigitOk} label="Mindestens 1 Zahl (0–9)" />
            </label>
            
            <label className="Field">
              <span>Passwort bestätigen</span>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="Input"
              />
            </label>

            <div className="Actions" style={{ flexDirection: 'column' as const }}>
              <button type="submit" className="CTAButton" disabled={loading || !accessToken}>
                {loading ? 'Bitte warten…' : 'Passwort zurücksetzen'}
              </button>
              <button 
                type="button" 
                className="CTAButton" 
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onClick={() => navigate('/login')}
              >
                Zurück zum Login
              </button>
            </div>
            
            {success && <div className="CTAHint" style={{ color: '#4abd66' }}>{success}</div>}
            {error && <div className="CTAHint" style={{ color: '#ff8a8a' }}>{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
