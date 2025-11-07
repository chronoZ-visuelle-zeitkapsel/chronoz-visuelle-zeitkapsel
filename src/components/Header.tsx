import './header.css';
import React, { ReactElement, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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
				const res = await fetch('/api/auth/me', {
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

	return (
		<header className="Header">
			<div className="HeaderContainer">
				<div className="HeaderLeft">
					<img
						src="/CzLogo.png"
						alt="chronoZ Logo"
						className="Logo"
						onClick={() => navigate('/')}
						loading="lazy"
						role="button"
					/>
				</div>

				<div className="HeaderCenter">
					<img
						src="/chronoZLogo.png"
						alt="chronoZ Logo"
						className="LogoLogo"
						onClick={() => navigate('/')}
						loading="lazy"
						role="button"
					/>
				</div>

				<div className="HeaderRight">
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
							<button className="UserButton" title={currentUser.email}>
								<svg viewBox="0 0 24 24" className="UserIcon">
									<path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
								</svg>
							</button>

							<div className="LogoutPanel" role="menu" aria-hidden={!menuOpen}>
								<div className="UserInfo">{currentUser.username}</div>
								<button className="LogoutButton" onClick={handleLogout}>Logout</button>
							</div>
						</div>
					) : (
						<button className="AuthButton" onClick={() => navigate('/login')}>Login</button>
					)}
				</div>
			</div>
		</header>
	);
}

export default Header;