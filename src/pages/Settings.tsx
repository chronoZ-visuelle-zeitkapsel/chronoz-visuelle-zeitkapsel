import React, { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './settings.css';

type CurrentUser = { id: string; username: string; email: string } | null;

function Settings(): ReactElement {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verify token and get user data
    fetch('http://10.13.51.28:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) {
        localStorage.removeItem('token');
        navigate('/login');
        return null;
      }
      return res.json();
    })
    .then(data => {
      if (data) {
        setCurrentUser({ id: data.id, username: data.username, email: data.email });
        setTwoFactorEnabled(data.two_factor_enabled || false);
      }
    })
    .catch(() => {
      localStorage.removeItem('token');
      navigate('/login');
    })
    .finally(() => {
      setLoading(false);
    });
  }, [navigate]);

  async function handleToggle2FA() {
    setError(null);
    setMessage(null);
    setToggleLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Nicht authentifiziert');
      setToggleLoading(false);
      return;
    }

    try {
      const res = await fetch('http://10.13.51.28:5000/api/auth/toggle-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: !twoFactorEnabled })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '2FA-Umschaltung fehlgeschlagen');

      setTwoFactorEnabled(data.two_factor_enabled);
      setMessage(data.two_factor_enabled 
        ? 'Zwei-Faktor-Authentifizierung aktiviert' 
        : 'Zwei-Faktor-Authentifizierung deaktiviert'
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setToggleLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="SettingsPage">
        <Header />
        <main className="SettingsMain">
          <div className="SettingsCard">
            <p>Laden...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="SettingsPage">
        <Header />
        <main className="SettingsMain">
          <div className="SettingsCard">
            <p>Nicht angemeldet</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="SettingsPage">
      <Header />
      <main className="SettingsMain">
        <div className="SettingsCard">
          <h1>Einstellungen</h1>
          
          <div className="SettingsSection">
            <h2>Profil</h2>
            <div className="ProfileInfo">
              <div className="InfoRow">
                <span className="InfoLabel">Benutzername:</span>
                <span className="InfoValue">{currentUser.username}</span>
              </div>
              <div className="InfoRow">
                <span className="InfoLabel">E-Mail:</span>
                <span className="InfoValue">{currentUser.email}</span>
              </div>
            </div>
          </div>

          <div className="SettingsSection">
            <h2>Sicherheit</h2>
            <div className="SecurityOptions">
              <div className="OptionRow">
                <div className="OptionInfo">
                  <h3>Zwei-Faktor-Authentifizierung</h3>
                  <p className="OptionDescription">
                    Erhöhen Sie die Sicherheit Ihres Kontos mit einem zusätzlichen Verifizierungscode bei der Anmeldung.
                  </p>
                </div>
                <button 
                  className={`ToggleButton ${twoFactorEnabled ? 'active' : ''}`}
                  onClick={handleToggle2FA}
                  disabled={toggleLoading}
                >
                  {toggleLoading ? 'Bitte warten...' : (twoFactorEnabled ? 'Ein' : 'Aus')}
                </button>
              </div>
            </div>
          </div>

          {message && <div className="SuccessMessage">{message}</div>}
          {error && <div className="ErrorMessage">{error}</div>}

          <div className="SettingsActions">
            <button 
              className="BackButton"
              onClick={() => navigate('/history')}
            >
              Zurück zur Übersicht
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Settings;
