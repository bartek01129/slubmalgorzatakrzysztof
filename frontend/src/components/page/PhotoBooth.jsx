import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Diamond } from '../Ornaments';

const API_URL = '/api/photos';
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB — musi ≤ limitowi w backendzie
const PAGE_SIZE = 40; // ile kafelków renderujemy na raz (reszta doładowuje się na scroll)
const OPTIMISTIC_WINDOW_MS = 60_000; // ile trzymamy optymistyczny wpis, zanim poll go zobaczy

// Token admina z URL (?admin=...) — czytany raz, nie w komponencie, żeby nie
// przeliczać na każdy render.
const ADMIN_TOKEN = new URLSearchParams(window.location.search).get('admin');

function isAcceptable(file) {
	const okType = file.type.startsWith('image/');
	const okHeic = /\.(heic|heif)$/i.test(file.name); // iPhone bywa bez file.type
	return (okType || okHeic) && file.size <= MAX_BYTES;
}

const makeId = () =>
	typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Upload jednego pliku z progresem (XHR, bo fetch nie daje upload.onprogress).
function uploadToServer(file, onProgress) {
	return new Promise((resolve, reject) => {
		const fd = new FormData();
		fd.append('file', file);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', API_URL);
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress(e.loaded / e.total);
		};
		xhr.onload = () => {
			let data;
			try {
				data = JSON.parse(xhr.responseText);
			} catch {
				reject(new Error('Błędna odpowiedź serwera'));
				return;
			}
			if (xhr.status >= 200 && xhr.status < 300 && data.public_id) {
				resolve(data);
				return;
			}
			if (xhr.status === 409) {
				reject(new Error('Galeria jest pełna — osiągnięto limit zdjęć.'));
			} else if (xhr.status === 429) {
				reject(
					new Error('Za dużo przesłań na raz — odczekaj chwilę i spróbuj ponownie.'),
				);
			} else {
				reject(new Error(data?.error || `Błąd uploadu (${xhr.status})`));
			}
		};
		xhr.onerror = () => reject(new Error('Błąd sieci podczas przesyłania'));
		xhr.send(fd);
	});
}

