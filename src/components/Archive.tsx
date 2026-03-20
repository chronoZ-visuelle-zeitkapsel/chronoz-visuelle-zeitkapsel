import React, { ReactElement, useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import './archive.css';
import './archive-vintage.css';

type Postcard = {
  id: string;
  title: string;
  description: string;
  date: string;
  images: string[];
  createdAt: string;
};

function Archive(): ReactElement {
  const navigate = useNavigate();
  const [postcards, setPostcards] = useState<Postcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const loadPostcards = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setPostcards([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/postcards'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Postkarten');
      }

      const data = await response.json();
      
      // Sortiere nach Erstellungsdatum (neueste zuerst)
      const sortedPostcards = data.sort((a: Postcard, b: Postcard) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setPostcards(sortedPostcards);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Fehler beim Laden der Postkarten:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPostcards();
  }, [loadPostcards]);

  useEffect(() => {
    const handleUserLogin = () => {
      loadPostcards();
    };

    window.addEventListener('userLogin', handleUserLogin);
    return () => {
      window.removeEventListener('userLogin', handleUserLogin);
    };
  }, [loadPostcards]);

  // Auto-play Karussell
  useEffect(() => {
    if (!isAutoPlaying || postcards.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % postcards.length);
    }, 5000); // Alle 5 Sekunden

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, postcards.length]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % postcards.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + postcards.length) % postcards.length);
  };

  const getSlidePosition = (index: number): string => {
    if (index === currentIndex) return 'active';
    
    const prevIndex = currentIndex === 0 ? postcards.length - 1 : currentIndex - 1;
    const nextIndex = currentIndex === postcards.length - 1 ? 0 : currentIndex + 1;
    
    if (index === prevIndex) return 'prev';
    if (index === nextIndex) return 'next';
    
    return 'hidden';
  };

  const handlePostcardClick = (postcard: Postcard) => {
    localStorage.setItem('lastViewedPostcardId', postcard.id);
    navigate('/history');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="archive-section">
        <div className="archive-container">
          <div className="archive-loading">Lade Zeitkapseln...</div>
        </div>
      </section>
    );
  }

  if (postcards.length === 0) {
    return (
      <section className="archive-section">
        <div className="archive-container">
          <h2 className="archive-title">DEIN ARCHIV</h2>
          <div className="archive-empty">
            <p>Du hast noch keine Postkarten erstellt.</p>
            <button 
              className="archive-create-btn"
              onClick={() => navigate('/create-postcard')}
            >
              Erste Postkarte erstellen
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="archive-section">
      <div className="archive-container" id="archive">
        
        <div className="carousel-wrapper">
          <button 
            className="carousel-btn prev" 
            onClick={prevSlide}
            aria-label="Vorherige Postkarte"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div className="carousel-container">
            <div className="carousel-track">
              {postcards.map((postcard, index) => {
                const position = getSlidePosition(index);
                const imageCount = postcard.images ? postcard.images.length : 0;
                const featureImages = postcard.images ? postcard.images : [];
                const isMontage = imageCount >= 5;
                const featureSliceCount = isMontage ? 8 : imageCount;
                return (
                  <div 
                    key={postcard.id}
                    className="carousel-slide"
                    data-position={position}
                    onClick={() => position === 'active' && handlePostcardClick(postcard)}
                  >
                    <div className="ArchiveSlide">
                      <header className="ArchiveSlideHeader">
                        <div className="ArchiveSlideDate">
                          {formatDate(postcard.date)}
                        </div>
                        <h1 className="ArchiveSlideTitle">{postcard.title}</h1>
                        <div className="ArchiveSlideDivider">★ ★ ★</div>
                      </header>

                      <div className="ArchiveSlideContent">
                        <div className="ArchiveSlideImages">
                          {featureImages.slice(0, featureSliceCount).map((src, imgIndex) => (
                            <div key={src} className="postcard-image-wrapper">
                              <img
                                className="postcard-image"
                                src={src}
                                alt={`${postcard.title} ${imgIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="ArchiveSlideText">
                          <p className="ArchiveSlideDescription">{postcard.description}</p>
                          <div className="ArchiveSlideFootnote">
                            Memory #{index + 1} of {postcards.length} • chronoZ
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            className="carousel-btn next" 
            onClick={nextSlide}
            aria-label="Nächste Postkarte"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <button
          className="archive-add-button"
          onClick={() => navigate('/create-postcard')}
          aria-label="Neue Kapsel erstellen"
          title="Neue Kapsel erstellen"
        >
          +
        </button>
      </div>
    </section>
  );
}

export default Archive;
