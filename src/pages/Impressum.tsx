import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Impressum.css';
import '../styles/vintage-newspaper.css';

function Impressum(): ReactElement {
  const navigate = useNavigate();

  const mastheadTeam = {
    editor: {
      name: 'Stefan FRIEDL',
      role: 'Editor-in-Chief',
      image: '/friedl.jpg',
      bio: 'Stefan has typeset the Chronoz archive since 1926, stewarding every edition with precision and archival rigor.'
    },
    publisher: {
      name: 'Adin MUTISEVIC',
      role: 'Publisher',
      image: '/mutisevic.jpg',
      bio: 'Adin oversees the platform operations, ensuring every memory is preserved with clarity and timeless presentation.'
    },
    curator: {
      name: 'Riz GARCIA',
      role: 'Archive Curator',
      image: '/garcia.jpg',
      bio: 'Riz preserves every memory in the archive vault, balancing motion, depth, and timeless presentation.'
    }
  };

  const staffTeam = [
    {
      name: 'Adin MUTISEVIC',
      role: 'Layout Artist',
      image: '/mutisevic.jpg',
      bio: 'Composes the visual cadence of every spread.'
    },
    {
      name: 'Stefan FRIEDL',
      role: 'Platform Engineer',
      image: '/friedl.jpg',
      bio: 'Maintains the digital infrastructure and storage systems.'
    },
    {
      name: 'Riz GARCIA',
      role: 'Archivist',
      image: '/garcia.jpg',
      bio: 'Safeguards the visual capsule library.'
    }
  ];

  return (
    <div className="ImpressumPage">
      <Header />
      <main className="ImpressumMain">
        <div className="ImpressumContainer">
          <header className="AboutMastheadHeader">
            <span className="AboutMastheadStamp">EST. 1926</span>
            <h1 className="AboutMastheadTitle">OUR MASTHEAD</h1>
            <span className="AboutMastheadStamp">CHRONOZ</span>
          </header>

          <section className="AboutColumns">
            <article className="AboutColumn">
              <div className="MastheadName">{mastheadTeam.publisher.name}</div>
              <div className="MastheadRole">{mastheadTeam.publisher.role}</div>
              <div className="MastheadPortrait PortraitMedium halftone-photo">
                {mastheadTeam.publisher.image ? (
                  <img src={mastheadTeam.publisher.image} alt={mastheadTeam.publisher.name} />
                ) : (
                  <div className="PortraitPlaceholder"></div>
                )}
              </div>
              <p className="MastheadBio ArticleText DropCap">
                {mastheadTeam.publisher.bio}
              </p>
            </article>

            <article className="AboutColumn AboutColumnCenter">
              <div className="MastheadName">{mastheadTeam.editor.name}</div>
              <div className="MastheadRole">{mastheadTeam.editor.role}</div>
              <div className="MastheadPortrait PortraitLarge halftone-photo">
                {mastheadTeam.editor.image ? (
                  <img src={mastheadTeam.editor.image} alt={mastheadTeam.editor.name} />
                ) : (
                  <div className="PortraitPlaceholder"></div>
                )}
              </div>
              <p className="MastheadBio ArticleText DropCap">
                {mastheadTeam.editor.bio}
              </p>
            </article>

            <article className="AboutColumn">
              <div className="MastheadName">{mastheadTeam.curator.name}</div>
              <div className="MastheadRole">{mastheadTeam.curator.role}</div>
              <div className="MastheadPortrait PortraitMedium halftone-photo">
                {mastheadTeam.curator.image ? (
                  <img src={mastheadTeam.curator.image} alt={mastheadTeam.curator.name} />
                ) : (
                  <div className="PortraitPlaceholder"></div>
                )}
              </div>
              <p className="MastheadBio ArticleText DropCap">
                {mastheadTeam.curator.bio}
              </p>
            </article>
          </section>

          <section className="StaffSection">
            <h2 className="StaffTitle">THE TECHNICAL DESK</h2>
            <div className="StaffGrid">
              {staffTeam.map((member, index) => (
                <div key={index} className="StaffCard">
                  <div className="StaffName">{member.name}</div>
                  <div className="StaffRole">{member.role}</div>
                  <div className="StaffPortrait halftone-photo">
                    {member.image ? (
                      <img src={member.image} alt={member.name} />
                    ) : (
                      <div className="PortraitPlaceholder"></div>
                    )}
                  </div>
                  <p className="StaffBio ArticleText">{member.bio}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="AGBSection">
            <h2 className="AGBTitle">ALLGEMEINE GESCHÄFTSBEDINGUNGEN</h2>
            <div className="AGBSubtitle">Gültig ab • 1. Jänner 2026</div>
            
            <div className="AGBColumns">
              <article className="AGBColumn">
                <h3 className="AGBSectionTitle">§1. Impressum & Offenlegung</h3>
                <p className="AGBText">
                  <strong>Diensteanbieter gemäß §5 E-Commerce-Gesetz:</strong><br />
                  chronoZ - Virtuelle Zeitkapsel<br />
                  Wien, Österreich<br />
                  E-Mail: 200006@studierende.htl-donaustadt.at<br />
                  <br />
                  <strong>Unternehmensgegenstand:</strong> Bereitstellung einer digitalen Plattform 
                  zur Speicherung und Verwaltung persönlicher Erinnerungen, Fotografien und Dokumente 
                  in Form virtueller Zeitkapseln.
                </p>

                <h3 className="AGBSectionTitle">§2. Geltungsbereich</h3>
                <p className="AGBText">
                  Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung von chronoZ - Virtuelle 
                  Zeitkapsel. Mit der Nutzung unserer Dienste erklären Sie sich mit diesen Bedingungen 
                  einverstanden. Der Service wird derzeit kostenfrei zur Verfügung gestellt.
                </p>

                <h3 className="AGBSectionTitle">§3. Leistungsbeschreibung</h3>
                <p className="AGBText">
                  chronoZ - Virtuelle Zeitkapsel bietet eine digitale Plattform zur Speicherung und 
                  Verwaltung persönlicher Erinnerungen. Der Service umfasst Cloud-Speicher, 
                  Magazin-Darstellung und zeitgesteuerte Zugriffsverwaltung. Die Nutzung erfolgt 
                  aktuell kostenfrei und ohne Abonnement.
                </p>

                <h3 className="AGBSectionTitle">§4. Registrierung & Nutzung</h3>
                <p className="AGBText">
                  Die Nutzung von chronoZ erfordert eine kostenfreie Registrierung. Der Vertrag kommt 
                  durch Ihre Registrierung und unsere Bestätigung per E-Mail zustande. Sie erhalten 
                  eine Bestätigung per E-Mail mit Ihren Zugangsdaten. Die Registrierung ist für 
                  Privatpersonen kostenfrei.
                </p>
              </article>

              <article className="AGBColumn">
                <h3 className="AGBSectionTitle">§5. Nutzerpflichten & Urheberrecht</h3>
                <p className="AGBText">
                  Sie sind für alle hochgeladenen Inhalte verantwortlich und garantieren, dass diese 
                  keine Rechte Dritter verletzen. Sie behalten alle Urheberrechte an Ihren Inhalten. 
                  Sie räumen chronoZ ein nicht-exklusives Nutzungsrecht ein, soweit dies zur 
                  Erbringung der Dienstleistung erforderlich ist. Verboten sind insbesondere 
                  beleidigende, rechtswidrige oder jugendgefährdende Inhalte.
                </p>

                <h3 className="AGBSectionTitle">§6. Datenschutz (DSGVO)</h3>
                <p className="AGBText">
                  Ihre personenbezogenen Daten werden gemäß DSGVO und österreichischem Datenschutzgesetz 
                  verarbeitet. Die Datenverarbeitung erfolgt auf Basis Ihrer Einwilligung bzw. zur 
                  Vertragserfüllung. Ihre Erinnerungen werden verschlüsselt gespeichert und nicht an 
                  Dritte weitergegeben. Sie haben jederzeit das Recht auf Auskunft, Berichtigung und 
                  Löschung Ihrer Daten. Diese Rechte können Sie per E-Mail an 
                  200006@studierende.htl-donaustadt.at geltend machen.
                </p>

                <h3 className="AGBSectionTitle">§7. Haftung & Gewährleistung</h3>
                <p className="AGBText">
                  Wir haften nach den gesetzlichen Bestimmungen für Vorsatz und grobe Fahrlässigkeit. 
                  Bei leichter Fahrlässigkeit haften wir nur für Schäden aus der Verletzung 
                  wesentlicher Vertragspflichten. Die Haftung ist auf den vorhersehbaren, 
                  vertragstypischen Schaden begrenzt. Konsumentenschutzrechtliche Haftungsansprüche 
                  bleiben unberührt. Wir empfehlen, wichtige Daten zusätzlich zu sichern.
                </p>
              </article>

              <article className="AGBColumn">
                <h3 className="AGBSectionTitle">§8. Kündigung & Datenlöschung</h3>
                <p className="AGBText">
                  Sie können die Nutzung von chronoZ jederzeit beenden. Ihre Daten und Ihr Konto bleiben 
                  gespeichert, bis Sie eine Löschung beantragen. Die Löschung Ihres Kontos und aller 
                  damit verbundenen Daten erfolgt auf schriftliche Anfrage per E-Mail an 
                  200006@studierende.htl-donaustadt.at. Wir werden Ihre Daten innerhalb von 30 Tagen 
                  nach Eingang der Anfrage vollständig löschen. Wir empfehlen, vor der Löschung einen 
                  Export Ihrer Daten durchzuführen. Bei erheblichen Vertragsverletzungen behalten wir 
                  uns das Recht vor, Ihr Konto zu sperren oder zu löschen.
                </p>

                <h3 className="AGBSectionTitle">§9. Änderungen der AGB</h3>
                <p className="AGBText">
                  Änderungen dieser AGB werden Ihnen per E-Mail mitgeteilt und gelten als genehmigt, 
                  wenn Sie nicht binnen vier Wochen widersprechen. Im Falle des Widerspruchs können 
                  beide Parteien das Vertragsverhältnis kündigen. Bei wesentlichen Änderungen ist 
                  Ihre ausdrückliche Zustimmung erforderlich.
                </p>

                <h3 className="AGBSectionTitle">§10. Anwendbares Recht & Gerichtsstand</h3>
                <p className="AGBText">
                  Es gilt ausschließlich österreichisches Recht unter Ausschluss des UN-Kaufrechts. 
                  Gerichtsstand für Streitigkeiten mit Unternehmern ist Wien. Für Verbraucher gelten 
                  die gesetzlichen Bestimmungen über den Gerichtsstand. EU-Verbraucher können die 
                  Online-Streitbeilegungs-Plattform der EU-Kommission nutzen: 
                  ec.europa.eu/consumers/odr
                </p>

                <h3 className="AGBSectionTitle">§11. Schlussbestimmungen</h3>
                <p className="AGBText">
                  Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der 
                  übrigen Bestimmungen unberührt. Die unwirksame Bestimmung wird durch eine wirksame 
                  ersetzt, die dem wirtschaftlichen Zweck am nächsten kommt. Mündliche Nebenabreden 
                  bestehen nicht.
                </p>

                <div className="AGBSignature">
                  <div className="AGBSigLine"></div>
                  <div className="AGBSigText">chronoZ Rechtsabteilung</div>
                  <div className="AGBSigDate">Gegr. 1926 • Wien, Österreich</div>
                </div>
              </article>
            </div>
          </section>

          <footer className="AboutFooter">
            <div className="AboutFooterLine">CHRONOZ • VIRTUELLE ZEITKAPSEL</div>
            <div className="AboutTimeline">
              <span className="AboutDot">●</span>
              <span className="AboutDot">●</span>
              <span className="AboutDot">●</span>
              <button
                className="AboutArchiveLink"
                onClick={() => navigate('/')}
              >
                RETURN TO HOME
              </button>
              <span className="AboutDot">●</span>
              <span className="AboutDot">●</span>
              <span className="AboutDot">●</span>
            </div>
          </footer>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Impressum;
