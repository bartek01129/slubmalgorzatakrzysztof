import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Diamond, decoWeaveStyle } from './Ornaments';
import { couple, dates, place } from '../data/wedding';

export default function PasswordProtection({ onSuccess }) {
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [shake, setShake] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const CORRECT_PASSWORD = import.meta.env.VITE_PASSWORD;

	useEffect(() => {
		// Aktywna sesja → auto-logowanie
		if (sessionStorage.getItem('weddingAuth') === 'authenticated') {
			onSuccess();
			return;
		}

		// Hasło w linku (?pwd=...) — pozwala rozsyłać gościom link z kodu QR
		const pwdFromUrl = new URLSearchParams(window.location.search).get('pwd');
		if (pwdFromUrl && pwdFromUrl === CORRECT_PASSWORD) {
			sessionStorage.setItem('weddingAuth', 'authenticated');
			window.history.replaceState(null, '', window.location.pathname);
			onSuccess();
		}

		// Kosmetyczne utrudnienie podglądu (nie realna ochrona)
		const blockDevTools = (e) => {
			if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
				e.preventDefault();
			}
		};
		document.addEventListener('keydown', blockDevTools);
		return () => document.removeEventListener('keydown', blockDevTools);
	}, [onSuccess, CORRECT_PASSWORD]);

	const handleSubmit = (e) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		setTimeout(() => {
			if (password === CORRECT_PASSWORD) {
				sessionStorage.setItem('weddingAuth', 'authenticated');
				setPassword('');
				onSuccess();
			} else {
				setError('Hasło nieprawidłowe');
				setShake(true);
				setPassword('');
				setTimeout(() => setShake(false), 500);
			}
			setIsLoading(false);
		}, 300);
	};

	return (
		<motion.div
			className="fixed inset-0 w-full h-screen flex z-50 bg-lb-cream"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.6 }}
		>
			{/* Lewy panel — ciemny, dekoracyjny */}
			<div className="hidden md:flex w-1/2 bg-lb-dark relative items-center justify-center overflow-hidden">
				<div className="absolute inset-0" style={decoWeaveStyle(0.06)} />
				<div
					className="absolute inset-0"
					style={{
						background:
							'radial-gradient(120% 90% at 50% 110%, rgba(196,169,109,0.4), transparent 62%)',
					}}
				/>
				<motion.div
					className="relative text-center z-10 px-10"
					initial={{ opacity: 0, y: 22 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.8 }}
				>
					<div className="flex items-center justify-center gap-4 mb-6">
						<span className="h-px w-16 bg-lb-champagne/30" />
						<Diamond opacity={0.6} />
						<span className="h-px w-16 bg-lb-champagne/30" />
					</div>
					<p className="text-[10px] uppercase tracking-[0.5em] text-lb-champagne/60 mb-5">
						{dates.wedding.display}
					</p>
					<h2 className="font-serif italic text-5xl text-lb-cream/90 leading-tight">
						{couple.bride}
					</h2>
					<p className="text-lb-champagne/60 text-2xl font-light my-1">&amp;</p>
					<h2 className="font-serif italic text-5xl text-lb-cream/90 leading-tight">
						{couple.groom}
					</h2>
					<div className="flex items-center justify-center gap-4 mt-6">
						<span className="h-px w-16 bg-lb-champagne/30" />
						<Diamond opacity={0.6} />
						<span className="h-px w-16 bg-lb-champagne/30" />
					</div>
					<p className="text-[10px] uppercase tracking-[0.45em] text-lb-champagne/40 mt-8">
						{place.region} · {place.country}
					</p>
				</motion.div>
			</div>

			{/* Prawy panel — formularz */}
			<div className="flex-1 flex items-center justify-center px-8">
				<motion.div
					className="w-full max-w-sm"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.2, duration: 0.6 }}
				>
					{/* Nazwy (mobilnie) */}
					<div className="md:hidden text-center mb-10">
						<p className="text-[10px] uppercase tracking-[0.5em] text-lb-champagne/70 mb-3">
							{dates.wedding.display}
						</p>
						<h2 className="font-serif italic text-3xl text-lb-dark">
							{couple.combined}
						</h2>
					</div>

					<p className="lb-eyebrow mb-8">Prywatne zaproszenie</p>

					<h3 className="font-serif italic text-3xl text-lb-dark mb-2">Witajcie</h3>
					<p className="text-sm text-lb-text/50 font-light mb-9">
						Wpiszcie hasło, aby zobaczyć zaproszenie
					</p>

					<form onSubmit={handleSubmit} className="space-y-6">
						<motion.div
							animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
							transition={{ duration: 0.4 }}
						>
							<input
								type="password"
								value={password}
								onChange={(e) => {
									setPassword(e.target.value);
									setError('');
								}}
								placeholder="Hasło"
								disabled={isLoading}
								className="w-full px-0 py-3 bg-transparent border-b border-lb-soft focus:border-lb-champagne focus:outline-none text-lb-text placeholder-lb-text/30 transition-colors tracking-wider"
								autoFocus
							/>
						</motion.div>

						{error && (
							<motion.p
								className="text-red-400 text-xs tracking-wider"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
							>
								{error}
							</motion.p>
						)}

						<motion.button
							type="submit"
							disabled={isLoading || !password}
							className="w-full bg-lb-dark disabled:opacity-30 text-lb-cream py-4 text-xs uppercase tracking-[0.3em] transition-all duration-300 hover:bg-lb-champagne flex items-center justify-center gap-2"
							whileHover={{ scale: 1.01 }}
							whileTap={{ scale: 0.98 }}
						>
							{isLoading ? (
								<>
									<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									Sprawdzanie...
								</>
							) : (
								'Wejdź'
							)}
						</motion.button>
					</form>

					<div className="mt-10 flex items-center gap-3">
						<span className="h-px flex-1 bg-lb-soft" />
						<Diamond size={6} opacity={0.3} />
						<span className="h-px flex-1 bg-lb-soft" />
					</div>
					<p className="text-center text-lb-text/35 text-xs mt-4 tracking-wider">
						Zaproszenie na ślub {couple.combined}
					</p>
				</motion.div>
			</div>
		</motion.div>
	);
}
