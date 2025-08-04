import { PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React, { Suspense, use } from 'react'
import HackerRoom from '../components/HackerRoom'
import CanvasLoader from '../components/CanvasLoader'
import { Leva, useControls } from 'leva'
import { useMediaQuery } from 'react-responsive'
import HeroCamera from '../components/HeroCamera'

const Hero = () => {
	const isMobile = useMediaQuery({ maxWidth: 768 });

	return <section className="min-h-screen w-full flex flex-col relative">
		<div className="w-full mx-auto flex flex-col sm:mt-36 mt-20 c-space gap-3">
			<p className="sm:text-3xl text-2xl font-medium text-white text-center font-generalsans">Hi im Daniel<span className="waving-hand">👋</span></p>
		</div>
		<div className="w-full h-full absolute inset-0">
			<Canvas className="w-full h-full">
				<Suspense fallback={<CanvasLoader />}>
					<PerspectiveCamera makeDefault position={[0, 0, 30]} />
					<HeroCamera>
						<HackerRoom scale={isMobile ? 0.07 : 0.1}
									position={[1.1, -2.7, -9.7]}
									rotation={[0.6, -3.2, 0]}
						/>
					</HeroCamera>
					<group></group>
					<ambientLight intensity={1} />
					<directionalLight position={[10, 10, 10]} intensity={0.5} />
				</Suspense>
			</Canvas>
		</div>
	</section>
}

export default Hero
