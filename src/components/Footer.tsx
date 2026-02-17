import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './footer.css';

function Footer(): React.ReactElement {
	const navigate = useNavigate();

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
						<button className="footer-link" onClick={() => navigate('/')}>Startseite</button>
						<button className="footer-link" onClick={() => scrollToSection('archive')}>Archiv</button>
						<button className="footer-link" onClick={() => scrollToSection('faq')}>FAQ</button>
						<Link to="/impressum" className="footer-link">About Us</Link>
					</div>
					<div className="footer-archive-press">
						<span className="spinning-rack-icon">⚙</span> Aus unserer Archivpresse
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