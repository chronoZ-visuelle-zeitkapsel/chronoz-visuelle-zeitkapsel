import React, { ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type CurrentUser = { id: string; username: string; email: string } | null;

function Header(): ReactElement {
	const navigate = useNavigate();
	const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

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
					<div className="UserArea">
						<div className="UserChip" title={currentUser.email}>{currentUser.username}</div>
						<button className="LogoutButton" onClick={handleLogout}>Logout</button>
					</div>
				) : (
					<button className="AuthButton" onClick={() => navigate('/login')}>Login / Registrieren</button>
				)}
			</div>
		</header>
	);
}

export default Header; 