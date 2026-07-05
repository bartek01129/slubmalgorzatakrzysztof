import { useState, useEffect } from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
	Link,
} from 'react-router-dom';
import Hero from './components/Hero';
import Countdown from './components/Countdown';
import Welcome from './components/Welcome';
import Agenda from './components/Agenda';
import DressCode from './components/DressCode';
import Map from './components/Map';
import Gifts from './components/Gifts';
import Podziekowanie from './components/Podziekowanie';
import Footer from './components/Footer';
import PasswordProtection from './components/PasswordProtection';
import PhotoBooth from './components/page/PhotoBooth';
import { Diamond } from './components/Ornaments';
import './App.css';

function GalleryCTA() {
	return (
		<section className='py-16 px-4 bg-lb-warm-cream'>
			<div className='max-w-md mx-auto text-center'>
				<div className='flex items-center justify-center gap-3 mb-6'>
					<span className='h-px w-10 bg-lb-champagne/40' />
					<Diamond opacity={0.5} />
					<span className='h-px w-10 bg-lb-champagne/40' />
				</div>
				<p className='text-lb-text/60 font-light mb-7'>
					Podzielcie się z nami swoimi ujęciami z obu dni. Stwórzmy wspólną
					galerię wspomnień.
				</p>
				<Link
					to='/galeria'
					className='group inline-flex items-center gap-3 px-8 py-4 border border-lb-champagne/40 text-lb-dark text-xs uppercase tracking-[0.25em] font-semibold hover:bg-lb-champagne hover:text-white transition-all duration-300'
				>
					<svg
						className='w-5 h-5'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={1.5}
							d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
						/>
					</svg>
					Otwórz Galerię Zdjęć
				</Link>
			</div>
		</section>
	);
}

export default function App() {
	const [isAuthenticated, setIsAuthenticated] = useState(
		sessionStorage.getItem('weddingAuth') === 'authenticated',
	);

	const handleAuthSuccess = () => setIsAuthenticated(true);

	return (
		<Router>
			<main className='min-h-screen bg-lb-cream text-lb-text overflow-x-hidden'>
				<ScrollToTopButton />

				<Routes>
					{/* Strona główna */}
					<Route
						path='/'
						element={
							!isAuthenticated ? (
								<PasswordProtection onSuccess={handleAuthSuccess} />
							) : (
								<>
									<Hero />
									<Countdown />
									<Welcome />
									<GalleryCTA />
									<Agenda />
									<DressCode />
									<Map />
									<Gifts />
									<Podziekowanie />
									<Footer />
								</>
							)
						}
					/>

					{/* Galeria */}
					<Route
						path='/galeria'
						element={
							isAuthenticated ? (
								<PhotoBooth />
							) : (
								<PasswordProtection onSuccess={handleAuthSuccess} />
							)
						}
					/>

					{/* Błędne adresy → główna */}
					<Route path='*' element={<Navigate to='/' />} />
				</Routes>
			</main>
		</Router>
	);
}

function ScrollToTopButton() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const toggle = () => setIsVisible(window.pageYOffset > 300);
		window.addEventListener('scroll', toggle);
		return () => window.removeEventListener('scroll', toggle);
	}, []);

	if (!isVisible) return null;

	return (
		<button
			onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
			className='fixed bottom-8 right-8 z-50 w-12 h-12 flex items-center justify-center bg-lb-dark text-lb-cream shadow-lb-elegant hover:bg-lb-champagne transition-all duration-300'
			title='Powrót do góry'
		>
			<svg
				className='w-5 h-5'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				<path
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth={1.5}
					d='M5 15l7-7 7 7'
				/>
			</svg>
		</button>
	);
}
