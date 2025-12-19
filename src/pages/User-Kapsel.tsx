import React, { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TimelineSlider from '../components/TimelineSlider';
import { apiUrl } from '../config/api';
import './User-Kapsel.css';

type CurrentUser = { id: string; username: string; email: string } | null;

type Postcard = {
  id: string;
  title: string;
  description: string;
  date: string;
  images: string[];
  createdAt: string;
};

function History(): ReactElement {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);
  const [postcards, setPostcards] = useState<Postcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verify token and get user data
    fetch(apiUrl('/api/auth/me'), {
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


  useEffect(() => {
    const loadPostcards = async () => {
      if (!currentUser) return [];
      
      const token = localStorage.getItem('token');
      if (!token) return [];

      try {
        const response = await fetch(apiUrl('/api/postcards'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Fehler beim Laden der Postkarten');
        }

        const postcards = await response.json();
        
        // Sortiere nach Datum (älteste zuerst)
        const sortedPostcards = postcards.sort((a: Postcard, b: Postcard) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        setPostcards(sortedPostcards);
        console.log(`Postkarten für User ${currentUser.id} geladen:`, sortedPostcards);
        
        // Prüfe ob eine zuletzt bearbeitete/erstellte Postkarte existiert
        const lastPostcardId = localStorage.getItem('lastViewedPostcardId');
        if (lastPostcardId) {
          const index = sortedPostcards.findIndex((card: Postcard) => card.id === lastPostcardId);
          if (index !== -1) {
            setCurrentCardIndex(index);
            console.log(`Springe zu zuletzt bearbeiteter Postkarte: Index ${index}`);
          }
          // Entferne nach Verwendung
          localStorage.removeItem('lastViewedPostcardId');
        }
        
        return sortedPostcards;
      } catch (error) {
        console.error('Fehler beim Laden der Postkarten:', error);
        return [];
      }
    };

    if (currentUser) {
      loadPostcards();
    }
  }, [currentUser]);

  // Postkarten neu laden wenn Seite fokussiert wird (nach Navigation zurück)
  // Postkarten neu laden wenn Seite fokussiert wird (nach Navigation zurück)
  useEffect(() => {
    const handleFocus = async () => {
      if (!currentUser) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('Seite fokussiert - lade Postkarten neu');
      try {
        const response = await fetch(apiUrl('/api/postcards'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Fehler beim Laden der Postkarten');
        }

        const postcards = await response.json();
        
        // Sortiere nach Datum (älteste zuerst)
        const sortedPostcards = postcards.sort((a: Postcard, b: Postcard) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        setPostcards(sortedPostcards);
      } catch (error) {
        console.error('Fehler beim Laden der Postkarten:', error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentUser]);
  // Postkarten in Datenbank speichern nicht mehr notwendig - wird durch API gemacht
  // useEffect entfernt

  // Event-Listener für neue Postkarten
  useEffect(() => {
    const handleNewPostcard = (event: CustomEvent) => {
      const newPostcard = event.detail;
      console.log('Neue Postkarte erhalten:', newPostcard);
      // Speichere ID für späteren Abruf nach Seiten-Reload
      localStorage.setItem('lastViewedPostcardId', newPostcard.id);
      setPostcards(prev => {
        // Füge neue Postkarte hinzu und sortiere nach Datum
        const updated = [...prev, newPostcard].sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        console.log('Postkarten aktualisiert:', updated);
        
        // Finde den Index der neuen Postkarte in der sortierten Liste
        const newIndex = updated.findIndex(card => card.id === newPostcard.id);
        setCurrentCardIndex(newIndex);
        
        return updated;
      });
    };

    const handlePostcardUpdated = (event: CustomEvent) => {
      const updatedPostcard = event.detail;
      console.log('Postkarte aktualisiert erhalten:', updatedPostcard);
      // Speichere ID für späteren Abruf nach Seiten-Reload
      localStorage.setItem('lastViewedPostcardId', updatedPostcard.id);
      setPostcards(prev => {
        // Aktualisiere Postkarte und sortiere nach Datum
        const updated = prev.map(card => 
          card.id === updatedPostcard.id ? updatedPostcard : card
        ).sort((a, b) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        console.log('Postkarten nach Update:', updated);
        
        // Finde den neuen Index der aktualisierten Postkarte
        const newIndex = updated.findIndex(card => card.id === updatedPostcard.id);
        setCurrentCardIndex(newIndex);
        
        return updated;
      });
    };

    // Event-Listener hinzufügen
    window.addEventListener('newPostcard', handleNewPostcard as EventListener);
    window.addEventListener('postcardUpdated', handlePostcardUpdated as EventListener);
    console.log('Event-Listener für newPostcard und postcardUpdated registriert');
    
    return () => {
      window.removeEventListener('newPostcard', handleNewPostcard as EventListener);
      window.removeEventListener('postcardUpdated', handlePostcardUpdated as EventListener);
      console.log('Event-Listener entfernt');
    };
  }, []);

  // Dropdown schließen bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.PostcardOptions')) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptions]);

  const goToPreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const goToNextCard = () => {
    if (currentCardIndex < postcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handleEditPostcard = () => {
    if (currentPostcard) {
      // Postkarte-Daten an CreatePostcard weitergeben
      localStorage.setItem('editingPostcard', JSON.stringify({
        ...currentPostcard,
        isEditing: true
      }));
      navigate('/create-postcard');
    }
    setShowOptions(false);
  };

  const handleDeletePostcard = async () => {
    if (!currentPostcard) return;
    
    if (!window.confirm('Möchtest du diese Postkarte wirklich löschen?')) {
      setShowOptions(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(apiUrl(`/api/postcards/${currentPostcard.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Postkarte');
      }

      // Entferne Postkarte aus der lokalen Liste
      const updatedPostcards = postcards.filter((_, index) => index !== currentCardIndex);
      setPostcards(updatedPostcards);
      
      // Index anpassen
      if (currentCardIndex >= updatedPostcards.length && updatedPostcards.length > 0) {
        setCurrentCardIndex(updatedPostcards.length - 1);
      } else if (updatedPostcards.length === 0) {
        setCurrentCardIndex(0);
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Postkarte');
    }
    
    setShowOptions(false);
  };

  const currentPostcard = postcards[currentCardIndex];

  // Debug-Logging
  console.log('Aktuelle Postkarten:', postcards);
  console.log('Aktueller Index:', currentCardIndex);
  console.log('Aktuelle Postkarte:', currentPostcard);


  if (loading) {
    return (
      <div className="UserKapselPage">
        <Header />
        <main className="UserKapselMain">
          <div className="LoadingMessage">Lade deine Kapsel...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="UserKapselPage">
        <Header />
        <main className="UserKapselMain">
          <div className="ErrorMessage">Du musst dich einloggen, um deine Kapsel zu sehen.</div>
          <button className="CTAButton" onClick={() => navigate('/login')}>
            Zum Login
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="UserKapselPage">
      <Header />
      <main className="UserKapselMain">
        {postcards.length > 0 && postcards.length > 1 && (
          <TimelineSlider
            postcards={postcards}
            currentIndex={currentCardIndex}
            onIndexChange={setCurrentCardIndex}
          />
        )}
        
        {/* Vollbild Container */}
        <div className="FullScreenContainer">
          {postcards.length === 0 ? (
            // Keine Postkarten - zentraler + Button
            <div className="ThreeDStage">
              <div className="StageGlass">
                <button 
                  className="AddMemoryButton"
                  onClick={() => navigate('/create-postcard')}
                >
                  <span className="Plus">+</span>
                </button>
              </div>
            </div>
          ) : (
            // Postkarten vorhanden - Anzeige mit Navigation
            <>
    
              {/* Navigation Pfeil e */}
              {postcards.length > 1 && (
                <>
                  <button
                    className="NavArrow NavArrowLeft"
                    onClick={goToPreviousCard}
                    disabled={currentCardIndex === 0}
                    aria-label="Vorherige Postkarte"
                  >
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                  </button>

                  <button
                    className="NavArrow NavArrowRight"
                    onClick={goToNextCard}
                    disabled={currentCardIndex === postcards.length - 1}
                    aria-label="Nächste Postkarte"
                  >
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                    </svg>
                  </button>
                </>
              )}

              {/* Aktuelle Postkarte */}
              {currentPostcard && (
                <div className="Postcard">
                  {/* Options Button */}
                  <div className="PostcardOptions">
                    <button 
                      className="OptionsButton"
                      onClick={() => setShowOptions(!showOptions)}
                      title="Optionen"
                    >
                      ⋯
                    </button>
                    {showOptions && (
                      <div className="OptionsDropdown">
                        <button 
                          className="OptionsItem"
                          onClick={handleEditPostcard}
                        >
                          ✏️ Bearbeiten
                        </button>
                        <button 
                          className="OptionsItem OptionsItemDanger"
                          onClick={handleDeletePostcard}
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="PostcardImages">
                    {currentPostcard.images.length === 1 ? (
                      <div className="Template1">
                        <div className="TemplateImage">
                          <img 
                            src={currentPostcard.images[0]} 
                            alt={`${currentPostcard.title} - Bild 1`}
                            onClick={() => setLightboxImage(currentPostcard.images[0])}
                            style={{ cursor: 'pointer' }}
                            onError={(e) => {
                              console.error('Fehler beim Laden des Bildes:', e);
                              (e.target as HTMLImageElement).src = 'placeholder.png';
                            }}
                          />
                        </div>
                      </div>
                    ) : currentPostcard.images.length === 2 ? (
                      // Template 2: Zwei Bilder - Nebeneinander
                      <div className="Template2">
                        <div className="TemplateImage">
                          <img 
                            src={currentPostcard.images[0]} 
                            alt={`${currentPostcard.title} - Bild 1`}
                            onClick={() => setLightboxImage(currentPostcard.images[0])}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                        <div className="TemplateImage">
                          <img 
                            src={currentPostcard.images[1]} 
                            alt={`${currentPostcard.title} - Bild 2`}
                            onClick={() => setLightboxImage(currentPostcard.images[1])}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    ) : currentPostcard.images.length === 3 ? (
                      // Template 3: Drei Bilder - 1 oben, 2 unten
                      <div className="Template3">
                        <div className="TemplateImage TemplateImageTop">
                          <img 
                            src={currentPostcard.images[0]} 
                            alt={`${currentPostcard.title} - Bild 1`}
                            onClick={() => setLightboxImage(currentPostcard.images[0])}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                        <div className="TemplateImageRow">
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[1]} 
                              alt={`${currentPostcard.title} - Bild 2`}
                              onClick={() => setLightboxImage(currentPostcard.images[1])}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[2]} 
                              alt={`${currentPostcard.title} - Bild 3`}
                              onClick={() => setLightboxImage(currentPostcard.images[2])}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : currentPostcard.images.length === 4 ? (
                      // Template 4: Vier Bilder - 2x2 Grid
                      <div className="Template4">
                        <div className="TemplateImageRow">
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[0]} 
                              alt={`${currentPostcard.title} - Bild 1`}
                              onClick={() => setLightboxImage(currentPostcard.images[0])}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[1]} 
                              alt={`${currentPostcard.title} - Bild 2`}
                              onClick={() => setLightboxImage(currentPostcard.images[1])}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                        <div className="TemplateImageRow">
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[2]} 
                              alt={`${currentPostcard.title} - Bild 3`}
                              onClick={() => setLightboxImage(currentPostcard.images[2])}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[3]} 
                              alt={`${currentPostcard.title} - Bild 4`}
                              onClick={() => setLightboxImage(currentPostcard.images[3])}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Kein Bild - Platzhalter
                      <div className="TemplatePlaceholder">
                        <div className="PlaceholderIcon">📸</div>
                        <div className="PlaceholderText">Kein Bild</div>
                      </div>
                    )}
                  </div>
                  <div className="PostcardContent">
                    <h2 className="PostcardTitle">{currentPostcard.title}</h2>
                    <div className="PostcardDate">
                      {new Date(currentPostcard.date).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <p className="PostcardDescription">{currentPostcard.description}</p>
                  </div>
                </div>
              )}

              {/* + Button nach rechts unten */}
              <button 
                className="AddButton AddButtonBottomRight"
                onClick={() => navigate('/create-postcard')}
              >
                <span className="Plus">+</span>
              </button>
            </>
          )}
        </div>
      </main>
      <Footer />
      
      {/* Lightbox für Bildanzeige */}
      {lightboxImage && (
        <div 
          className="Lightbox" 
          onClick={() => setLightboxImage(null)}
        >
          <div className="LightboxContent">
            <button 
              className="LightboxClose"
              onClick={() => setLightboxImage(null)}
            >
              ✕
            </button>
            <img 
              src={lightboxImage} 
              alt="Vergrößertes Bild"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default History;