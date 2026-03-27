import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import FrameByFrameCanvas from './FrameByFrameCanvas';
import PhotoMagazine from './PhotoMagazine';
import './TreasureWithMagazine.css';

function TreasureWithMagazine() {
  const [showMagazinePreview, setShowMagazinePreview] = useState(false);
  const [showFullMagazine, setShowFullMagazine] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosingChest, setIsClosingChest] = useState(false);

  // Generiere die Frame-URLs (0000.png bis 0078.png)
  const frameUrls = useMemo(() => {
    return Array.from({ length: 79 }, (_, i) =>
      `/TreasureAnimation/TreasureAnimation/${String(i).padStart(4, '0')}.png`
    );
  }, []);

  // Zeige Magazin nach ~0.4 Sekunden (Frame 10 bei 24fps)
  useEffect(() => {
    if (animationStarted && !isClosing) {
      const timer = setTimeout(() => {
        setShowMagazinePreview(true);
      }, 420); // 10 Frames / 24 fps = ~0.42 Sekunden

      return () => clearTimeout(timer);
    }
  }, [animationStarted, isClosing]);

  // Handler für das Schließen mit Animationen
  const handleClose = () => {
    // 1. Schließe das Vollbild-Magazin
    setShowFullMagazine(false);
    setIsClosing(true);

    // 2. Warte kurz, dann spiele Magazin-Rückwärts-Animation
    setTimeout(() => {
      // Nach 1.5s (Magazin slide-in Animation) starte Schatzkisten-Schließung
      setTimeout(() => {
        setIsClosingChest(true);
      }, 1500);
    }, 100);
  };

  // Handler für wenn die Schatzkiste fertig geschlossen ist
  const handleChestClosed = () => {
    // Alles zurücksetzen
    setShowMagazinePreview(false);
    setIsClosing(false);
    setIsClosingChest(false);
    setAnimationStarted(false);
  };

  return (
    <div className="treasure-magazine-container">
      {/* Schatzkisten-Animation im Hintergrund */}
      <div className="treasure-animation" onClick={() => !animationStarted && setAnimationStarted(true)}>
        <FrameByFrameCanvas
          key={isClosingChest ? 'closing' : 'opening'}
          frameUrls={frameUrls}
          fps={isClosingChest ? 60 : 24}
          loop={false}
          playOnLoad={isClosingChest ? true : false}
          reverse={isClosingChest}
          onAnimationComplete={isClosingChest ? handleChestClosed : undefined}
        />
      </div>

      {/* Magazin fährt aus der Schatzkiste heraus */}
      {showMagazinePreview && (
        <div 
          className={`magazine-preview ${!isClosing ? 'slide-out' : 'slide-in'}`}
          onClick={() => !isClosing && setShowFullMagazine(true)}
        >
          <div className="magazine-cover">
            <div className="magazine-glow"></div>
            <img 
              src="/magazine-cover.png" 
              alt="Magazin Cover" 
              className="cover-image"
              onError={(e) => {
                // Fallback auf Emoji wenn Bild fehlt
                e.currentTarget.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = 'cover-placeholder';
                placeholder.textContent = '📖';
                e.currentTarget.parentElement?.appendChild(placeholder);
              }}
            />
            <div className="click-hint">Klicken zum Öffnen</div>
          </div>
        </div>
      )}

      {/* Vollbild-Magazin */}
      {showFullMagazine && ReactDOM.createPortal(
        <PhotoMagazine 
          pdfUrl="/magazine.pdf"
          onClose={handleClose}
        />,
        document.body
      )}
    </div>
  );
}

export default TreasureWithMagazine;
