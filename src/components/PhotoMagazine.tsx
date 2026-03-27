import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  const prevIsMobileRef = useRef<boolean>(window.innerWidth <= 768);

  const totalDesktopSpreads = numPages > 0 ? 1 + Math.ceil(Math.max(0, numPages - 1) / 2) : 0;
  const totalDisplayPages = isMobile ? numPages : totalDesktopSpreads;
  const currentDisplayPage = pageNumber;
  const desktopLeftPage = !isMobile ? (pageNumber === 1 ? 1 : (pageNumber - 1) * 2) : null;
  const desktopRightPage = !isMobile && pageNumber > 1 && desktopLeftPage !== null && (desktopLeftPage + 1) <= numPages
    ? desktopLeftPage + 1
    : null;

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
    console.log('✅ Page loaded successfully');
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
    console.log('➡️ Next page clicked, current page:', pageNumber, 'total:', totalDisplayPages);
    setPageNumber(prevPage => {
      const newPage = Math.min(prevPage + 1, totalDisplayPages);
      console.log('Setting page to:', newPage);
      return newPage;
    });
  }, [pageNumber, totalDisplayPages]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const wasMobile = prevIsMobileRef.current;
    if (wasMobile === isMobile || numPages === 0) {
      prevIsMobileRef.current = isMobile;
      return;
    }

    setPageNumber(prevPage => {
      const convertedPage = isMobile
        ? (prevPage === 1 ? 1 : (prevPage - 1) * 2)
        : (prevPage === 1 ? 1 : 1 + Math.ceil((prevPage - 1) / 2));
      const maxPage = isMobile ? numPages : totalDesktopSpreads;
      return Math.max(1, Math.min(convertedPage, maxPage));
    });

    prevIsMobileRef.current = isMobile;
  }, [isMobile, numPages, totalDesktopSpreads]);

  useEffect(() => {
    if (totalDisplayPages === 0) {
      return;
    }

    setPageNumber(prevPage => {
      return Math.max(1, Math.min(prevPage, totalDisplayPages));
    });
  }, [totalDisplayPages]);

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
              &lt;
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
                <div className={`pdf-page-viewport ${isMobile ? 'mobile-single-page' : 'desktop-double-page'}`}>
                  <Page
                    pageNumber={isMobile ? pageNumber : (desktopLeftPage || 1)}
                    height={isMobile ? Math.floor(window.innerHeight * 0.8) : Math.floor(window.innerHeight * 0.84)}
                    onLoadSuccess={onPageLoadSuccess}
                    onLoadError={onPageLoadError}
                    onRenderSuccess={onPageRenderSuccess}
                    onRenderError={onPageRenderError}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={<div className="loading">Seite wird gerendert...</div>}
                    canvasBackground="white"
                  />
                  {!isMobile && desktopRightPage && (
                    <Page
                      pageNumber={desktopRightPage}
                      height={Math.floor(window.innerHeight * 0.84)}
                      onLoadSuccess={onPageLoadSuccess}
                      onLoadError={onPageLoadError}
                      onRenderSuccess={onPageRenderSuccess}
                      onRenderError={onPageRenderError}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={<div className="loading">Seite wird gerendert...</div>}
                      canvasBackground="white"
                    />
                  )}
                </div>
              </div>
            )}
          </Document>

          {numPages > 0 && pageNumber < totalDisplayPages && (
            <button 
              onClick={goToNextPage}
              className="nav-button-overlay nav-right"
              aria-label="Nächste Seite"
            >
              &gt;
            </button>
          )}

          {numPages > 0 && (
            <div className="page-indicator">
              {currentDisplayPage} / {totalDisplayPages}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoMagazine;
