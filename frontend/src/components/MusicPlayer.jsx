/**
 * Odtwarzacz muzyki w tle — UKRYTY oficjalny player YouTube.
 *
 * Dlaczego iframe YouTube, a nie plik mp3?
 *   Treść serwuje YouTube (przez youtube-nocookie), więc licencja/monetyzacja
 *   utworu pozostają po stronie YouTube — to bezpieczeństwo prawne, o które
 *   prosił klient. Odtwarzacz jest tylko schowany poza ekranem.
 *
 * Przepływ:
 *   1. Provider montuje się na poziomie App — już na ekranie logowania.
 *      Wtedy ładujemy YouTube IFrame API i tworzymy player → muzyka zaczyna
 *      się „pobierać”.
 *   2. Rozgrzewka bufora: krótkie odtworzenie WYCISZONE (przeglądarki na to
 *      pozwalają bez gestu) → materiał trafia do bufora, potem pauza + seek(0).
 *   3. Po zalogowaniu przycisk w Hero wywołuje play() → unMute + odtwarzanie
 *      rusza natychmiast, bo bufor jest już gotowy.
 *
 * Provider żyje przez całe życie aplikacji (nad <Routes>), więc muzyka gra
 * dalej przy przewijaniu i nie restartuje się przy zmianie widoku.
 */

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';
import { music } from '../data/wedding';

const MusicContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useMusic = () => useContext(MusicContext);

// Ładujemy skrypt YouTube IFrame API tylko raz, współdzieląc obietnicę.
let apiPromise = null;
function loadYouTubeApi() {
	if (apiPromise) return apiPromise;
	apiPromise = new Promise((resolve) => {
		if (window.YT && window.YT.Player) {
			resolve(window.YT);
			return;
		}
		// YT wywoła globalny callback, gdy API będzie gotowe.
		const previous = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			if (typeof previous === 'function') previous();
			resolve(window.YT);
		};
		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		document.head.appendChild(tag);
	});
	return apiPromise;
}

export function MusicProvider({ children }) {
	const holderRef = useRef(null); // węzeł, który YT zamieni na <iframe>
	const playerRef = useRef(null); // instancja YT.Player
	const warmedRef = useRef(false); // czy zakończono rozgrzewkę bufora
	const startedRef = useRef(false); // czy gość realnie uruchomił muzykę

	const [isReady, setIsReady] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect(() => {
		// StrictMode w dev montuje efekt dwukrotnie — flaga chroni przed
		// utworzeniem dwóch playerów.
		let cancelled = false;

		loadYouTubeApi().then((YT) => {
			if (cancelled || !holderRef.current || playerRef.current) return;

			playerRef.current = new YT.Player(holderRef.current, {
				videoId: music.youtubeId,
				width: '320',
				height: '180',
				// Wariant „no-cookie" — mniej śledzenia, spójne z ukrytym playerem.
				host: 'https://www.youtube-nocookie.com',
				playerVars: {
					autoplay: 0,
					controls: 0,
					disablekb: 1,
					fs: 0,
					modestbranding: 1,
					rel: 0,
					playsinline: 1,
					iv_load_policy: 3,
				},
				events: {
					onReady: (e) => {
						setIsReady(true);
						// Rozgrzewka bufora — wyciszone odtworzenie startuje pobieranie.
						try {
							e.target.mute();
							e.target.playVideo();
						} catch {
							/* brak zgody na autoplay — bufor dojdzie przy kliknięciu */
						}
					},
					onStateChange: (e) => {
						const S = window.YT.PlayerState;

						// Faza rozgrzewki: gdy tylko ruszy buforowanie/odtwarzanie
						// wyciszone — pauzujemy i wracamy na start.
						if (!warmedRef.current) {
							if (e.data === S.PLAYING || e.data === S.BUFFERING) {
								warmedRef.current = true;
								try {
									e.target.pauseVideo();
									e.target.seekTo(0, true);
								} catch {
									/* ignorujemy — stan i tak zsynchronizuje onStateChange */
								}
							}
							return;
						}

						// Normalna praca: synchronizacja stanu przycisku.
						if (e.data === S.PLAYING) setIsPlaying(true);
						else if (e.data === S.PAUSED || e.data === S.ENDED)
							setIsPlaying(false);
					},
				},
			});
		});

		return () => {
			cancelled = true;
		};
	}, []);

	const play = useCallback(() => {
		const p = playerRef.current;
		if (!p) return;
		try {
			p.unMute();
			p.setVolume(65);
			// Pierwsze realne uruchomienie — od początku utworu (po rozgrzewce).
			if (!startedRef.current) {
				p.seekTo(0, true);
				startedRef.current = true;
			}
			p.playVideo();
		} catch {
			/* no-op */
		}
	}, []);

	const pause = useCallback(() => {
		try {
			playerRef.current?.pauseVideo();
		} catch {
			/* no-op */
		}
	}, []);

	const toggle = useCallback(() => {
		if (isPlaying) pause();
		else play();
	}, [isPlaying, play, pause]);

	return (
		<MusicContext.Provider value={{ isReady, isPlaying, toggle, play, pause }}>
			{children}
			{/* Ukryty player: realny rozmiar (0×0 bywa blokowane przez YT),
			    ale wypchnięty daleko poza ekran i wyłączony z interakcji. */}
			<div
				aria-hidden='true'
				style={{
					position: 'fixed',
					left: '-9999px',
					bottom: 0,
					width: '320px',
					height: '180px',
					opacity: 0,
					pointerEvents: 'none',
					overflow: 'hidden',
				}}
			>
				<div ref={holderRef} />
			</div>
		</MusicContext.Provider>
	);
}
