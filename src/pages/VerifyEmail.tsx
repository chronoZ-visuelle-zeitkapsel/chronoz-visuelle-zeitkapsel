import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './verify.css';

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailParam || sessionStorage.getItem('pendingVerificationEmail') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear pending email from session storage when component unmounts
    return () => {
      sessionStorage.removeItem('pendingVerificationEmail');
    };
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('http://10.13.51.28:5000/api/auth/verify-email', {
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
      </div>
    </div>
  );
}

export default VerifyEmail;