export default function PhotoBooth() {
	const navigate = useNavigate();
	const [photos, setPhotos] = useState([]);
	const [queue, setQueue] = useState([]); // [{ id, name, progress, status }]
	const [errorMsg, setErrorMsg] = useState('');
	const [selectedImage, setSelectedImage] = useState(null);
	const [loadedImages, setLoadedImages] = useState(new Set());
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const sentinelRef = useRef(null);
	const photosLenRef = useRef(0);
	photosLenRef.current = photos.length;

	const fetchPhotos = useCallback(async () => {
		try {
			const res = await fetch(API_URL, { cache: 'no-store' });
			if (!res.ok) return;
			const data = await res.json();
			if (!Array.isArray(data)) return;
			// Bazą jest zawsze serwer (żeby usunięte zdjęcia znikały). Z poprzedniego
			// stanu dokładamy tylko świeże optymistyczne wpisy, których serwer
			// jeszcze nie zdążył zobaczyć (poll co 30 s) — reszta by "zmartwychwstała".
			setPhotos((prev) => {
				const known = new Set(data.map((p) => p.public_id));
				const now = Date.now();
				const pending = prev.filter(
					(p) =>
						!known.has(p.public_id) &&
						now - new Date(p.created_at).getTime() < OPTIMISTIC_WINDOW_MS,
				);
				return [...data, ...pending].sort(
					(a, b) => new Date(b.created_at) - new Date(a.created_at),
				);
			});
		} catch {
			/* cisza — kolejny poll spróbuje znowu */
		}
	}, []);

	useEffect(() => {
		window.scrollTo(0, 0);
		fetchPhotos();
		const id = setInterval(fetchPhotos, 30_000); // poll — widać też zdjęcia innych gości
		return () => clearInterval(id);
	}, [fetchPhotos]);

	// Doładowywanie siatki: obserwujemy „wartownika" na dole. Gdy wjeżdża w pole
	// widzenia, pokazujemy kolejną porcję. Kafelki spoza okna nie istnieją w DOM,
	// więc przeglądarka nie pobiera ich miniatur (oszczędza transfer i pamięć).
	useEffect(() => {
		const el = sentinelRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setVisibleCount((c) =>
						c < photosLenRef.current ? c + PAGE_SIZE : c,
					);
				}
			},
			{ rootMargin: '600px' },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	const handleFiles = async (fileList) => {
		const files = Array.from(fileList || []);
		if (!files.length) return;
		setErrorMsg('');
		// Sprzątamy zakończone wpisy z poprzedniej partii.
		setQueue((q) => q.filter((it) => it.status === 'uploading'));

		const accepted = files.filter(isAcceptable);
		const rejected = files.length - accepted.length;
		if (rejected > 0)
			setErrorMsg(
				`Pominięto ${rejected} plik(ów) — dozwolone są zdjęcia do 15 MB.`,
			);

		for (const file of accepted) {
			const id = makeId();
			setQueue((q) => [
				...q,
				{ id, name: file.name, progress: 0, status: 'uploading' },
			]);
			try {
				const data = await uploadToServer(file, (p) =>
					setQueue((q) =>
						q.map((it) => (it.id === id ? { ...it, progress: p } : it)),
					),
				);
				// Optymistyczne dodanie — odpowiedź serwera ma już wszystkie pola.
				setPhotos((prev) => {
					if (prev.some((p) => p.public_id === data.public_id)) return prev;
					return [data, ...prev];
				});
				setQueue((q) =>
					q.map((it) =>
						it.id === id ? { ...it, progress: 1, status: 'done' } : it,
					),
				);
			} catch (err) {
				setQueue((q) =>
					q.map((it) => (it.id === id ? { ...it, status: 'error' } : it)),
				);
				setErrorMsg(err.message || 'Nie udało się przesłać zdjęcia.');
			}
		}
		// Zakończone (done) znikają po chwili; błędy zostają widoczne w kolejce.
		setTimeout(
			() => setQueue((q) => q.filter((it) => it.status !== 'done')),
			2500,
		);
	};

	const onInputChange = (e) => {
		handleFiles(e.target.files);
		e.target.value = ''; // pozwala wybrać ten sam plik ponownie
	};

	// Usuwanie zdjęcia — dostępne tylko z tokenem admina w URL (?admin=...).
	const handleDeletePhoto = async (e, photo) => {
		e.stopPropagation(); // nie otwieraj lightboxa
		if (!window.confirm('Usunąć to zdjęcie?')) return;
		try {
			const res = await fetch(`${API_URL}/${photo.id}`, {
				method: 'DELETE',
				headers: { 'X-Admin-Token': ADMIN_TOKEN },
			});
			if (res.status === 204) {
				setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
			} else if (res.status === 401) {
				setErrorMsg('Błędny token administratora.');
			} else {
				setErrorMsg('Nie udało się usunąć zdjęcia.');
			}
		} catch {
			setErrorMsg('Nie udało się usunąć zdjęcia.');
		}
	};

	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === 'Escape') setSelectedImage(null);
		};
		if (selectedImage) {
			window.addEventListener('keydown', handleEsc);
			document.body.style.overflow = 'hidden';
		}
		return () => {
			window.removeEventListener('keydown', handleEsc);
			document.body.style.overflow = 'unset';
		};
	}, [selectedImage]);

	const busy = queue.some((it) => it.status === 'uploading');

	return (
		<section className="min-h-screen py-14 px-4 bg-lb-cream">
			<div className="max-w-4xl mx-auto">
				{/* Powrót */}
				<motion.button
					onClick={() => navigate('/')}
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					className="flex items-center gap-2 mb-12 text-lb-champagne hover:text-lb-gold transition-colors text-xs uppercase tracking-[0.2em] font-semibold"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					Wróć do strony głównej
				</motion.button>

				{/* Nagłówek */}
				<motion.div
					className="text-center mb-14"
					initial={{ opacity: 0, y: -18 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<p className="lb-eyebrow mb-3">Wspomnienia</p>
					<h2 className="text-4xl md:text-5xl font-serif italic text-lb-dark mb-4">
						Galeria Weselna
					</h2>
					<div className="flex items-center justify-center gap-3">
						<span className="h-px w-12 bg-lb-champagne/40" />
						<Diamond opacity={0.5} />
						<span className="h-px w-12 bg-lb-champagne/40" />
					</div>
					<p className="text-lb-text/50 font-light mt-5">
						Uwieczniliście piękny moment? Podzielcie się nim z nami!
					</p>
				</motion.div>

				{/* Panel uploadu */}
				<div className="sticky top-4 z-30 mb-14 flex justify-center">
					<div className="bg-lb-cream/90 backdrop-blur-md p-5 shadow-lb-elegant border border-lb-soft/60 w-full max-w-md">
						<div className="flex flex-row gap-3 justify-center">
							<input
								type="file"
								accept="image/*"
								capture="environment"
								onChange={onInputChange}
								id="camera-input"
								className="hidden"
							/>
							<label
								htmlFor="camera-input"
								className="flex-1 flex flex-col items-center gap-2 px-4 py-4 bg-lb-dark text-lb-cream font-semibold text-xs uppercase tracking-[0.15em] cursor-pointer hover:bg-lb-champagne transition-all duration-300"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								Zrób zdjęcie
							</label>

							<input
								type="file"
								accept="image/*"
								multiple
								onChange={onInputChange}
								id="gallery-input"
								className="hidden"
							/>
							<label
								htmlFor="gallery-input"
								className="flex-1 flex flex-col items-center gap-2 px-4 py-4 bg-transparent text-lb-dark border border-lb-champagne/40 font-semibold text-xs uppercase tracking-[0.15em] cursor-pointer hover:bg-lb-champagne/10 transition-all duration-300"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								Z biblioteki
							</label>
						</div>

						{/* Kolejka wgrywania z paskiem postępu na plik */}
						<AnimatePresence>
							{queue.length > 0 && (
								<motion.ul
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className="mt-4 space-y-2 overflow-hidden"
								>
									{queue.map((it) => (
										<li key={it.id} className="text-left">
											<div className="flex items-center justify-between gap-3 mb-1">
												<span className="text-[11px] text-lb-text/60 truncate max-w-[70%]">
													{it.name}
												</span>
												<span
													className={`text-[11px] font-semibold tabular-nums ${
														it.status === 'error'
															? 'text-red-500'
															: it.status === 'done'
																? 'text-lb-champagne'
																: 'text-lb-text/45'
													}`}
												>
													{it.status === 'error'
														? 'Błąd'
														: it.status === 'done'
															? 'Gotowe'
															: `${Math.round(it.progress * 100)}%`}
												</span>
											</div>
											<div className="h-[3px] w-full bg-lb-soft/40 overflow-hidden">
												<div
													className={`h-full transition-[width] duration-200 ${
														it.status === 'error' ? 'bg-red-400' : 'bg-lb-champagne'
													}`}
													style={{
														width: `${
															it.status === 'error' ? 100 : Math.round(it.progress * 100)
														}%`,
													}}
												/>
											</div>
										</li>
									))}
								</motion.ul>
							)}
						</AnimatePresence>

						{errorMsg && (
							<p className="mt-3 text-[11px] text-red-500 text-center font-light">
								{errorMsg}
							</p>
						)}
					</div>
				</div>

				{/* Siatka zdjęć */}
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
					<AnimatePresence>
						{photos.slice(0, visibleCount).map((photo) => (
							<motion.div
								key={photo.id}
								layout
								initial={{ opacity: 0, scale: 0.92 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.92 }}
								onClick={() => setSelectedImage(photo.web_url)}
								className="group relative aspect-[3/4] overflow-hidden shadow-lb-soft border border-lb-soft/50 cursor-pointer bg-lb-warm-cream"
							>
								{!loadedImages.has(photo.id) && (
									<div className="absolute inset-0 bg-gradient-to-br from-lb-soft/30 to-lb-champagne/10 animate-pulse" />
								)}
								<img
									src={photo.thumb_url}
									alt="Wspomnienie weselne"
									loading="lazy"
									onLoad={() => setLoadedImages((prev) => new Set([...prev, photo.id]))}
									className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
										loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'
									}`}
								/>
								{ADMIN_TOKEN && (
									<button
										onClick={(e) => handleDeletePhoto(e, photo)}
										title="Usuń zdjęcie"
										className="absolute top-2 right-2 z-10 p-1.5 bg-lb-dark/70 text-lb-cream/80 hover:text-lb-cream hover:bg-red-500/80 transition-colors"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
										</svg>
									</button>
								)}
							</motion.div>
						))}
					</AnimatePresence>
				</div>

				{/* Wartownik doładowywania — niewidoczny znacznik na dole listy */}
				<div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

				{photos.length === 0 && !busy && (
					<div className="text-center py-20">
						<p className="text-lb-text/35 font-serif italic text-lg">
							Nie ma jeszcze żadnych zdjęć. Bądźcie pierwsi!
						</p>
					</div>
				)}

				{/* Lightbox */}
				<AnimatePresence>
					{selectedImage && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setSelectedImage(null)}
							className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
						>
							<button
								onClick={() => setSelectedImage(null)}
								className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[110]"
								title="Zamknij (Esc)"
							>
								<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
							<motion.img
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.9, opacity: 0 }}
								src={selectedImage}
								className="max-w-full max-h-[90vh] shadow-2xl object-contain cursor-default"
								onClick={(e) => e.stopPropagation()}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
}
