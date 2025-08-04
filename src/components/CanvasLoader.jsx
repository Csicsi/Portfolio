import React from 'react'
import { Html, useProgress } from '@react-three/drei';

const CanvasLoader = () => {
  const { progress } = useProgress();
  return (
	<Html as="div" center style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
	  <span className="canvas-loader" />
	  <p style={{ color: '#f1f1f1', fontSize: 14, marginTop: 40, fontWeight: 800 }}>
		{progress !== 0 ? `Loading... ${progress.toFixed(2)}%` : 'Loading...'}
	  </p>
	</Html>
  );
}

export default CanvasLoader;
