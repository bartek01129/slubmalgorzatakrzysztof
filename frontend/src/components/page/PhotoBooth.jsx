import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Diamond } from '../Ornaments';

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const GALLERY_TAG = import.meta.env.VITE_GALLERY_TAG || 'mk2026';
const API_URL = '/api/photos';
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB — musi ≤ limitowi w presecie Cloudinary

// Miniatura / pełny obraz — ZAWSZE przez f_auto (naprawia HEIC z iPhone).
const thumb = (url) =>
	url.replace('/upload/', '/upload/w_400,h_533,c_fill,g_auto,q_auto:eco,f_auto/');
const full = (url) => url.replace('/upload/', '/upload/q_auto,f_auto/');

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
function uploadToCloudinary(file, onProgress) {
	return new Promise((resolve, reject) => {
		const fd = new FormData();
		fd.append('file', file);
		fd.append('upload_preset', PRESET);
		fd.append('tags', GALLERY_TAG); // tag też w presecie (belt & suspenders)

		const xhr = new XMLHttpRequest();
		xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress(e.loaded / e.total);
		};
		xhr.onload = () => {
			try {
				const data = JSON.parse(xhr.responseText);
				if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(data);
				else reject(new Error(data?.error?.message || `Błąd uploadu (${xhr.status})`));
			} catch {
				reject(new Error('Błędna odpowiedź Cloudinary'));
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

	const fetchPhotos = useCallback(async () => {
		try {
			const res = await fetch(API_URL, { cache: 'no-store' });
			if (!res.ok) return;
			const data = await res.json();
			if (!Array.isArray(data)) return;
			// Scal z optymistycznymi, dedup po public_id, najnowsze pierwsze.
			setPhotos((prev) => {
				const byId = new Map();
				[...data, ...prev].forEach((p) => byId.set(p.public_id, p));
				return [...byId.values()].sort(
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
				const data = await uploadToCloudinary(file, (p) =>
					setQueue((q) =>
						q.map((it) => (it.id === id ? { ...it, progress: p } : it)),
					),
				);
				// Optymistyczne dodanie — wgrywający widzi zdjęcie natychmiast.
				setPhotos((prev) => {
					if (prev.some((p) => p.public_id === data.public_id)) return prev;
					return [
						{
							id: data.public_id,
							public_id: data.public_id,
							url: data.secure_url,
							created_at: data.created_at || new Date().toISOString(),
						},
						...prev,
					];
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
						{photos.map((photo) => (
							<motion.div
								key={photo.id}
								layout
								initial={{ opacity: 0, scale: 0.92 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.92 }}
								onClick={() => setSelectedImage(photo.url)}
								className="group relative aspect-[3/4] overflow-hidden shadow-lb-soft border border-lb-soft/50 cursor-pointer bg-lb-warm-cream"
							>
								{!loadedImages.has(photo.id) && (
									<div className="absolute inset-0 bg-gradient-to-br from-lb-soft/30 to-lb-champagne/10 animate-pulse" />
								)}
								<img
									src={thumb(photo.url)}
									alt="Wspomnienie weselne"
									loading="lazy"
									onLoad={() => setLoadedImages((prev) => new Set([...prev, photo.id]))}
									className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
										loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'
									}`}
								/>
							</motion.div>
						))}
					</AnimatePresence>
				</div>

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
								src={full(selectedImage)}
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
