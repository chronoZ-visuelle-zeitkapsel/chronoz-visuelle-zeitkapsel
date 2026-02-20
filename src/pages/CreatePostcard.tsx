import React, { ReactElement, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { uploadImage } from '../utils/supabase';
import { apiUrl } from '../config/api';
import './createpostcard.css';

function CreatePostcard(): ReactElement {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [descFontSize, setDescFontSize] = useState<number>(16);
  const [images, setImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostcard, setEditingPostcard] = useState<any>(null);
  const [error, setError] = useState<string>('');

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

  // helper to handle a FileList (used by input change and drop)
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const selectedImages = Array.from(fileList);
    setImages(prevImages => {
      const totalExisting = existingImageUrls.length + prevImages.length;
      const remainingSlots = Math.max(0, 4 - totalExisting);
      return [...prevImages, ...selectedImages.slice(0, remainingSlots)];
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
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
    setError('');

    // Client-side validation with friendly messages
    if (!title || !title.trim()) {
      setError('Bitte gib einen Titel ein.');
      return;
    }
    if (!date) {
      setError('Bitte wähle ein Datum.');
      return;
    }
    if (!description || !description.trim()) {
      setError('Bitte schreibe eine Beschreibung.');
      return;
    }

    setLoading(true);
    try {
      // Aktuellen User aus localStorage holen
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Kein Token gefunden');
        setError('Du bist nicht angemeldet. Bitte melde dich an.');
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.id) {
        console.error('Keine User-ID gefunden');
        setError('Keine Nutzerinformationen gefunden. Bitte melde dich erneut an.');
        return;
      }

      // Neue Bilder zu Supabase hochladen
      const uploadedImageUrls: string[] = [];
      for (const image of images) {
        const url = await uploadImage(image, currentUser.id.toString());
        if (url) {
          uploadedImageUrls.push(url);
        } else {
          console.warn('Ein Bild konnte nicht hochgeladen werden, wird übersprungen.');
        }
      }

      // Kombiniere existierende und neue Bild-URLs
      const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];

      if (isEditing && editingPostcard) {
        // Bearbeitungsmodus: Postkarte aktualisieren
        const response = await fetch(apiUrl(`/api/postcards/${editingPostcard.id}`), {
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
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Fehler beim Aktualisieren der Postkarte');
        }

        const updatedPostcard = await response.json();
        console.log('Postkarte aktualisiert:', updatedPostcard);

        // Speichere ID für Navigation zur richtigen Slide
        localStorage.setItem('lastViewedPostcardId', updatedPostcard.id);

        // Custom Event für andere Komponenten
        window.dispatchEvent(new CustomEvent('postcardUpdated', { detail: updatedPostcard }));
      } else {
        // Neuerstellungsmodus: Neue Postkarte hinzufügen
        const response = await fetch(apiUrl('/api/postcards'), {
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
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Fehler beim Erstellen der Postkarte');
        }

        const newPostcard = await response.json();
        console.log('Postkarte erstellt:', newPostcard);

        // Speichere ID für Navigation zur richtigen Slide
        localStorage.setItem('lastViewedPostcardId', newPostcard.id);

        // Custom Event für andere Komponenten
        window.dispatchEvent(new CustomEvent('newPostcard', { detail: newPostcard }));
      }

      // Direkt zur User-Kapsel navigieren
      console.log('Navigiere zurück zur User-Kapsel');
      navigate('/history');
    } catch (err) {
      console.error('Error saving postcard:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
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

  const displayDate = date
    ? new Date(date).toLocaleDateString('de-AT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('de-AT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

  const previewTitle = title ? title.toUpperCase() : 'ERINNERUNG';
  const previewText = description
    ? description
    : 'Dein Tagebucheintrag erscheint hier als kleine Sonderausgabe.';
  const previewImage = existingImageUrls[0]
    || (images[0] ? URL.createObjectURL(images[0]) : '');
  const thumbnailUrls = [
    ...existingImageUrls,
    ...images.map(image => URL.createObjectURL(image))
  ];

  return (
    <div className="CreatePostcardPage">
      <Header />
      <main className="CreatePostcardMain">
        <div className="CreatePostcardContainer">
          <header className="CreatePostcardMasthead">
            <div className="MastheadTitle">ERSTELLE DEINE ZEITKAPSEL</div>
            <div className="MastheadDate">{displayDate}</div>
          </header>
          <div className="FormSection">
            <form onSubmit={handleSubmit} className="PostcardForm">
              <div className="SubscriberDeskGrid">
                <div className="LeftColumn">
                  <button 
                    type="button" 
                    className="BackButton"
                    onClick={() => navigate('/history')}
                    title="Zurück zur User-Kapsel"
                  >
                    ←
                  </button>
                  <div
                    className="FileUploadBox"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => e.preventDefault()}
                  >
                    <input
                      type="file"
                      id="imageUpload"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFiles(e.target.files)}
                      className="FormInput HiddenFileInput"
                    />

                    <button type="button" className="PlusUploadButton" onClick={() => {
                      // trigger file input
                      const el = document.getElementById('imageUpload') as HTMLInputElement | null;
                      el?.click();
                    }}>
                      +
                    </button>

                    <div className="UploadHint">BILD HOCHLADEN</div>

                    <div className="ImagePreview">
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
                            alt={`Bestehend ${index + 1}`}
                            className="PreviewImage"
                          />
                        </div>
                      ))}
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
                            alt={`Neu ${index + 1}`}
                            className="PreviewImage"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="RightColumn">
                  <div className="TopFields">
                    <div className="TitleField">
                      <label htmlFor="title">Schlagzeile</label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="FormInput"
                        placeholder="Erinnerung"
                      />
                    </div>

                    <div className="DateField">
                      <label htmlFor="date">Datum</label>
                      <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="FormInput"
                      />
                    </div>
                  </div>

                  <div className="DescriptionField">
                    <label htmlFor="description">Tagebuchtext</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="FormTextarea"
                      placeholder="Schreib..."
                      rows={8}
                      style={{ fontSize: `${descFontSize}px` }}
                    />

                    <div className="FontSizeControls" aria-hidden={false}>
                      <button
                        type="button"
                        className="FontSizeButton"
                        onClick={() => setDescFontSize(s => Math.max(12, s - 2))}
                        title="Schriftgröße verkleinern"
                      >
                        A-
                      </button>
                      <div className="FontSizeLabel">{descFontSize}px</div>
                      <button
                        type="button"
                        className="FontSizeButton"
                        onClick={() => setDescFontSize(s => Math.min(28, s + 2))}
                        title="Schriftgröße vergrößern"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  <div className="ActionBar">
                    <button
                      type="submit"
                      disabled={loading}
                      className="ActionButton Primary"
                    >
                      {loading ? (isEditing ? 'Wird gespeichert...' : 'Wird erstellt...') : 'Speichern'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="ActionButton Secondary"
                    >
                      zurücksetzen
                    </button>
                  </div>
                </div>
              </div>

              {error && <div className="FormError" role="alert">{error}</div>}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CreatePostcard;
