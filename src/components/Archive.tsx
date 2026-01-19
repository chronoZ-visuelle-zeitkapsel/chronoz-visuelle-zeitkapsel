import React, { ReactElement, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import './archive.css';

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

  useEffect(() => {
    const loadPostcards = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

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
      } catch (error) {
        console.error('Fehler beim Laden der Postkarten:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPostcards();
  }, []);

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

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
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
          <h2 className="archive-title">Dein Archiv</h2>
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
      <div className="archive-container">
        <h2 className="archive-title">Dein Archiv</h2>
        
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
                return (
                  <div 
                    key={postcard.id}
                    className="carousel-slide"
                    data-position={position}
                    onClick={() => position === 'active' && handlePostcardClick(postcard)}
                  >
                    <div className="carousel-card">
                      {postcard.images && postcard.images.length > 0 ? (
                        <div className="carousel-card-image">
                          <img src={postcard.images[0]} alt={postcard.title} />
                        </div>
                      ) : (
                        <div className="carousel-card-placeholder">
                          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                      )}
                      <div className="carousel-card-content">
                        <h3 className="carousel-card-title">{postcard.title}</h3>
                        <p className="carousel-card-description">{postcard.description}</p>
                        <div className="carousel-card-footer">
                          <span className="carousel-card-date">
                            📅 {formatDate(postcard.date)}
                          </span>
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

        <div className="carousel-indicators">
          {postcards.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Gehe zu Postkarte ${index + 1}`}
            />
          ))}
        </div>

        <div className="carousel-info">
          <p className="carousel-counter">
            {currentIndex + 1} / {postcards.length}
          </p>
          <button 
            className={`autoplay-toggle ${isAutoPlaying ? 'active' : ''}`}
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            aria-label={isAutoPlaying ? 'Auto-Play pausieren' : 'Auto-Play starten'}
          >
            {isAutoPlaying ? '⏸' : '▶'}
          </button>
          <button 
            className="archive-view-all-btn"
            onClick={() => navigate('/history')}
          >
            Alle ansehen →
          </button>
        </div>
      </div>
    </section>
  );
}

export default Archive;
