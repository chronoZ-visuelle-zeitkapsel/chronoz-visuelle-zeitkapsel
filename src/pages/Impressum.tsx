import React, { ReactElement } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Impressum.css';

function Impressum(): ReactElement {
  const teamMembers = [
    { 
      name: 'Adin MUTISEVIC', 
      role: 'Magazine Designer', 
      image: '/mutisevic.jpg',
      description: 'Verantwortlich für das Design und Layout des Fotomagazins. Gestaltung der visuellen Präsentation und Benutzeroberfläche.'
    },
    { 
      name: 'Stefan FRIEDL', 
      role: 'Projektleiter, Backend', 
      image: '/friedl.jpg',
      description: 'Projektleitung und Backend-Entwicklung. Implementierung der Datenbank, Server-Logik und API-Schnittstellen.'
    },
    { 
      name: 'Riz GARCIA', 
      role: '3D-Modell, Frontend', 
      image: '/garcia.jpg',
      description: 'Erstellung des 3D-Modells und Frontend-Entwicklung. Umsetzung der Animationen des 3D-Modells.'
    }
  ]; 

  return (
    <div className="ImpressumPage">
      <Header />
      <main className="ImpressumMain">
        <div className="ImpressumContainer">
          <h1 className="ImpressumTitle">5AHITM</h1> 
          
          <div className="TeamGrid">
            {teamMembers.map((member, index) => (
              <div key={index} className="TeamCard">
                <div className="TeamCardHeader">
                  <h2>{member.name}</h2>
                  <p className="TeamRole">{member.role}</p>
                </div>
                <div className="TeamCardImage">
                  {member.image ? (
                    <img src={member.image} alt={member.name} />
                  ) : (
                    <div className="ImagePlaceholder"></div>
                  )}
                </div>
                <div className="TeamDescription">
                  <p>{member.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="InfoBox">
            <div className="InfoColumns">
              <section className="InfoSection InfoLeft">
                <h3>Über das Projekt</h3>
                <div className="ProjectTextColumns">
                  <p>
                    chronoZ ist eine visuelle Zeitkapsel-Anwendung, die im Rahmen einer Diplomarbeit 
                    an der HTL Donaustadt entwickelt wurde. Das Projekt stellt via Fotomagazin die prägendsten Ereignisse dar. Außerdem bieten wir Nutzern, 
                    ihre Erinnerungen in Form von digitalen Postkarten zu speichern und auf einer 
                    interaktiven Timeline zu durchsuchen.
                  </p> 
                  <p>
                    Dieses Projekt wurde im Schuljahr 2025/2026 als Diplomarbeit im Rahmen der 
                    Abteilung ITEL erstellt. Alle Rechte vorbehalten.
                  </p>
                </div>
              </section>

              <section className="InfoSection InfoRight">
                <h3>HTL Donaustadt</h3>
                <p>
                  Höhere Technische Bundeslehranstalt<br />
                  Donaustadtstraße 45<br />
                  1220 Wien, Österreich<br />
                  <br />
                  Tel: +43 1 202 2840<br />
                  E-Mail: office@htl-donaustadt.at<br />
                  Web: <a href="https://www.htl-donaustadt.at" target="_blank" rel="noopener noreferrer">www.htl-donaustadt.at</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Impressum;
