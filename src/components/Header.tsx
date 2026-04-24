import './header.css';
import React, { ReactElement, useCallback, useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';

type CurrentUser = { id: string; username: string; email: string } | null;

function Header(): ReactElement {
	const navigate = useNavigate();
	const location = useLocation();
	const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const userAreaRef = useRef<HTMLDivElement | null>(null);
	const pendingHomeScrollRef = useRef(false);

	const scrollToTop = () => {
		const topElement = document.getElementById('home-top');
		if (topElement) {
			topElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}

		window.scrollTo({ top: 0, behavior: 'smooth' });
		document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
		document.body.scrollTo({ top: 0, behavior: 'smooth' });

		setTimeout(() => {
			window.scrollTo({ top: 0, behavior: 'auto' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}, 180);
	};

	const scrollToSectionElement = useCallback((sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (!element) return false;
		element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		return true;
	}, []);

	const scheduleSectionScroll = useCallback((sectionId: string) => {
		const attemptDelays = [0, 160, 420, 760];
		attemptDelays.forEach((delay) => {
			setTimeout(() => {
				scrollToSectionElement(sectionId);
			}, delay);
		});
	}, [scrollToSectionElement]);

	useEffect(() => {
		if (currentUser) {
			setMenuOpen(false);
			if (
				userAreaRef.current &&
				document.activeElement instanceof Node &&
				userAreaRef.current.contains(document.activeElement as Node)
			) {
				(document.activeElement as HTMLElement).blur();
			}
		}
	}, [currentUser]);

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			setCurrentUser(null);
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(apiUrl('/api/auth/me'), {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (!res.ok) {
					if (!cancelled) setCurrentUser(null);
					return;
				}
				const data = await res.json();
				if (!cancelled) setCurrentUser({ id: data.id, username: data.username, email: data.email });
			} catch {
				if (!cancelled) setCurrentUser(null);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (location.pathname === '/' && pendingHomeScrollRef.current) {
			pendingHomeScrollRef.current = false;
			requestAnimationFrame(() => {
				scrollToTop();
				setTimeout(scrollToTop, 120);
			});
		}

		setMobileNavOpen(false);
	}, [location.pathname]);

	useEffect(() => {
		const handleUserLogin = (event: CustomEvent) => {
			const user = event.detail;
			if (user) {
				setCurrentUser({ id: user.id, username: user.username, email: user.email });				
			}
		};

		const handleUserLogout = () => {
			setCurrentUser(null);
		};

		window.addEventListener('userLogin', handleUserLogin as EventListener);
		window.addEventListener('userLogout', handleUserLogout);
		
		return () => {
			window.removeEventListener('userLogin', handleUserLogin as EventListener);
			window.removeEventListener('userLogout', handleUserLogout);
		};
	}, []);

	function handleLogout() {
		localStorage.removeItem('token');
		localStorage.removeItem('currentUser');
		setCurrentUser(null);
		window.dispatchEvent(new CustomEvent('userLogout'));
		navigate('/');
	}

	function scrollToSection(sectionId: string) {
		if (location.pathname !== '/') {
			navigate({ pathname: '/', hash: `#${sectionId}` });
		} else {
			scheduleSectionScroll(sectionId);
		}
	}

	function goToHome() {
		if (window.location.pathname !== '/') {
			pendingHomeScrollRef.current = true;
			navigate('/');
		} else {
			scrollToTop();
		}
	}

	const getCurrentDate = () =>
		new Date().toLocaleDateString('de-DE', {
			weekday: 'long',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});

	return (
		<header className="Header vintage-newspaper-header">
			<div className="newspaper-masthead">
				<div className="masthead-left">
					<div className="masthead-date">{getCurrentDate()}</div>
				</div>

				<div className="masthead-center">
					<div className="newspaper-rivet top-left"></div>
					<div className="newspaper-rivet top-right"></div>
					<img
						src="/chronoZLogo.png"
						alt="ChronoZ-Logo"
						className="newspaper-logo"
						onClick={() => navigate('/')}
						loading="lazy"
						role="button"
					/>
					<div className="newspaper-tagline">Erinnerungen bewahrt seit 2026</div>
					<div className="newspaper-rivet bottom-left"></div>
					<div className="newspaper-rivet bottom-right"></div>
				</div>

				<div className={`masthead-right ${mobileNavOpen ? 'mobile-open' : ''}`}>
					<button
						type="button"
						className="mobile-menu-toggle"
						onClick={() => setMobileNavOpen((open) => !open)}
						aria-expanded={mobileNavOpen}
						aria-label="Navigation umschalten"
					>
						<span></span>
						<span></span>
						<span></span>
					</button>

					<div className={`masthead-menu-panel ${mobileNavOpen ? 'open' : ''}`}>
						<nav className="edition-nav" aria-label="Hauptnavigation">
							<button className="edition-link" onClick={() => { goToHome(); setMobileNavOpen(false); }}>Startseite</button>
							<button className="edition-link" onClick={() => { navigate('/history'); setMobileNavOpen(false); }}>Chronik</button>
							<button className="edition-link" onClick={() => { scrollToSection('aboutus'); setMobileNavOpen(false); }}>Team</button>
							<button className="edition-link" onClick={() => { scrollToSection('faq'); setMobileNavOpen(false); }}>FAQ</button>
						</nav>
					</div>

					<div className="masthead-user-controls">
						{currentUser ? (
							<div
								ref={userAreaRef}
								className={`UserArea ${menuOpen ? 'open' : ''}`}
								tabIndex={0}
								aria-haspopup="true"
								onMouseEnter={() => setMenuOpen(true)}
								onMouseLeave={() => setMenuOpen(false)}
								onFocus={() => setMenuOpen(true)}
								onBlur={() => setMenuOpen(false)}
							>
								<button className="NavItem UserButton" title={currentUser.email}>
									<svg viewBox="0 0 24 24" className="UserIcon">
										<path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
									</svg>
								</button>

								<div className="LogoutPanel" role="menu" aria-hidden={!menuOpen}>
									<div className="UserInfo">{currentUser.username}</div>
									<button className="LogoutButton" onClick={handleLogout}>Abmelden</button>
								</div>
							</div>
						) : (
							<button className="edition-link login-link" onClick={() => { navigate('/login'); setMobileNavOpen(false); }}>Anmelden</button>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}

export default Header;