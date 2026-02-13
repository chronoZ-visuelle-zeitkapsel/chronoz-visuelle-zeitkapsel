import React, { useState, useEffect, useMemo } from 'react';
import FrameByFrameCanvas from './FrameByFrameCanvas';
import PhotoMagazine from './PhotoMagazine';
import './TreasureWithMagazine.css';

function TreasureWithMagazine() {
  const [showMagazinePreview, setShowMagazinePreview] = useState(false);
  const [showFullMagazine, setShowFullMagazine] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);

  // Generiere die Frame-URLs (0000.png bis 0078.png)
  const frameUrls = useMemo(() => {
    return Array.from({ length: 79 }, (_, i) =>
      `/TreasureAnimation/TreasureAnimation/${String(i).padStart(4, '0')}.png`
    );
  }, []);

  // Zeige Magazin nach ~0.4 Sekunden (Frame 10 bei 24fps)
  useEffect(() => {
    if (animationStarted) {
      const timer = setTimeout(() => {
        setShowMagazinePreview(true);
      }, 420); // 10 Frames / 24 fps = ~0.42 Sekunden

      return () => clearTimeout(timer);
    }
  }, [animationStarted]);

  return (
    <div className="treasure-magazine-container">
      {/* Schatzkisten-Animation im Hintergrund */}
      <div className="treasure-animation" onClick={() => setAnimationStarted(true)}>
        <FrameByFrameCanvas
          frameUrls={frameUrls}
          fps={24}
          loop={false}
          playOnLoad={false}
        />
      </div>

      {/* Magazin fährt aus der Schatzkiste heraus */}
      {showMagazinePreview && (
        <div 
          className={`magazine-preview ${showMagazinePreview ? 'slide-out' : ''}`}
          onClick={() => setShowFullMagazine(true)}
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
      {showFullMagazine && (
        <PhotoMagazine 
          pdfUrl="/magazine.pdf"
          onClose={() => setShowFullMagazine(false)}
        />
      )}
    </div>
  );
}

export default TreasureWithMagazine;
