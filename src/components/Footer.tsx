import React from 'react';
import './footer.css';

function Footer(): React.ReactElement {
	return (
		<footer className="Footer">
			<div className="FooterCenter">
				<a href="#impressum" className="ImpressumLink">Impressum</a>
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