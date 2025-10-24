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
			<div className="HeaderLeft">
				<img 
					src="/cZPlatzhalter.jpg" 
					alt="chronoZ Logo" 
					className="Logo LogoImage" 
					onClick={() => navigate('/')} 
					style={{ cursor: 'pointer' }}
				/>
			</div>
			<div className="HeaderCenter">chronoZ</div>
			<div className="HeaderRight">
				{currentUser ? (
					/* User-Bereich: Container ist positioniert; Logout-Button liegt in .LogoutPanel */
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
						<div className="UserChip" title={currentUser.email}>{currentUser.username}</div>

					
						<div
							className="LogoutPanel"
							role="menu"
							aria-hidden={!menuOpen}
							onMouseEnter={() => setMenuOpen(true)}
							onMouseLeave={() => setMenuOpen(false)}
						>
							<button className="LogoutButton" onClick={handleLogout}>Logout</button>
						</div>
					</div>
				) : (
					<button className="AuthButton" onClick={() => navigate('/login')}>Login / Registrieren</button>
				)}
			</div>

			{/* Inline-CSS für das Hover-/Slide-Verhalten (kann später in separate CSS-Datei verschoben werden) */}
			<style>{`
				.Header .HeaderRight { position: relative; }
				.UserArea { position: relative; display: inline-block; outline: none; }
				.UserChip { /* ...bestehende Styles bleiben erhalten... */ cursor: pointer; }

				.LogoutPanel {
					position: absolute;
					right: 0;
					top: 100%;
					transform: translateY(-6px);
					opacity: 0;
					visibility: hidden;
					pointer-events: none;
					transition: transform 180ms ease, opacity 180ms ease, visibility 0ms linear 180ms;
					z-index: 100;
					background: white;
					border-radius: 4px;
					box-shadow: 0 6px 18px rgba(0,0,0,0.12);
					padding: 6px;
					min-width: 120px;
					text-align: right;
				}

				/* Sichtbar bei Hover/Focus oder wenn menuOpen state true ist */
				.UserArea:hover .LogoutPanel,
				.UserArea:focus-within .LogoutPanel,
				.UserArea.open .LogoutPanel {
					transform: translateY(0);
					opacity: 1;
					visibility: visible;
					pointer-events: auto;
					transition-delay: 0;
				}

				.LogoutButton {
					background: transparent;
					border: none;
					padding: 8px 12px;
					cursor: pointer;
					border-radius: 4px;
				}
				.LogoutButton:hover { background: rgba(0,0,0,0.04); }
			`}</style>
		</header>
	);
}

export default Header;