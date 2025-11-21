import React, { ReactElement, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type CurrentUser = { id: string; username: string; email: string } | null;

function CTA(): ReactElement {
	const navigate = useNavigate();
	const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			setCurrentUser(null);
			return;
		}

		// Verify token and get user data
		fetch('/api/auth/me', {
			headers: { Authorization: `Bearer ${token}` }
		})
		.then(res => {
			if (!res.ok) {
				localStorage.removeItem('token');
				setCurrentUser(null);
				return null;
			}
			return res.json();
		})
		.then(data => {
			if (data) {
				setCurrentUser({ id: data.id, username: data.username, email: data.email });
			}
		})
		.catch(() => {
			localStorage.removeItem('token');
			setCurrentUser(null);
		});
	}, []);

	// Listen for login/logout events
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

	function handleHistoryClick() {
		if (!currentUser) {
			// Öffne das Login-Popup mit redirect Parameter
			navigate('/login?redirect=history');
			return;
		}
		navigate('/history');
	}

	return (
		<div className="CTA">
			<button className="CTAButton" onClick={handleHistoryClick}>
				<span className="Plus">+</span>
				<span>Zeig deine Geschichte</span>
			</button>
		</div>
	);
}

export default CTA; 