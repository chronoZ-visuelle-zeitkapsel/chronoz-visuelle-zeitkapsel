import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './PhotoMagazine.css';

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

  const options = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.296/cmaps/',
    cMapPacked: true,
  }), []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError('');
  }

  function onDocumentLoadError(error: any) {
    console.error('PDF load error:', error);
    setError(`Fehler: ${error.message || 'PDF konnte nicht geladen werden'}`);
  }

  function onPageLoadError(error: any) {
    console.error('Page load error:', error);
  }

  function onPageRenderError(error: any) {
    console.error('Page render error:', error);
  }

  const goToPrevPage = React.useCallback(() => {
    setPageNumber(prevPage => {
      return Math.max(prevPage - 1, 1);
    });
  }, []);

  const goToNextPage = React.useCallback(() => {
    setPageNumber(prevPage => {
      return Math.min(prevPage + 1, totalDisplayPages);
    });
  }, [totalDisplayPages]);

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
                    onLoadError={onPageLoadError}
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
                      onLoadError={onPageLoadError}
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
