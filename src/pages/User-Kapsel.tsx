import React, { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThreeDStage from '../components/ThreeDStage';
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Verify token and get user data
    fetch('/api/auth/me', {
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


  // Postkarten aus localStorage laden (user-spezifisch)
  const loadPostcards = () => {
    if (!currentUser) return [];
    
    const userPostcardsKey = `userPostcards_${currentUser.id}`;
    const savedPostcards = localStorage.getItem(userPostcardsKey);
    if (savedPostcards) {
      try {
        const parsed = JSON.parse(savedPostcards);
        setPostcards(parsed);
        console.log(`Postkarten für User ${currentUser.id} geladen:`, parsed);
        return parsed;
      } catch (error) {
        console.error('Fehler beim Laden der Postkarten:', error);
        return [];
      }
    }
    // Keine Postkarten für diesen User
    setPostcards([]);
    return [];
  };

  useEffect(() => {
    if (currentUser) {
      loadPostcards();
    }
  }, [currentUser]);

  // Postkarten neu laden wenn Seite fokussiert wird (nach Navigation zurück)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Seite fokussiert - lade Postkarten neu');
      loadPostcards();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Postkarten in localStorage speichern (user-spezifisch)
  useEffect(() => {
    if (postcards.length > 0 && currentUser) {
      const userPostcardsKey = `userPostcards_${currentUser.id}`;
      localStorage.setItem(userPostcardsKey, JSON.stringify(postcards));
      console.log(`Postkarten für User ${currentUser.id} gespeichert:`, postcards);
    }
  }, [postcards, currentUser]);

  // Event-Listener für neue Postkarten
  useEffect(() => {
    const handleNewPostcard = (event: CustomEvent) => {
      const newPostcard = event.detail;
      console.log('Neue Postkarte erhalten:', newPostcard);
      setPostcards(prev => {
        const updated = [...prev, newPostcard];
        console.log('Postkarten aktualisiert:', updated);
        return updated;
      });
      // Gehe zur neuen Karte (letzte in der Liste)
      setCurrentCardIndex(prev => prev + 1);
    };

    const handlePostcardUpdated = (event: CustomEvent) => {
      const updatedPostcard = event.detail;
      console.log('Postkarte aktualisiert erhalten:', updatedPostcard);
      setPostcards(prev => {
        const updated = prev.map(card => 
          card.createdAt === updatedPostcard.createdAt ? updatedPostcard : card
        );
        console.log('Postkarten nach Update:', updated);
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
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : postcards.length - 1));
  };

  const goToNextCard = () => {
    setCurrentCardIndex((prev) => (prev < postcards.length - 1 ? prev + 1 : 0));
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

  const handleDeletePostcard = () => {
    if (currentPostcard && window.confirm('Möchtest du diese Postkarte wirklich löschen?')) {
      const updatedPostcards = postcards.filter((_, index) => index !== currentCardIndex);
      setPostcards(updatedPostcards);
      
      // In localStorage speichern
      if (currentUser) {
        const userPostcardsKey = `userPostcards_${currentUser.id}`;
        localStorage.setItem(userPostcardsKey, JSON.stringify(updatedPostcards));
      }
      
      // Index anpassen
      if (currentCardIndex >= updatedPostcards.length && updatedPostcards.length > 0) {
        setCurrentCardIndex(updatedPostcards.length - 1);
      } else if (updatedPostcards.length === 0) {
        setCurrentCardIndex(0);
      }
    }
    setShowOptions(false);
  };

  const currentPostcard = postcards[currentCardIndex];

  // Debug-Logging
  console.log('Aktuelle Postkarten:', postcards);
  console.log('Aktueller Index:', currentCardIndex);
  console.log('Aktuelle Postkarte:', currentPostcard);
  console.log('localStorage userPostcards:', localStorage.getItem('userPostcards'));


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
              {/* Navigation Pfeile */}
              {postcards.length > 1 && (
                <>
                  <button 
                    className="NavArrow NavArrowLeft" 
                    onClick={goToPreviousCard}
                  >
                    &lt;
                  </button>
                  
                  <button 
                    className="NavArrow NavArrowRight" 
                    onClick={goToNextCard}
                  >
                    &gt;
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
                          />
                        </div>
                        <div className="TemplateImage">
                          <img 
                            src={currentPostcard.images[1]} 
                            alt={`${currentPostcard.title} - Bild 2`}
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
                          />
                        </div>
                        <div className="TemplateImageRow">
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[1]} 
                              alt={`${currentPostcard.title} - Bild 2`}
                            />
                          </div>
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[2]} 
                              alt={`${currentPostcard.title} - Bild 3`}
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
                            />
                          </div>
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[1]} 
                              alt={`${currentPostcard.title} - Bild 2`}
                            />
                          </div>
                        </div>
                        <div className="TemplateImageRow">
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[2]} 
                              alt={`${currentPostcard.title} - Bild 3`}
                            />
                          </div>
                          <div className="TemplateImage">
                            <img 
                              src={currentPostcard.images[3]} 
                              alt={`${currentPostcard.title} - Bild 4`}
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

              {/* Karten-Zähler */}
              {postcards.length > 1 && (
                <div className="CardCounter">
                  {currentCardIndex + 1} / {postcards.length}
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
    </div>
  );
}

export default History;

