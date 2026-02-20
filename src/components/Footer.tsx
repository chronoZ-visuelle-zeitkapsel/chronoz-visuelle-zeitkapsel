import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './footer.css';

function Footer(): React.ReactElement {
	const navigate = useNavigate();
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	// Check if user is logged in
	useEffect(() => {
		const token = localStorage.getItem('token');
		setIsLoggedIn(!!token);

		// Listen for login/logout events
		const handleUserLogin = () => setIsLoggedIn(true);
		const handleUserLogout = () => setIsLoggedIn(false);

		window.addEventListener('userLogin', handleUserLogin);
		window.addEventListener('userLogout', handleUserLogout);

		return () => {
			window.removeEventListener('userLogin', handleUserLogin);
			window.removeEventListener('userLogout', handleUserLogout);
		};
	}, []);

	// Get current date for edition stamp
	const getCurrentDate = () => {
		const date = new Date();
		const formatted = date.toLocaleDateString('de-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
		return `Ausg. ${formatted}`;
	};

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
			navigate('/');
			// Nach Navigation nach oben scrollen
			setTimeout(() => {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}, 100);
		} else {
			// Direkt nach oben scrollen
			window.scrollTo({ top: 0, behavior: 'smooth' });
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
						<button className="footer-link" onClick={goToHome}>Startseite</button>
						<button className="footer-link" onClick={() => {
							if (!isLoggedIn) {
								navigate('/login');
							} else {
								scrollToSection('archive');
							}
						}}>Archiv</button>
						<button className="footer-link" onClick={() => scrollToSection('faq')}>FAQ</button>
						<button className="footer-link" onClick={goToImpressum}>Impressum</button>
					</div>
				</nav>

				{/* Right: Social Icons & Date */}
				<div className="footer-right">
					<div className="footer-social-label">Kontakt</div>
					<div className="footer-social-icons">
						<a href="https://www.htl-donaustadt.at/home" target="_blank" rel="noopener noreferrer" className="brass-badge" title="HTL Donaustadt">
							<img src="/htlLogo.png" alt="HTL" className="footer-htl-logo" />
						</a>
					</div>
					<div className="footer-edition-stamp">{getCurrentDate()}</div>
				</div>
			</div>
		</footer>
	);
}

export default Footer; 