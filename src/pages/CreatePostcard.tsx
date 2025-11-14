import React, { ReactElement, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { uploadImage } from '../utils/supabase';
import './createpostcard.css';

function CreatePostcard(): ReactElement {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostcard, setEditingPostcard] = useState<any>(null);

  // Lade zu bearbeitende Postkarte
  useEffect(() => {
    const editingData = localStorage.getItem('editingPostcard');
    if (editingData) {
      const postcard = JSON.parse(editingData);
      setEditingPostcard(postcard);
      setIsEditing(true);
      setTitle(postcard.title);
      setDate(postcard.date);
      setDescription(postcard.description);
      // Bilder werden als URLs gespeichert, nicht als File-Objekte
      // Lade die existierenden Bild-URLs
      setExistingImageUrls(postcard.images || []);
      setImages([]);
      // Lösche die temporären Daten
      localStorage.removeItem('editingPostcard');
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const selectedImages = Array.from(files);
      // Berechne wie viele Bilder noch hinzugefügt werden können
      setImages(prevImages => {
        const totalExisting = existingImageUrls.length + prevImages.length;
        const remainingSlots = Math.max(0, 4 - totalExisting);
        return [...prevImages, ...selectedImages.slice(0, remainingSlots)];
      });
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Aktuellen User aus localStorage holen
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Kein Token gefunden');
        alert('Bitte melden Sie sich an');
        return;
      }
      
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.id) {
        console.error('Keine User-ID gefunden');
        alert('Bitte melden Sie sich an');
        return;
      }

      // Neue Bilder zu Supabase hochladen
      const uploadedImageUrls: string[] = [];
      for (const image of images) {
        const url = await uploadImage(image, currentUser.id.toString());
        if (url) {
          uploadedImageUrls.push(url);
        }
      }
      
      // Kombiniere existierende und neue Bild-URLs
      const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];

      if (isEditing && editingPostcard) {
        // Bearbeitungsmodus: Postkarte aktualisieren
        const response = await fetch(`http://localhost:5000/api/postcards/${editingPostcard.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            description,
            date,
            images: allImageUrls
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Fehler beim Aktualisieren der Postkarte');
        }

        const updatedPostcard = await response.json();
        console.log('Postkarte aktualisiert:', updatedPostcard);
        
        // Custom Event für andere Komponenten
        window.dispatchEvent(new CustomEvent('postcardUpdated', { detail: updatedPostcard }));
      } else {
        // Neuerstellungsmodus: Neue Postkarte hinzufügen
        const response = await fetch('http://localhost:5000/api/postcards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            description,
            date,
            images: allImageUrls
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Fehler beim Erstellen der Postkarte');
        }

        const newPostcard = await response.json();
        console.log('Postkarte erstellt:', newPostcard);
        
        // Custom Event für andere Komponenten
        window.dispatchEvent(new CustomEvent('newPostcard', { detail: newPostcard }));
      }
      
      // Direkt zur User-Kapsel navigieren
      console.log('Navigiere zurück zur User-Kapsel');
      navigate('/history');
    } catch (error) {
      console.error('Error saving postcard:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDate('');
    setDescription('');
    setImages([]);
    setExistingImageUrls([]);
  };

  return (
    <div className="CreatePostcardPage">
      <Header />
      <main className="CreatePostcardMain">
        <div className="CreatePostcardContainer">
          {/* Left Column - Info */}
          <div className="ImageUploadSection">
            <div className="ImageUploadContainer">
              <div className="InfoText">
                <h3>{isEditing ? 'Bearbeite deine Postkarte' : 'Erstelle deine Postkarte'}</h3>
                <p>{isEditing ? 'Ändere die Felder rechts, um deine Erinnerung zu bearbeiten.' : 'Fülle die Felder rechts aus, um deine Erinnerung zu erstellen. Bilder sind optional.'}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="FormSection">
            <form onSubmit={handleSubmit} className="PostcardForm">
              <div className="FormField">
                <label htmlFor="title">Titel:</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="FormInput"
                  placeholder="Gib deiner Erinnerung einen Titel"
                />
              </div>

              <div className="FormField">
                <label htmlFor="date">📅 Date:</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="FormInput"
                />
              </div>

              <div className="FormField">
                <label htmlFor="description">write down your day...</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="FormTextarea"
                  placeholder="Beschreibe deinen Tag und deine Erinnerungen..."
                  rows={6}
                />
              </div>

              <div className="FormField">
                <label htmlFor="imageUpload">Bilder (optional, max. 4):</label>
                <input
                  type="file"
                  id="imageUpload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="FormInput"
                />
                <div className="ImageUploadHint">
                  <small>Automatische Template-Auswahl: 1 Bild = Vollbreite, 2 Bilder = Nebeneinander, 3 Bilder = 1+2 Layout, 4 Bilder = 2x2 Grid</small>
                  {existingImageUrls.length + images.length > 0 && (
                    <small> ({existingImageUrls.length + images.length} / 4 Bilder)</small>
                  )}
                </div>
                {(existingImageUrls.length > 0 || images.length > 0) && (
                  <div className="ImagePreview">
                    {/* Bestehende Bilder (URLs) */}
                    {existingImageUrls.map((url, index) => (
                      <div key={`existing-${index}`} className="PreviewItem">
                        <button 
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="RemoveImageButton"
                          title="Bild entfernen"
                        >
                          ✕
                        </button>
                        <img 
                          src={url} 
                          alt={`Existing ${index + 1}`}
                          className="PreviewImage"
                        />
                        <div className="PreviewLabel">
                          Bild {index + 1}
                        </div>
                      </div>
                    ))}
                    {/* Neue Bilder (File-Objekte) */}
                    {images.map((image, index) => (
                      <div key={`new-${index}`} className="PreviewItem">
                        <button 
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="RemoveImageButton"
                          title="Bild entfernen"
                        >
                          ✕
                        </button>
                        <img 
                          src={URL.createObjectURL(image)} 
                          alt={`New ${index + 1}`}
                          className="PreviewImage"
                        />
                        <div className="PreviewLabel">
                          Bild {existingImageUrls.length + index + 1}
                        </div>
                      </div>
                    ))}
                    {existingImageUrls.length + images.length >= 4 && (
                      <div className="ImageLimitWarning">
                        <small>✓ Maximale Anzahl erreicht (4 Bilder)</small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="FormActions">
                <button 
                  type="button" 
                  onClick={handleReset}
                  className="ResetButton"
                >
                  zurücksetzen
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="SubmitButton"
                >
                  {loading ? (isEditing ? 'Wird gespeichert...' : 'Wird erstellt...') : (isEditing ? 'Speichern' : 'hinzufügen')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CreatePostcard;
