import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Impressum.css';
import '../styles/vintage-newspaper.css';

function Impressum(): ReactElement {
  const navigate = useNavigate();

  return (
    <div className="ImpressumPage">
      <Header />
      <main className="ImpressumMain">
        <div className="ImpressumContainer">
          <header className="AboutMastheadHeader">
            <span className="AboutMastheadStamp">EST. 1926</span>
            <h1 className="AboutMastheadTitle">IMPRESSUM</h1>
            <span className="AboutMastheadStamp">CHRONOZ</span>
          </header>

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
