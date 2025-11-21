import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './footer.css';

function Footer(): React.ReactElement {
	const location = useLocation();
	const isImpressumPage = location.pathname === '/impressum';

	return (
		<footer className="Footer">
			<div className="FooterCenter">
				{isImpressumPage ? (
					<Link to="/" className="ImpressumLink">Home</Link>
				) : (
					<Link to="/impressum" className="ImpressumLink">Impressum</Link>
				)}
			</div>
			<div className="FooterRight">
				<img
						src="/htlLogo.png"
						alt="HTL Logo"
						className="Logo"
						onClick={() => window.open('https://www.htl-donaustadt.at/home', '_blank')}
						loading="lazy"
						role="button"
					/>
			</div>
		</footer>
	);
}

export default Footer; 