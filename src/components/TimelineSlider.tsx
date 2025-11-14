import React, { ReactElement } from 'react';
import './TimelineSlider.css';

type Postcard = {
  id: string;
  title: string;
  description: string;
  date: string;
  images: string[];
  created_at?: string;
  updated_at?: string;
};

type TimelineSliderProps = {
  postcards: Postcard[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
};

function TimelineSlider({ postcards, currentIndex, onIndexChange }: TimelineSliderProps): ReactElement | null {
  if (postcards.length === 0) return null;

  const currentPostcard = postcards[currentIndex];
  
  // Berechne die Position für jeden Marker basierend auf dem Datum
  const getMarkerPosition = (index: number): number => {
    if (postcards.length === 1) return 50;
    return (index / (postcards.length - 1)) * 100;
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(event.target.value);
    onIndexChange(newIndex);
  };

  const handleMarkerClick = (index: number) => {
    onIndexChange(index);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const progressPercentage = postcards.length > 1 
    ? (currentIndex / (postcards.length - 1)) * 100 
    : 0;

  return (
    <div className="TimelineSlider">
      <div className="TimelineSliderHeader">
        <div className="TimelineSliderTitle">
          {currentPostcard.title}
        </div>
        <div className="TimelineSliderDate">
          {formatDate(currentPostcard.date)}
        </div>
      </div>
      
      <div className="TimelineSliderTrack">
        <div className="TimelineSliderLine" />
        <div 
          className="TimelineSliderProgress" 
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* Marker für jede Postkarte */}
        <div className="TimelineMarkers">
          {postcards.map((postcard, index) => (
            <div
              key={postcard.id}
              className={`TimelineMarker ${index === currentIndex ? 'active' : ''}`}
              style={{ left: `${getMarkerPosition(index)}%` }}
              onClick={() => handleMarkerClick(index)}
            >
              <div className="TimelineMarkerLabel">
                {formatDateShort(postcard.date)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Slider Input */}
        <input
          type="range"
          min="0"
          max={postcards.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="TimelineSliderInput"
        />
      </div>
    </div>
  );
}

export default TimelineSlider;
