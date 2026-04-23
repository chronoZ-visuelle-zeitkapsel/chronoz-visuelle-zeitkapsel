import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import './App.css';
import './styles/vintage-newspaper.css';
import Header from './components/Header';
import ThreeDStage from './components/ThreeDStage';
import Archive from './components/Archive';
import FAQ from './components/FAQ';
import AboutUs from './components/AboutUs';
import Footer from './components/Footer';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from './config/api';
import Login from './pages/Login';
import History from './pages/User-Kapsel';
import CreatePostcard from './pages/CreatePostcard';
import Impressum from './pages/Impressum';
import VerifyEmail from './pages/VerifyEmail';
import Settings from './pages/Settings';
import ResetPassword from './pages/ResetPassword';

function Home({ blurred }: { blurred: boolean }): ReactElement {
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const scrollToHash = useCallback(() => {
        if (location.pathname !== '/' || !location.hash) {
            return;
        }

        const sectionId = location.hash.replace('#', '');
        if (!sectionId) {
            return;
        }

        const attemptScroll = () => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return true;
            }
            return false;
        };

        const delays = [0, 160, 420, 760];
        delays.forEach((delay) => {
            setTimeout(() => {
                attemptScroll();
            }, delay);
        });
    }, [location.hash, location.pathname]);

    const syncAuthState = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoggedIn(false);
            return;
        }

        try {
            const response = await fetch(apiUrl('/api/auth/me'), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                setIsLoggedIn(false);
                return;
            }

            setIsLoggedIn(response.ok);
        } catch {
            setIsLoggedIn(false);
        }
    };

    useEffect(() => {
        void syncAuthState();
    }, []);

    useEffect(() => {
        void syncAuthState();
    }, [location.pathname]);

    useEffect(() => {
        scrollToHash();
    }, [scrollToHash, isLoggedIn]);

    // Listen for login/logout events to update Archive visibility
    useEffect(() => {
        const handleUserLogin = () => { void syncAuthState(); };
        const handleUserLogout = () => { void syncAuthState(); };
        const handleStorage = () => { void syncAuthState(); };

        window.addEventListener('userLogin', handleUserLogin);
        window.addEventListener('userLogout', handleUserLogout);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('userLogin', handleUserLogin);
            window.removeEventListener('userLogout', handleUserLogout);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    return (
        <div id="home-top" className={blurred ? 'AppRoot Blur' : 'AppRoot'}>
            <Header />
            {/* Broadsheet Layout */}
            <div className="BroadsheetContainer">
                {/* Left Sidebar - Table of Contents */}
                <aside className="BroadsheetSidebar" style={{
                    paddingTop: '0'
                }}>
                    <div className="sidebar-hinweis-stack">
                        <div className="hinweis-label">INFORMATION</div>
                        <div className="hinweis-card">
                            <h3 className="SidebarTitle">Anmeldung</h3>
                            <p className="ArticleText">
                                Anmeldung erforderlich zum Erstellen und Speichern von Postkarten. <br/>
                                Ihre Inhalte bleiben privat.<br/>
                                <span className="hinweis-cta-hint">Melde dich an, um deine Postkarten in deiner persönlichen Zeitkapsel zu speichern.</span>
                            </p>
                        </div> 
                    </div>

                    <div className="sidebar-hinweis-stack">
                        <div className="hinweis-label">TIPP</div>
                        <div className="hinweis-card">
                            <h3 className="SidebarTitle">NEUE FUNKTION</h3>
                            <p className="ArticleText">
                                Sie können Ihre Zeitkapsel jetzt als PDF herunterladen und archivieren.<br/>
                                <span className="hinweis-cta-hint">Nutzen Sie zusätzlich die Lock-Funktion, um Ihre Kapsel bis zu einem gewählten Datum zu versiegeln.</span>
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="BroadsheetMain">
                    <article>
                        <h2 className="VintageHeadline">
                            VISUELLE ZEITKAPSELN FÜR IHRE GESCHICHTEN
                        </h2>
                        
                        <div className="VintagePhoto">
                            <ThreeDStage />
                            <p className="PhotoCaption">
                                Die Zeitkapsel der Generation Z per Klick öffnen!
                            </p>
                        </div>
                        
                        
                        {/* OrnateBorder with CTA moved to sidebar */}
                    </article>
                </main>

                {/* Right Sidebar - Features */}
                <aside className="BroadsheetRightSidebar" style={{
                    paddingTop: '0'
                }}>

                    <div className="hinweis-card">
                            <h3 className="SidebarTitle">Was ist eine Zeitkapsel?</h3>
                            <p>
                                Eine Zeitkapsel bewahrt deine besonderen Momente, Geschichten und Erinnerungen digital auf – sicher und privat. Jede Postkarte, die du erstellst, wird darin gespeichert und bleibt für dich jederzeit zugänglich. So entsteht ein persönliches Archiv deiner Vergangenheit, das du immer wieder entdecken kannst.
                            </p>
                    </div>
                </aside>
            </div>
            
            {isLoggedIn && <Archive />}
            <AboutUs />
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