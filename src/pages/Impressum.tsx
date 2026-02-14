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
      bio: 'Stefan has typeset the karousel archive since 1926, stewarding every edition with precision and archival rigor.'
    },
    publisher: {
      name: 'Adin MUTISEVIC',
      role: 'Publisher',
      image: '/mutisevic.jpg',
      bio: 'Adin oversees the Vienna Dispatch press, ensuring each plate is struck with clarity and classic broadsheet discipline.'
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
      role: 'Press Engineer',
      image: '/friedl.jpg',
      bio: 'Maintains the archive press and print systems.'
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
            <span className="AboutMastheadStamp">VIENNA DISPATCH</span>
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

          <footer className="AboutFooter">
            <div className="AboutFooterLine">VIENNA DISPATCH • PRINTED FROM ORIGINAL PLATES</div>
            <div className="AboutTimeline">
              <span className="AboutDot">●</span>
              <span className="AboutDot">●</span>
              <span className="AboutDot">●</span>
              <button
                className="AboutArchiveLink"
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    const element = document.getElementById('archive');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
              >
                RETURN TO ARCHIVE
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
