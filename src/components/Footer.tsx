import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './footer.css';

function Footer(): React.ReactElement {
	const navigate = useNavigate();
	const location = useLocation();
	const pendingHomeScrollRef = useRef(false);

	const scrollToTop = () => {
		const topElement = document.getElementById('home-top');
		if (topElement) {
			topElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}

		// Fallbacks for browsers/layouts with different scrolling roots.
		window.scrollTo({ top: 0, behavior: 'smooth' });
		document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
		document.body.scrollTo({ top: 0, behavior: 'smooth' });

		setTimeout(() => {
			window.scrollTo({ top: 0, behavior: 'auto' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}, 180);
	};

	useEffect(() => {
		if (location.pathname === '/' && pendingHomeScrollRef.current) {
			pendingHomeScrollRef.current = false;
			requestAnimationFrame(() => {
				scrollToTop();
				setTimeout(scrollToTop, 120);
			});
		}
	}, [location.pathname]);

	const scrollToSection = (sectionId: string) => {
		if (window.location.pathname !== '/') {
			navigate('/');
			setTimeout(() => {
				const element = document.getElementById(sectionId);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 100);
		} else {
			const element = document.getElementById(sectionId);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	};

	const goToHome = () => {
		if (window.location.pathname !== '/') {
			pendingHomeScrollRef.current = true;
			navigate('/');
		} else {
			scrollToTop();
		}
	};

	const goToImpressum = () => {
		navigate('/impressum');
		// Nach Navigation nach oben scrollen
		setTimeout(() => {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}, 100);
	};

	return (
		<footer className="Footer vintage-newspaper-footer">
			<div className="footer-ruled-line"></div>
			<div className="footer-broadsheet">
				{/* Left: Copyright & Publisher */}
				<div className="footer-left">
					<div className="footer-copyright">© ChronoZ, seit 2026</div>
					<div className="footer-publisher">Herausgegeben von HTL Donaustadt</div>
					<div className="footer-tagline">Gedruckt auf recycelten Pixeln</div>
				</div>

				{/* Center: Quick Links */}
				<nav className="footer-center">
					<div className="footer-nav-label">Schnelllinks</div>
					<div className="footer-links">
						<button type="button" className="footer-link" onClick={goToHome}>Startseite</button>
						<button className="footer-link" onClick={() => navigate('/history')}>Chronik</button>
						<button className="footer-link" onClick={() => scrollToSection('faq')}>FAQ</button>
						<button className="footer-link" onClick={goToImpressum}>Impressum</button>
					</div>
				</nav>

				{/* Right: Social Icons & Date */}
				<div className="footer-right">
					<div className="footer-social-icons">
						<a href="https://www.htl-donaustadt.at/home" target="_blank" rel="noopener noreferrer" className="brass-badge htl-badge" title="HTL Donaustadt">
							<img src="/htlLogo.png" alt="HTL" className="footer-htl-logo" />
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}

export default Footer; 