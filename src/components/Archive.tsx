import React, { ReactElement, useEffect, useState, useRef } from 'react';
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
        <h2 className="archive-title">DEIN ARCHIV</h2>
        
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
                const isSingleImage = imageCount === 1;
                const isCollage = imageCount >= 2 && imageCount <= 4;
                const isMontage = imageCount >= 5;
                const featureClassName = isSingleImage
                  ? 'feature-single'
                  : isCollage
                    ? 'feature-collage'
                    : isMontage
                      ? 'feature-montage'
                      : '';
                const featureSliceCount = isMontage ? 8 : imageCount;
                return (
                  <div 
                    key={postcard.id}
                    className="carousel-slide"
                    data-position={position}
                    onClick={() => position === 'active' && handlePostcardClick(postcard)}
                  >
                    <div className="postcard-card vintage-newsprint">
                      {/* Extra Edition Masthead Banner */}
                      <div className="extra-edition-banner">
                        <span className="banner-ornament">★</span>
                        <span className="banner-text">SONDERAUSGABE</span>
                        <span className="banner-ornament">★</span>
                      </div>

                      {/* Postcard Masthead with Edition Date */}
                      <div className="postcard-masthead">
                        <p className="postcard-edition-date">
                          Ausgabe vom {formatDate(postcard.createdAt)}
                        </p>
                        <h3 className="postcard-title">{postcard.title}</h3>
                      </div>

                      {/* Main Feature Image with Halftone Effect */}
                      {featureImages.length > 0 && (
                        <div
                          className={`postcard-feature-image halftone-photo ${featureClassName} feature-count-${imageCount}`}
                        >
                          <div className="feature-image-grid">
                            {featureImages.slice(0, featureSliceCount).map((src, imgIndex) => (
                              <div
                                key={`${postcard.id}-feature-${imgIndex}`}
                                className={`feature-image feature-image-${imgIndex + 1} ${imgIndex === 0 ? 'feature-lead' : ''} ${isMontage && imgIndex >= 4 ? 'feature-faded' : ''}`}
                              >
                                <img src={src} alt={postcard.title} />
                              </div>
                            ))}
                          </div>
                          <p className="photo-caption">Historisches Archiv • {formatDate(postcard.date)}</p>
                        </div>
                      )}

                      <div className="postcard-content">
                        <p className="postcard-description">
                          {postcard.description}
                        </p>
                      </div>

                      {/* Postage Stamp Style Element */}
                      <div className="postage-stamp-corner">
                        <div className="stamp-perforation"></div>
                        <span className="stamp-text">ARCHIV</span>
                      </div>

                      {/* Carousel Divider Silhouette */}
                      <div className="carousel-silhouette-divider">
                        <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0,20 Q50,10 100,20 T200,20" stroke="currentColor" fill="none" strokeWidth="2" opacity="0.3"/>
                        </svg>
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
      </div>
    </section>
  );
}

export default Archive;
