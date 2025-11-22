import React, { ReactElement, useMemo, useRef } from 'react';

function generateYears(start: number, end: number): string[] {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => String(start + i));
}

function Timeline(): ReactElement {
  const years = useMemo(() => generateYears(1995, 2025), []);
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scrollByAmount(direction: 'left' | 'right') {
    const el = trackRef.current;
    if (!el) return;

    const amount =
      Math.max(200, el.clientWidth * 0.6) *
      (direction === 'left' ? -1 : 1);

    // scrollt wie vorher den Container, in dem die Track liegt
    el.parentElement?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  return (
    <section className="TimelineSection">
      <div className="TimelineContainer">
        {/* Zeitungstitel über der Leiste */}
        <header className="TimelineHeaderRow">
          <h2 className="SectionTitle">Chronik der Ereignisse</h2>
          <span className="TimelineRange">1995 – ???</span>
        </header>

        <div className="Timeline">
          <button
            className="TimelineNav Left"
            aria-label="Zurück"
            onClick={() => scrollByAmount('left')}
          >
            ‹
          </button>

          <div className="TimelineTrack" ref={trackRef}>
            {years.map((year) => (
              <div key={year} className="TimelineItem">
                {year}
              </div>
            ))}
          </div>

          <button
            className="TimelineNav Right"
            aria-label="Weiter"
            onClick={() => scrollByAmount('right')}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}

export default Timeline;
