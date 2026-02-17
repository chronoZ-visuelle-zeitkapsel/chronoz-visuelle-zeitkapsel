import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './PhotoMagazine.css';

// PDF.js Worker konfigurieren - verwende jsdelivr CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

interface PhotoMagazineProps {
  pdfUrl: string;
  onClose?: () => void;
}

function PhotoMagazine({ pdfUrl, onClose }: PhotoMagazineProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string>('');

  // Memoize options to prevent unnecessary reloads
  const options = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.296/cmaps/',
    cMapPacked: true,
  }), []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('✅ PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setError('');
  }

  function onDocumentLoadError(error: any) {
    console.error('❌ PDF Load Error:', error);
    console.error('Attempted path:', pdfUrl);
    setError(`Fehler: ${error.message || 'PDF konnte nicht geladen werden'}`);
  }

  function onPageLoadSuccess(page: any) {
    console.log('✅ Page', pageNumber, 'loaded successfully');
    console.log('Page dimensions:', page.width, 'x', page.height);
  }

  function onPageLoadError(error: any) {
    console.error('❌ Page Load Error:', error);
  }

  function onPageRenderSuccess() {
    console.log('✅ Page', pageNumber, 'rendered successfully');
    
    // Debug: Check if canvas is in DOM and visible
    setTimeout(() => {
      const canvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
      if (canvas) {
        console.log('Canvas found in DOM:');
        console.log('  - Width:', canvas.width, 'Height:', canvas.height);
        console.log('  - Style width:', canvas.style.width, 'Style height:', canvas.style.height);
        console.log('  - Display:', window.getComputedStyle(canvas).display);
        console.log('  - Visibility:', window.getComputedStyle(canvas).visibility);
        console.log('  - Opacity:', window.getComputedStyle(canvas).opacity);
        
        // Check if canvas has actual pixel data
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
          const pixels = imageData.data;
          let hasColor = false;
          for (let i = 0; i < pixels.length; i += 4) {
            // Check if any pixel is not white (255,255,255)
            if (pixels[i] !== 255 || pixels[i+1] !== 255 || pixels[i+2] !== 255) {
              hasColor = true;
              console.log('✅ Canvas contains colored pixels (not just white)');
              break;
            }
          }
          if (!hasColor) {
            console.warn('⚠️ Canvas is entirely white - PDF content may be corrupt or not rendering');
          }
        }
      } else {
        console.error('❌ Canvas NOT found in DOM!');
      }
    }, 100);
  }

  function onPageRenderError(error: any) {
    console.error('❌ Page Render Error:', error);
  }

  const goToPrevPage = React.useCallback(() => {
    console.log('⬅️ Previous page clicked, current page:', pageNumber);
    setPageNumber(prevPage => {
      const newPage = Math.max(prevPage - 1, 1);
      console.log('Setting page to:', newPage);
      return newPage;
    });
  }, [pageNumber]);

  const goToNextPage = React.useCallback(() => {
    console.log('➡️ Next page clicked, current page:', pageNumber, 'total:', numPages);
    setPageNumber(prevPage => {
      const newPage = Math.min(prevPage + 1, numPages);
      console.log('Setting page to:', newPage);
      return newPage;
    });
  }, [pageNumber, numPages]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevPage, goToNextPage, onClose]);

  return (
    <div className="magazine-overlay" onClick={onClose}>
      <div className="magazine-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
        
        <div className="pdf-viewer-wrapper">
          {numPages > 0 && pageNumber > 1 && (
            <button 
              onClick={goToPrevPage}
              className="nav-button-overlay nav-left"
              aria-label="Vorherige Seite"
            >
              ‹
            </button>
          )}

          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="loading">📄 PDF wird geladen...</div>}
            error={<div className="error">{error || 'Fehler beim Laden des PDFs'}</div>}
            options={options}
          >
            {numPages > 0 && (
              <div className="pdf-viewer" style={{ position: 'relative' }}>
                <Page
                  pageNumber={pageNumber}
                  height={window.innerHeight * 0.88}
                  onLoadSuccess={onPageLoadSuccess}
                  onLoadError={onPageLoadError}
                  onRenderSuccess={onPageRenderSuccess}
                  onRenderError={onPageRenderError}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={<div className="loading">Seite wird gerendert...</div>}
                  canvasBackground="white"
                />
              </div>
            )}
          </Document>

          {numPages > 0 && pageNumber < numPages && (
            <button 
              onClick={goToNextPage}
              className="nav-button-overlay nav-right"
              aria-label="Nächste Seite"
            >
              ›
            </button>
          )}

          {numPages > 0 && (
            <div className="page-indicator">
              {pageNumber} / {numPages}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoMagazine;
