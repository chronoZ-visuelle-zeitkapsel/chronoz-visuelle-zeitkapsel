import React, { ReactElement } from 'react';
import './AboutUs.css';

function AboutUs(): ReactElement {
  const team = [
    {
      name: 'Stefan FRIEDL',
      role: 'Platform Engineer & Backend Development',
      image: '/friedl.jpg',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Entwickelte die Backend-Infrastruktur und Datenbankarchitektur für die sichere Speicherung persönlicher Erinnerungen.',
      screenshots: []
    },
    {
      name: 'Adin MUTISEVIC',
      role: 'Logo  & Photo Magazine Design',
      image: '/mutisevic.jpg',
      description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Gestaltete das innovative Magazin-Design und die visuelle Präsentation der Postkarten-Archivierung.',
      screenshots: [
        { src: '/dev-screenshots/magazine-layout-1.jpg', caption: 'Fotomagazin Entwicklung' },
        { src: '/dev-screenshots/magazine-layout-2.jpg', caption: 'Layout-Design Prozess' }
      ]
    },
    {
      name: 'Riz GARCIA',
      role: 'Frontend Development & 3D-Modellierung',
      image: '/garcia.jpg',
      description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Implementierte das responsive Frontend und die interaktive Benutzeroberfläche mit moderner React-Architektur.',
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
          <h2 className="AboutUsTitle">UNSER TEAM & ENTWICKLUNG</h2>
          <div className="AboutUsSubtitle">Die Köpfe hinter chronoZ</div>
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
