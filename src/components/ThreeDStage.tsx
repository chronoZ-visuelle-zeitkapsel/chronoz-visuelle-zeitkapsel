import React, { ReactElement, useMemo } from 'react';
import FrameByFrameCanvas from './FrameByFrameCanvas';

function ThreeDStage(): ReactElement {
	// Generiere die Frame-URLs basierend auf deinen vorhandenen PNGs (0000.png bis 0078.png)
	const frameUrls = useMemo(() => {
		return Array.from({ length: 79 }, (_, i) =>
			`/TreasureAnimation/TreasureAnimation/${String(i).padStart(4, '0')}.png`
		);
	}, []);

	return (
		<div className="StageGlass">
			<FrameByFrameCanvas
				frameUrls={frameUrls}
				fps={24}
				loop={false}
				playOnLoad={false}
			/>
		</div>
	);
}

export default ThreeDStage; 