import React, { ReactElement, useMemo, useState } from 'react';
import './login.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../config/api';

type Mode = 'login' | 'register' | 'forgot-password';

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
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');

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
      <div className="CTAHint" style={{ color: ok ? '#539e66' : '#f17e7e' }}>
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

  async function handleForgotPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setRegistrationSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Senden des Reset-Codes');

      // Zeige die Email-Adresse an (vom Backend)
      if (data.email) {
        setRegistrationSuccess(`Ein Reset-Code wurde an folgende Email versendet: ${data.email}`);
        setResetStep('confirm');
      } else {
        setError('Benutzer nicht gefunden.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setRegistrationSuccess(null);
    
    // Client-side validation for new password
    const newPassLenOk = newPassword.length >= 8;
    const newPassLowerOk = /[a-z]/.test(newPassword);
    const newPassUpperOk = /[A-Z]/.test(newPassword);
    const newPassDigitOk = /[0-9]/.test(newPassword);

    if (!newPassLenOk || !newPassLowerOk || !newPassUpperOk || !newPassDigitOk) {
      setError('Das neue Passwort erfüllt nicht die Anforderungen');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Zurücksetzen des Passworts');

      setRegistrationSuccess('Passwort erfolgreich zurückgesetzt! Sie können sich jetzt anmelden.');
      setTimeout(() => {
        setMode('login');
        setResetStep('request');
        setResetCode('');
        setNewPassword('');
        setEmail('');
        setPassword('');
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="newspaper-spread-page">
        {/* Form Panel */}
        <div className="form-notice-panel">
          {requires2FA ? (
            // 2FA Code Entry Form
            <form onSubmit={handle2FASubmit} className="archive-form">
              <div className="notice-header">
                <h2 className="notice-title">Verifizierung</h2>
                <div className="rivet top-left"></div>
                <div className="rivet top-right"></div>
                <div className="rivet bottom-left"></div>
                <div className="rivet bottom-right"></div>
              </div>
              <label className="Field">
                <span>Versandcode</span>
                <span className="dispatch-label">(6-stellige Verifizierung)</span>
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
              <button type="submit" className="grant-entry-button" disabled={loading}>
                {loading ? 'Verifiziere…' : 'Zugang gewähren'}
              </button>
              <button 
                type="button" 
                className="archive-link" 
                onClick={() => {
                  setRequires2FA(false);
                  setTwoFactorCode('');
                  setUserId(null);
                }}
                style={{ marginTop: '12px', textAlign: 'center', width: '100%' }}
              >
                Zurück zum Login
              </button>
              {registrationSuccess && <div className="archive-message success">{registrationSuccess}</div>}
              {error && <div className="archive-message error">{error}</div>}
            </form>
          ) : mode === 'forgot-password' ? (
            // Password Reset Form
            <form onSubmit={resetStep === 'request' ? handleForgotPassword : handleResetPassword} className="archive-form">
              <div className="notice-header">
                <h2 className="notice-title">Passwort zurücksetzen</h2>
                <div className="rivet top-left"></div>
                <div className="rivet top-right"></div>
                <div className="rivet bottom-left"></div>
                <div className="rivet bottom-right"></div>
              </div>
              {resetStep === 'request' ? (
                <>
                  <label className="Field">
                    <span>Versandadresse</span>
                    <span className="dispatch-label">(E-Mail oder Benutzername)</span>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="Input"
                      placeholder="ihre@email.com oder Benutzername"
                    />
                  </label>
                  <button type="submit" className="grant-entry-button" disabled={loading}>
                    {loading ? 'Sende…' : 'Code senden'}
                  </button>
                  <button 
                    type="button" 
                    className="archive-link" 
                    onClick={() => {
                      setMode('login');
                      setResetStep('request');
                    }}
                    style={{ marginTop: '12px', textAlign: 'center', width: '100%' }}
                  >
                    Zurück zum Login
                  </button>
                </>
              ) : (
                <>
                  <label className="Field">
                    <span>Zurücksetzen Code</span>
                    <span className="dispatch-label">(6-stelliger Code)</span>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                      className="Input"
                      placeholder="123456"
                    />
                  </label>
                  <label className="Field">
                    <span>Neues Passwort</span>
                    <span className="dispatch-label">(Passwort)</span>
                    <div className="PasswordInputWrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                    <Rule ok={newPassword.length >= 8} label="Mindestens 8 Zeichen" />
                    <Rule ok={/[a-z]/.test(newPassword)} label="Mindestens 1 Kleinbuchstabe (a–z)" />
                    <Rule ok={/[A-Z]/.test(newPassword)} label="Mindestens 1 Großbuchstabe (A–Z)" />
                    <Rule ok={/[0-9]/.test(newPassword)} label="Mindestens 1 Zahl (0–9)" />
                  </label>
                  <button type="submit" className="grant-entry-button" disabled={loading}>
                    {loading ? 'Setze zurück…' : 'Passwort zurücksetzen'}
                  </button>
                  <button 
                    type="button" 
                    className="archive-link" 
                    onClick={() => {
                      setMode('login');
                      setResetStep('request');
                      setResetCode('');
                      setNewPassword('');
                    }}
                    style={{ marginTop: '12px', textAlign: 'center', width: '100%' }}
                  >
                    Abbrechen
                  </button>
                </>
              )}
              {registrationSuccess && <div className="archive-message success">{registrationSuccess}</div>}
              {error && <div className="archive-message error">{error}</div>}
            </form>
          ) : (
            // Normal Login/Register Form
            <>
              <div className="edition-switcher">
                <button 
                  type="button" 
                  className={`edition-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => setMode('login')}
                >
                  Täglicher Abonnent
                </button>
                <button 
                  type="button" 
                  className={`edition-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => setMode('register')}
                >
                  Neuer Leser
                </button>
              </div>
              <form onSubmit={handleSubmit} className="archive-form">
                {mode === 'login' ? (
                  <>
                    <div className="notice-header">
                      <h2 className="notice-title">Abonnenten-Anmeldung</h2>
                      <div className="rivet top-left"></div>
                      <div className="rivet top-right"></div>
                      <div className="rivet bottom-left"></div>
                      <div className="rivet bottom-right"></div>
                    </div>
                    <label className="Field">
                      <span>Versandadresse (E-Mail oder Benutzername)</span>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="Input"
                        placeholder="versand@chronicle.news"
                      />
                    </label>
                    <label className="Field">
                      <span>Büroschlüssel (Passwort)</span>
                      <div className="PasswordInputWrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="Input"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="PasswordToggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                          style={{ right: '12px' }}
                        >
                          <img src={showPassword ? "/eye-closed.svg" : "/eye-open.svg"} alt="Passwort umschalten" style={{width: '20px', height: '20px'}} />
                        </button>
                      </div>
                    </label>
                    <button type="submit" className="grant-entry-button" disabled={loading}>
                      {loading ? 'Verifiziere…' : 'Zugang gewähren'}
                    </button>
                    <div className="archive-links">
                      <button 
                        type="button" 
                        className="archive-link"
                        onClick={() => {
                          setMode('forgot-password');
                          setResetStep('request');
                          setError(null);
                          setRegistrationSuccess(null);
                        }}
                      >
                        Adresse verloren?
                      </button>
                      <span>•</span>
                      <button 
                        type="button" 
                        className="archive-link"
                        onClick={() => setMode('register')}
                      >
                        Der Presse beitreten?
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="notice-header">
                      <h2 className="notice-title">Neue Leser Anmeldung</h2>
                      <div className="rivet top-left"></div>
                      <div className="rivet top-right"></div>
                      <div className="rivet bottom-left"></div>
                      <div className="rivet bottom-right"></div>
                    </div>
                    <label className="Field">
                      <span>Lesername (Benutzername)</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="Input"
                        placeholder="J. Leser"
                      />
                    </label>
                    <label className="Field">
                      <span>Versandadresse (E-Mail)</span>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="Input"
                        placeholder="leser@chronicle.news"
                      />
                    </label>
                    <label className="Field">
                      <span>Büroschlüssel (Passwort)</span>
                      <div className="PasswordInputWrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="Input"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="PasswordToggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                          style={{ right: '12px' }}
                        >
                          <img src={showPassword ? "/eye-open.svg" : "/eye-closed.svg"} alt="Passwort umschalten" style={{width: '20px', height: '20px'}} />
                        </button>
                      </div>
                      <Rule ok={passLenOk} label="Mindestens 8 Zeichen" />
                      <Rule ok={passLowerOk} label="Mindestens 1 Kleinbuchstabe (a–z)" />
                      <Rule ok={passUpperOk} label="Mindestens 1 Großbuchstabe (A–Z)" />
                      <Rule ok={passDigitOk} label="Mindestens 1 Zahl (0–9)" />
                    </label>
                    <button type="submit" className="press-copy-button" disabled={loading}>
                      {loading ? 'Registriere…' : 'Ausgabe drucken'}
                    </button>
                  </>
                )}
                {registrationSuccess && <div className="archive-message success">{registrationSuccess}</div>}
                {error && <div className="archive-message error">{error}</div>}
              </form>
            </>
          )}
        </div>
    </div>
  );
}

export default Login;
