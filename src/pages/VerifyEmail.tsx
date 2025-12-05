import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './verify.css';
import { apiUrl } from '../config/api';

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailParam || sessionStorage.getItem('pendingVerificationEmail') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeFromEmail, setCodeFromEmail] = useState<string | null>(null);

  useEffect(() => {
    // Extrahiere E-Mail aus URL Parameter (decode)
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // Parse URL Hash für Supabase Auth Token (falls vorhanden)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const type = params.get('type');
      
      // Extrahiere den Verifizierungscode aus den User Metadata im Token
      const accessToken = params.get('access_token');
      if (accessToken) {
        try {
          // Dekodiere JWT Token (nur Payload, ohne Signatur-Verifizierung)
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          if (payload.user_metadata && payload.user_metadata.verification_code) {
            setCodeFromEmail(payload.user_metadata.verification_code);
          }
        } catch (e) {
          console.error('Token decode error:', e);
        }
      }
      
      // Wenn es ein signup-Token ist, entferne den Hash aus der URL
      if (type === 'signup') {
        // Entferne Hash aus URL ohne Reload
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    // Clear pending email from session storage when component unmounts
    return () => {
      sessionStorage.removeItem('pendingVerificationEmail');
    };
  }, [emailParam]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/auth/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Verifizierung fehlgeschlagen');
      }

      // Email verified successfully - now log the user in
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        window.dispatchEvent(new CustomEvent('userLogin', { detail: data.user }));
      }

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="VerifyPage">
      <div className="VerifyCard">
        {codeFromEmail ? (
          // Zeige nur den Code an, wenn User von E-Mail kommt
          <div style={{ textAlign: 'center' }}>
            <h1>Dein Verifizierungscode</h1>
            <div style={{ 
              background: '#f4f4f4', 
              padding: '30px', 
              borderRadius: '15px', 
              margin: '30px 0',
              border: '2px solid rgba(127, 255, 159, 0.4)'
            }}>
              <div style={{ 
                fontSize: '48px', 
                letterSpacing: '12px', 
                fontWeight: 'bold',
                color: '#7fff9f',
                fontFamily: 'monospace'
              }}>
                {codeFromEmail}
              </div>
            </div>
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
              Kopiere diesen Code und gib ihn auf der Registrierungsseite ein.
              <br />
              <br />
              Nach dem Kopieren kannst du diese Seite schließen.
            </p>
          </div>
        ) : (
          // Normale Verifizierungsseite
          <>
            <h1>E-Mail Verifizierung</h1>
            {success ? (
              <div className="SuccessMessage">
                ✓ E-Mail erfolgreich verifiziert! Du wirst weitergeleitet...
              </div>
            ) : (
              <form onSubmit={handleVerify} className="VerifyForm">
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
                  <span>Verifizierungscode</span>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    maxLength={6}
                    className="Input"
                    placeholder="6-stelliger Code"
                  />
                </label>
                {error && <div className="ErrorMessage">{error}</div>}
                <button type="submit" className="CTAButton" disabled={loading}>
                  {loading ? 'Verifiziere...' : 'Verifizieren'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
