import React, { ReactElement, useState, useEffect } from 'react';
import './App.css';
import './styles/newspaper.css';
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
            <main className="HomeMain">
                <section className="StageSection">
                    <ThreeDStage />
                </section>
                <section className="CTASection">
                    <CTA />
                </section>
            </main>
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