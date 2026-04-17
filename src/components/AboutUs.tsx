import React, { ReactElement } from 'react';
import './AboutUs.css';

function AboutUs(): ReactElement {
  const team = [
    {
      name: 'Stefan FRIEDL',
      role: 'Platform Engineer & Backend Development',
      image: '/friedl.jpg',
      description: 'Verantwortlich für die technische Umsetzung des Backends sowie die Anbindung der Datenbank- und API-Struktur. Der Fokus lag auf der Entwicklung stabiler Server-Endpunkte für Registrierung, Login, E-Mail-Verifizierung und die Verwaltung von Postkarteninhalten. Dabei wurden Authentifizierungslogiken, Token-Verarbeitung und die sichere Kommunikation zwischen Frontend und Datenbank implementiert, damit Nutzerdaten zuverlässig verarbeitet und geschützt gespeichert werden können.\n\nZusätzlich erfolgte die Konzeption der Backend-Architektur inklusive Fehlerbehandlung, Umgebungs-Konfiguration und Deployment-Vorbereitung. Ziel war es, eine robuste Grundlage zu schaffen, auf der alle Kernfunktionen der Plattform konsistent funktionieren und sowohl im lokalen Entwicklungsbetrieb als auch im produktiven Einsatz verlässlich laufen.',
      screenshots: []
    },
    {
      name: 'Adin MUTISEVIC',
      role: 'Logo  & Photo Magazine Design',
      image: '/mutisevic.jpg',
      description: 'Verantwortlich für das digitale Fotomagazin. Dabei wurde der Fokus auf die visuelle Umsetzung gelegt, insbesondere auf Bildbearbeitung, Layout und Typografie. Für die Umsetzung wurden Programme wie Adobe Photoshop, Adobe InDesign und Adobe Illustrator verwendet, um Inhalte gezielt zu gestalten und ein einheitliches Designkonzept zu entwickeln.\n\nDas Magazin ist in mehrere Themenbereiche gegliedert, wobei jedes Thema aus vier Seiten besteht: einer Coverseite, einer Informationsseite, einer Bildstreckenseite sowie einer Abschlussseite. Jedes Thema wurde individuell gestaltet, während durch gezielte Farbkonzepte, Typografie und Bildbearbeitung ein einheitlicher Stil beibehalten wird, um zentrale Themen der Generation visuell darzustellen und emotional zu vermitteln.',
      screenshots: [
        { src: '/indesignaboutus.png', caption: 'Fotomagazin Entwicklung' },
        { src: '/logoaboutus.png', caption: 'Logo Entwicklung' }
      ]
    },
    {
      name: 'Riz GARCIA',
      role: 'Frontend Development & 3D-Modellierung',
      image: '/garcia.jpg',
      description: 'Verantwortlich für die Umsetzung des Frontends sowie die Konzeption und Modellierung der 3D-Elemente. Im Bereich Frontend lag der Fokus auf der Entwicklung einer klar strukturierten und benutzerfreundlichen Oberfläche, die sich am Editorial- und Archivdesign orientiert. Dabei wurde besonderer Wert auf eine übersichtliche Darstellung der Inhalte und eine intuitive Navigation gelegt.\n\nZusätzlich erfolgte die Gestaltung und Umsetzung der 3D-Modelle, die das visuelle Konzept der Website unterstützen und den inhaltlichen Aufbau ergänzen. Ziel war es, ein einheitliches und ansprechendes Erscheinungsbild zu schaffen, das Design und Funktion miteinander verbindet.',
      screenshots: [
        { src: '/dev-screenshots/frontend-overlay.jpg', caption: 'Website Overlay Design' }
      ]
    }
  ];

  return (
    <section id="aboutus" className="AboutUsSection">
      <div className="AboutUsContainer">
        <header className="AboutUsHeader">
          <div className="AboutUsOrnament">❖</div>
          <h2 className="AboutUsTitle">Die Köpfe hinter chronoZ</h2>
          <div className="AboutUsOrnament">❖</div>
        </header>

        <div className="TeamMembers">
          {team.map((member, index) => (
            <article key={index} className="TeamMember">
              <div className="MemberLayout">
                <div className="MemberImageColumn">
                  <div className="MemberPortrait halftone-photo">
                    {member.image ? (
                      <img src={member.image} alt={member.name} />
                    ) : (
                      <div className="PortraitPlaceholder"></div>
                    )}
                  </div>
                  <div className="MemberName">{member.name}</div>
                  <div className="MemberRole">{member.role}</div>
                </div>

                <div className="MemberContentColumn">
                  <p className="MemberDescription ArticleText DropCap">
                    {member.description}
                  </p>

                  {member.screenshots && member.screenshots.length > 0 && (
                    <div className="DevelopmentScreenshots">
                      <div className="ScreenshotsLabel">ENTWICKLUNGSPROZESS</div>
                      <div className="ScreenshotsGrid">
                        {member.screenshots.map((screenshot, idx) => (
                          <figure key={idx} className="ScreenshotItem">
                            <div className="ScreenshotFrame halftone-photo">
                              <img src={screenshot.src} alt={screenshot.caption} />
                            </div>
                            <figcaption className="ScreenshotCaption">
                              {screenshot.caption}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {index < team.length - 1 && <div className="MemberDivider">◆ ◆ ◆</div>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutUs;
