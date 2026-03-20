import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiUrl } from '../config/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './User-Kapsel.css';
import './archive-sheet.css';

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
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });
  const pdfExportRootRef = useRef<HTMLDivElement | null>(null);

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

  const handleDownloadPDF = async () => {
    setShowOptions(false);
    
    if (postcards.length === 0) {
      alert('Keine Postkarten zum Exportieren vorhanden');
      return;
    }
    
    setIsGeneratingPDF(true);
    setPdfProgress({ current: 0, total: postcards.length + 1 });
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const totalPages = postcards.length + 1;

      // Ensure the hidden export DOM is rendered before capturing.
      await new Promise(resolve => setTimeout(resolve, 80));

      const pageElements = Array.from(
        pdfExportRootRef.current?.querySelectorAll<HTMLDivElement>('.PDFExportPage') ?? []
      );

      if (pageElements.length !== totalPages) {
        throw new Error(
          `Eine Export-Seite konnte nicht gerendert werden (${pageElements.length}/${totalPages}).`
        );
      }

      for (let i = 0; i < totalPages; i++) {
        const pageElement = pageElements[i];

        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#f4ede1',
          logging: false,
          windowWidth: pageElement.scrollWidth,
          windowHeight: pageElement.scrollHeight
        });

        const imageData = canvas.toDataURL('image/jpeg', 0.96);
        const imageRatio = canvas.width / canvas.height;
        const pageRatio = pageWidth / pageHeight;

        let renderWidth = pageWidth;
        let renderHeight = pageHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (imageRatio > pageRatio) {
          renderHeight = pageWidth / imageRatio;
          offsetY = (pageHeight - renderHeight) / 2;
        } else {
          renderWidth = pageHeight * imageRatio;
          offsetX = (pageWidth - renderWidth) / 2;
        }

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imageData, 'JPEG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');

        setPdfProgress({ current: i + 1, total: totalPages });
        await new Promise(resolve => setTimeout(resolve, 40));
      }
      
      // PDF speichern
      const filename = `chronoZ_Zeitkapsel_${currentUser?.username || 'user'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      setIsGeneratingPDF(false);
      alert(`PDF mit ${postcards.length} Postkarten erfolgreich erstellt!`);
      
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      setIsGeneratingPDF(false);
      alert('Fehler beim Erstellen des PDFs: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
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
        <div className="FullScreenContainer">
          {postcards.length === 0 ? (
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
            <div className="ArchiveSheet">
              <header className="ArchiveHeader">
                <h1 className="ArchiveTitle">{currentUser?.username || 'Benutzer'}'s Zeitkapsel</h1>
              </header>

              <div className="ArchiveTimeline">
                {postcards.length > 1 && (
                  <button
                    className="TimelineNavArrow TimelineNavLeft"
                    onClick={goToPreviousCard}
                    disabled={currentCardIndex === 0}
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                )}
                <div className="TimelineDots">
                  {postcards.map((postcard, idx) => {
                    const isActive = idx === currentCardIndex;
                    const postcardYear = new Date(postcard.date).getFullYear();
                    
                    return (
                      <div 
                        key={postcard.id} 
                        className={`TimelineDot ${isActive ? 'TimelineDotActive' : ''}`}
                        onClick={() => setCurrentCardIndex(idx)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="DotMarker">●</span>
                        <span className="DotYear">{postcardYear}</span>
                        <span className="DotPosition">POS. {idx + 1}/{postcards.length}</span>
                      </div>
                    );
                  })}
                </div>
                {postcards.length > 1 && (
                  <button
                    className="TimelineNavArrow TimelineNavRight"
                    onClick={goToNextCard}
                    disabled={currentCardIndex === postcards.length - 1}
                    aria-label="Next"
                  >
                    ›
                  </button>
                )}
                <div className="TimelineRack" />
              </div>

              <div className="CarouselRack">
                {postcards.map((postcard, index) => {
                  const isCenter = index === currentCardIndex;
                  const offset = index - currentCardIndex;
                  const distance = Math.abs(offset);
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
                  
                  if (!isCenter) return null;
                  
                  return (
                    <div 
                      key={postcard.id}
                      className={`RackCard ${isCenter ? 'RackCardActive' : ''}`}
                      style={{
                        transform: `translateX(${offset * 5}px) scale(${isCenter ? 1 : 0.95})`,
                        zIndex: isCenter ? 10 : 5 - distance,
                        opacity: Math.max(0.5, 1 - distance * 0.2)
                      }}
                      onClick={() => {
                        if (isCenter) {
                          setShowDetailedView(true);
                        } else {
                          setCurrentCardIndex(index);
                        }
                      }}
                    >
                      {isCenter && (
                        <div className="PostcardOptions">
                          <button 
                            className="OptionsButton"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowOptions(!showOptions);
                            }}
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
                      )}

                      <div className="RackCardImages">
                        {featureImages.length > 0 && (
                          <div
                            className={`postcard-feature-image halftone-photo ${featureClassName} feature-count-${imageCount}`}
                          >
                            <div className="feature-image-grid">
                              {featureImages.slice(0, featureSliceCount).map((src, imgIndex) => (
                                <div
                                  key={`${postcard.id}-feature-${imgIndex}`}
                                  className={`feature-image feature-image-${imgIndex + 1} ${imgIndex === 0 ? 'feature-lead' : ''} ${isMontage && imgIndex >= 4 ? 'feature-faded' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDetailedView(true);
                                  }}
                                >
                                  <img src={src} alt={`${postcard.title} ${imgIndex + 1}`} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="RackCardInfo">
                        <h3 className="RackCardTitle">{postcard.title.toUpperCase()}</h3>
                        <time className="RackCardDate">
                          {new Date(postcard.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }).toUpperCase()}
                        </time>
                      </div>

                      <div className="RackCardPosition">{index + 1}/{postcards.length}</div>
                    </div>
                  );
                })}
              </div>

              <footer className="ArchiveFooter">
                <div className="ArchiveDateline">
                  VIENNA DISPATCH • {new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }).toUpperCase()}
                </div>
                <p className="ArchiveDescription">
                  Your complete archive rack—{postcards.length} memories preserved in the eternal newsprint of time.
                </p>
              </footer>

              <button 
                className="AddButton AddButtonBottomRight"
                onClick={() => navigate('/create-postcard')}
              >
                <span className="Plus">+</span>
              </button>

              <button 
                className="DownloadButton AddButtonBottomLeft"
                onClick={handleDownloadPDF}
                title="Als PDF exportieren"
              >
                <span className="DownloadIcon">📥</span>
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {showDetailedView && postcards[currentCardIndex] && (
        <div className="ArchiveSlideOverlay" onClick={() => setShowDetailedView(false)}>
          <div className="ArchiveSlideContainer" onClick={(e) => e.stopPropagation()}>
            <button 
              className="ArchiveSlideClose"
              onClick={() => setShowDetailedView(false)}
            >
              ✕
            </button>
            
            <div className="ArchiveSlide">
              <header className="ArchiveSlideHeader">
                <div className="ArchiveSlideDate">
                  {new Date(postcards[currentCardIndex].date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }).toUpperCase()}
                </div>
                <h1 className="ArchiveSlideTitle">{postcards[currentCardIndex].title}</h1>
                <div className="ArchiveSlideDivider">★ ★ ★</div>
              </header>

              <div className="ArchiveSlideContent">
                <div className="ArchiveSlideImages">
                  {postcards[currentCardIndex].images.map((src, idx) => (
                    <div key={src} className="postcard-image-wrapper">
                      <img
                        className="postcard-image"
                        src={src}
                        alt={`${postcards[currentCardIndex].title} ${idx + 1}`}
                        onClick={() => setLightboxImage(src)}
                      />
                    </div>
                  ))}
                </div>

                <div className="ArchiveSlideText">
                  <p className="ArchiveSlideDescription">{postcards[currentCardIndex].description}</p>

            <div className="PDFExportRoot" aria-hidden="true" ref={pdfExportRootRef}>
              <div className="PDFExportPage">
                <div className="ArchiveSheet PDFCoverSheet">
                  <header className="ArchiveHeader">
                    <h1 className="ArchiveTitle">{currentUser?.username || 'Benutzer'}'S ZEITKAPSEL</h1>
                  </header>

                  <section className="PDFCoverContent">
                    <h2 className="PDFCoverHeading">Inhaltsverzeichnis</h2>
                    <p className="PDFCoverSubline">
                      {postcards.length} {postcards.length === 1 ? 'Erinnerung' : 'Erinnerungen'} archiviert
                    </p>

                    <ol className="PDFCoverList">
                      {postcards.map((postcard, index) => (
                        <li key={`pdf-cover-${postcard.id}`} className="PDFCoverItem">
                          <span className="PDFCoverItemIndex">{index + 1}.</span>
                          <span className="PDFCoverItemTitle">{postcard.title}</span>
                          <span className="PDFCoverItemDate">
                            {new Date(postcard.date).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>

                  <footer className="ArchiveFooter">
                    <div className="ArchiveDateline">
                      VIENNA DISPATCH - {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }).toUpperCase()}
                    </div>
                    <p className="ArchiveDescription">
                      Complete archive export generated from your live chronoZ design.
                    </p>
                  </footer>
                </div>
              </div>

              {postcards.map((postcard, index) => (
                <div className="PDFExportPage" key={`pdf-page-${postcard.id}`}>
                  <article className="ArchiveSlide PDFArchiveSlide">
                    <header className="ArchiveSlideHeader">
                      <div className="ArchiveSlideDate">
                        {new Date(postcard.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        }).toUpperCase()}
                      </div>
                      <h2 className="ArchiveSlideTitle">{postcard.title}</h2>
                      <div className="ArchiveSlideDivider">* * *</div>
                    </header>

                    <div className="ArchiveSlideContent">
                      <div className="ArchiveSlideImages">
                        {postcard.images.length > 0 ? (
                          postcard.images.slice(0, 6).map((src, imgIdx) => (
                            <div key={`${postcard.id}-pdf-image-${imgIdx}`} className="postcard-image-wrapper">
                              <img src={src} alt={`${postcard.title} ${imgIdx + 1}`} />
                            </div>
                          ))
                        ) : (
                          <div className="SlideImgPlaceholder">[]</div>
                        )}
                      </div>

                      <div className="ArchiveSlideText">
                        <p className="ArchiveSlideDescription">{postcard.description}</p>
                        <div className="ArchiveSlideFootnote">
                          Memory #{index + 1} of {postcards.length} - Preserved in the Vienna Archive
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
                  <div className="ArchiveSlideFootnote">
                    Memory #{currentCardIndex + 1} of {postcards.length} • Preserved in the Vienna Archive
                  </div>
                </div>
              </div>

              <div className="ArchiveSlideNavigation">
                <button 
                  className="ArchiveSlideNav ArchiveSlideNavPrev"
                  onClick={() => {
                    if (currentCardIndex > 0) {
                      setCurrentCardIndex(currentCardIndex - 1);
                    }
                  }}
                  disabled={currentCardIndex === 0}
                >
                  ‹ PREVIOUS
                </button>
                <button 
                  className="ArchiveSlideNav ArchiveSlideNavNext"
                  onClick={() => {
                    if (currentCardIndex < postcards.length - 1) {
                      setCurrentCardIndex(currentCardIndex + 1);
                    }
                  }}
                  disabled={currentCardIndex === postcards.length - 1}
                >
                  NEXT ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
      
      {isGeneratingPDF && (
        <div className="PDFGeneratingOverlay">
          <div className="PDFGeneratingContent">
            <div className="PDFGeneratingSpinner"></div>
            <h2 className="PDFGeneratingTitle">PDF wird erstellt...</h2>
            <p className="PDFGeneratingProgress">
              Postkarte {pdfProgress.current} von {pdfProgress.total}
            </p>
            <div className="PDFProgressBar">
              <div 
                className="PDFProgressBarFill"
                style={{ 
                  width: `${(pdfProgress.current / pdfProgress.total) * 100}%` 
                }}
              ></div>
            </div>
            <p className="PDFGeneratingHint">Bitte warten, dies kann einen Moment dauern...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;