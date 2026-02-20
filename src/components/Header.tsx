import './header.css';
import React, { ReactElement, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';

type CurrentUser = { id: string; username: string; email: string } | null;

function Header(): ReactElement {
	const navigate = useNavigate();
	const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

	// Neuer State, um Panel offen zu halten beim Hover auf das Panel selbst
	const [menuOpen, setMenuOpen] = useState(false);

	// Ref für das UserArea-Element, damit wir ggf. Fokus entfernen können
	const userAreaRef = useRef<HTMLDivElement | null>(null);

	// Wenn sich currentUser ändert (z.B. Login), sicherstellen, dass das Panel geschlossen bleibt
	useEffect(() => {
		if (currentUser) {
			setMenuOpen(false);
			// Falls das UserArea gerade den Fokus hat, Fokus entfernen, damit :focus-within nicht greift
			if (
				userAreaRef.current &&
				document.activeElement instanceof Node &&
				userAreaRef.current.contains(document.activeElement as Node)
			) {
				// blur das aktuell fokussierte Element
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

	// Listen for custom login event
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
		// User-spezifische Daten löschen
		if (currentUser) {
			// Postkarten des Users bleiben in localStorage (für späteren Login)
			// localStorage.removeItem(`userPostcards_${currentUser.id}`);
		}
		
		// Allgemeine User-Daten löschen
		localStorage.removeItem('token');
		localStorage.removeItem('currentUser');
		setCurrentUser(null);
		
		// Dispatch custom event to notify other components of logout
		window.dispatchEvent(new CustomEvent('userLogout'));
		
		// Zur Hauptseite navigieren
		navigate('/');
	}

	function scrollToSection(sectionId: string) {
		// Wenn wir nicht auf der Hauptseite sind, zuerst dorthin navigieren
		if (window.location.pathname !== '/') {
			navigate('/');
			// Warten bis die Seite geladen ist, dann scrollen
			setTimeout(() => {
				const element = document.getElementById(sectionId);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 100);
		} else {
			// Direkt zum Abschnitt scrollen
			const element = document.getElementById(sectionId);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	}

	function goToHome() {
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
	}

	// Get current date for masthead
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
				{/* Left: Date */}
				<div className="masthead-left">
					<div className="masthead-date">{getCurrentDate()}</div>
				</div>

				{/* Center: ChronoZ Logo */}
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

				{/* Right: Navigation & User */}
				<div className="masthead-right">
					<nav className="edition-nav">
					<button className="edition-link" onClick={goToHome}>Startseite</button>
						<button className="edition-link" onClick={() => {
							if (!currentUser) {
								navigate('/login');
							} else {
								scrollToSection('archive');
							}
						}}>Archiv</button>
						<button className="edition-link" onClick={() => scrollToSection('faq')}>FAQ</button>
					</nav>
					
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
						<button className="edition-link login-link" onClick={() => navigate('/login')}>Anmelden</button>
					)}
				</div>
			</div>
		</header>
	);
}

export default Header;