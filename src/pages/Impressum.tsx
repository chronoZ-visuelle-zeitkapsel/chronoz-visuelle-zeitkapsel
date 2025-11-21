import React, { ReactElement } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Impressum.css';

function Impressum(): ReactElement {
  const teamMembers = [
    { name: 'Adin MUTISEVIC', image: null },
    { name: 'Stefan FRIEDL', image: null },
    { name: 'Riz GARCIA', image: null }
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
                </div>
                <div className="TeamCardImage">
                  {member.image ? (
                    <img src={member.image} alt={member.name} />
                  ) : (
                    <div className="ImagePlaceholder"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="InfoBox">
            <section className="InfoSection">
              <h3>Über das Projekt</h3>
              <p>
                chronoZ ist eine visuelle Zeitkapsel-Anwendung, die im Rahmen einer Diplomarbeit 
                an der HTL Donaustadt entwickelt wurde. Das Projekt ermöglicht es Nutzern, 
                ihre Erinnerungen in Form von digitalen Postkarten zu speichern und auf einer 
                interaktiven Timeline zu durchsuchen.
              </p>
            </section>

            <section className="InfoSection">
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

            <section className="InfoSection">
              <h3>Diplomarbeit 2024/2025</h3>
              <p>
                Dieses Projekt wurde im Schuljahr 2024/2025 als Diplomarbeit im Rahmen der 
                Abteilung Informatik erstellt. Alle Rechte vorbehalten.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Impressum;
