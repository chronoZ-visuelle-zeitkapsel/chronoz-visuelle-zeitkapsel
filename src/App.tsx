import React, { ReactElement, useState, useEffect } from 'react';
import './App.css';
import './styles/newspaper.css';
import './styles/vintage-newspaper.css';
import Header from './components/Header';
import ThreeDStage from './components/ThreeDStage';
import CTA from './components/CTA';
import Archive from './components/Archive';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import History from './pages/User-Kapsel';
import CreatePostcard from './pages/CreatePostcard';
import Impressum from './pages/Impressum';
import VerifyEmail from './pages/VerifyEmail';
import Settings from './pages/Settings';
import ResetPassword from './pages/ResetPassword';

function Home({ blurred }: { blurred: boolean }): ReactElement {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    // Listen for login/logout events to update Archive visibility
    useEffect(() => {
        const handleUserLogin = () => {
            setIsLoggedIn(true);
        };

        const handleUserLogout = () => {
            setIsLoggedIn(false);
        };

        window.addEventListener('userLogin', handleUserLogin);
        window.addEventListener('userLogout', handleUserLogout);

        return () => {
            window.removeEventListener('userLogin', handleUserLogin);
            window.removeEventListener('userLogout', handleUserLogout);
        };
    }, []);

    return (
        <div className={blurred ? 'AppRoot Blur' : 'AppRoot'}>
            <Header />
            
            {/* Broadsheet Layout */}
            <div className="BroadsheetContainer">
                {/* Left Sidebar - Table of Contents */}
                <aside className="BroadsheetSidebar" style={{
                    paddingTop: '0'
                }}>
                    <div className="SidebarSection PageCurl">
                        <h3 className="SidebarTitle">Hinweis</h3>
                        <p className="ArticleText">
                            Anmeldung erforderlich zum Erstellen und Speichern von Postkarten. 
                            Ihre Inhalte bleiben privat.
                        </p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="BroadsheetMain">
                    <article>
                        <h2 className="VintageHeadline">
                            VISUELLE ZEITKAPSELN FÜR IHRE GESCHICHTEN
                        </h2>
                        
                        <p className="VintageSubhead">
                            Eine neue Ausgabe für Erinnerungen – klassisch gesetzt, digital bewahrt
                        </p>
                        
                        <div className="VintagePhoto">
                            <ThreeDStage />
                            <p className="PhotoCaption">
                                Die Zeitkapsel der Generation Z per Klick öffnen!
                            </p>
                        </div>
                        
                        <div className="ArticleText DropCap BroadsheetMainColumned">
                            <p>
                                Zeitkapseln bewahren Momente, die zu Geschichten werden. 
                                In einer Welt flüchtiger Nachrichtenströme bietet Chronoz eine ruhige Seite 
                                für Erinnerungen – gestaltet wie Zeitung, geschrieben für die Zukunft.
                            </p>
                            <p>
                                Von der ersten Aufnahme bis zum letzten Satz sammelt die Postkarte 
                                Bilder und Gedanken in einem Format, das bleibt. Jede Karte wird zu 
                                einem Zeitzeugnis, archiviert in Ihrem persönlichen Tresor.
                            </p>
                            <p>
                                Die Plattform verbindet die Nostalgie handgeschriebener Briefe mit 
                                der Beständigkeit digitaler Speicherung. Ihre Geschichten, Ihre Bilder, 
                                Ihre Zukunft – alles an einem Ort, geschützt vor dem Vergessen.
                            </p>
                        </div>
                        
                        <div className="OrnateBorder">
                            <CTA />
                        </div>
                    </article>
                </main>

                {/* Right Sidebar - Features */}
                <aside className="BroadsheetRightSidebar" style={{
                    paddingTop: '0'
                }}>
                    <div className="SidebarSection">
                        <h3 className="SidebarTitle">Ausgabe</h3>
                        <p className="ArticleText" style={{fontSize: '0.95rem'}}>
                            Nächste Edition erscheint automatisch, während Sie scrollen. 
                            Bleiben Sie dran für weitere Geschichten.
                        </p>
                    </div>
                    
                    {isLoggedIn && (
                        <div className="SidebarSection">
                            <h3 className="SidebarTitle">Ihr Archiv</h3>
                            <p className="ArticleText" style={{fontSize: '0.95rem'}}>
                                Zugriff auf Ihre persönliche Sammlung gespeicherter Zeitkapseln.
                            </p>
                        </div>
                    )}
                </aside>
            </div>
            
            {isLoggedIn && <Archive />}
            <FAQ />
            <Footer />
        </div>
    );
}

function Shell(): ReactElement {
    const location = useLocation();
    const navigate = useNavigate();
    const modalOpen = location.pathname === '/login';

    return (
        <>
            <Home blurred={modalOpen} />
            {modalOpen && (
                <div className="Overlay" onClick={() => navigate('/') }>
                    <div className="OverlayContent" onClick={(e) => e.stopPropagation()}>
                        <Login />
                    </div>
                </div>
            )}
        </>
    );
}

function App(): ReactElement {
    return (
        <div className="app newspaper-theme">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Shell />} />
                    <Route path="/login" element={<Shell />} />
                    <Route path="/verify" element={<VerifyEmail />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/create-postcard" element={<CreatePostcard />} />
                    <Route path="/impressum" element={<Impressum />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;