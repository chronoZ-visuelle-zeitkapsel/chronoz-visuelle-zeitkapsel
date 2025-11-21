import React, { ReactElement } from 'react';
import './App.css';
import Header from './components/Header';
import Timeline from './components/Timeline';
import ThreeDStage from './components/ThreeDStage';
import CTA from './components/CTA';
import Footer from './components/Footer';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import History from './pages/User-Kapsel';
import CreatePostcard from './pages/CreatePostcard';
import Impressum from './pages/Impressum';

function Home({ blurred }: { blurred: boolean }): ReactElement {
	return (
		<div className={blurred ? 'AppRoot Blur' : 'AppRoot'}>
			<Header />
			<main className="HomeMain">
				<section className="TimelineSection">
					<Timeline />
				</section>
				<section className="StageSection">
					<ThreeDStage />
				</section>
				<section className="CTASection">
					<CTA />
				</section>
			</main>
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
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Shell />} />
				<Route path="/login" element={<Shell />} />
				<Route path="/history" element={<History />} />
				<Route path="/create-postcard" element={<CreatePostcard />} />
				<Route path="/impressum" element={<Impressum />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App; 