import React from 'react';

function Footer(): React.ReactElement {
	return (
		<footer className="Footer">
			<div className="FooterLeft">HTL Donaustadt</div>
			<div className="FooterCenter">
				<a href="#impressum" className="ImpressumLink">Impressum</a>
			</div>
			<div className="FooterRight" />
		</footer>
	);
}

export default Footer; 