import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArtDecoRule, Diamond, decoWeaveStyle } from './Ornaments';
import { couple, dates, place } from '../data/wedding';
import heroCouple from '../assets/hero-couple.jpg';

const container = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.18, delayChildren: 0.35 },
	},
};
const item = {
	hidden: { opacity: 0, y: 26 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
	},
};

function CornerMark({ className }) {
	return (
		<span className={`absolute w-8 h-8 border-lb-champagne/40 ${className}`} />
	);
}

export default function Hero() {
	return (
		<section
			id='hero'
			className='relative w-full overflow-hidden text-white'
			style={{ minHeight: '100dvh' }}
		>
			{/* Warstwa 0 — zdjęcie Pary Młodej, lekko rozmyte (życzenie klienta).
			    scale(1.1) chowa miękkie krawędzie rozmycia; obraz dekoracyjny → alt='' */}
			<div className='absolute inset-0'>
				{/* Art direction: mobile (wysoki kadr) pokazuje całą parę przy 30%;
				    desktop (szeroki, wąski pas) kadruje wyżej (12%), by obie głowy weszły. */}
				<img
					src={heroCouple}
					alt=''
					aria-hidden='true'
					className='w-full h-full object-cover object-[40%_30%] md:object-[80%_20%]'
					style={{
						filter: 'blur(1px)',
						transform: 'scale(1.1)',
					}}
				/>
			</div>
			{/* Warstwa 1 — espresso: przyciemnienie dla czytelności, zdjęcie prześwituje */}
			<div
				className='absolute inset-0'
				style={{
					background:
						'linear-gradient(180deg, rgba(38,32,26,0.80) 0%, rgba(52,43,33,0.56) 45%, rgba(38,32,26,0.90) 100%)',
				}}
			/>
			{/* Warstwa 1b — miękki scrim pod tekstem (gwarantuje kontrast nad jasnym zdjęciem) */}
			<div
				className='absolute inset-0'
				style={{
					background:
						'radial-gradient(78% 56% at 50% 46%, rgba(16,12,9,0.52) 0%, rgba(16,12,9,0.14) 55%, transparent 80%)',
				}}
			/>
			{/* Warstwa 2 — złota poświata zachodu słońca u dołu */}
			<div
				className='absolute inset-0'
				style={{
					background:
						'radial-gradient(130% 85% at 50% 108%, rgba(196,169,109,0.40) 0%, rgba(196,169,109,0.10) 42%, transparent 66%)',
				}}
			/>
			{/* Warstwa 3 — diamentowa tekstura art-deco.
			    Maska: niewidoczna u góry, płynnie pojawia się (opacity 0 → 100)
			    od ~połowy ekranu (okolice daty) w dół. */}
			<div
				className='absolute inset-0'
				style={{
					...decoWeaveStyle(0.05),
					WebkitMaskImage:
						'linear-gradient(to bottom, transparent 48%, black 95%)',
					maskImage: 'linear-gradient(to bottom, transparent 48%, black 95%)',
				}}
			/>

			{/* Cyzelowana ramka zaproszenia */}
			<div className='absolute inset-4 sm:inset-6 md:inset-9 border border-white/12 pointer-events-none'>
				<CornerMark className='top-[-1px] left-[-1px] border-t border-l' />
				<CornerMark className='top-[-1px] right-[-1px] border-t border-r' />
				<CornerMark className='bottom-[-1px] left-[-1px] border-b border-l' />
				<CornerMark className='bottom-[-1px] right-[-1px] border-b border-r' />
			</div>

			{/* Treść */}
			<motion.div
				className='relative z-10 w-full min-h-[100dvh] flex flex-col items-center justify-center px-6 py-20 text-center'
				variants={container}
				initial='hidden'
				animate='visible'
			>
				<motion.div variants={item}>
					<ArtDecoRule className='text-white/70 mx-auto mb-8' />
				</motion.div>

				<motion.p
					variants={item}
					className='text-[10px] md:text-xs uppercase tracking-[0.3em] sm:tracking-[0.55em] text-lb-champagne/80 mb-8 max-w-xs sm:max-w-none'
				>
					Wspólnie celebrujmy ten wyjątkowy dzień
				</motion.p>

				<motion.h1
					variants={item}
					className='font-serif mb-2'
					style={{ textShadow: '0 2px 26px rgba(12,8,5,0.55)' }}
				>
					<span className='block text-5xl sm:text-6xl md:text-7xl lg:text-8xl italic leading-[1.05] text-white'>
						{couple.bride}
					</span>
					<span className='block text-lb-champagne text-2xl md:text-3xl my-3 font-light tracking-widest'>
						&amp;
					</span>
					<span className='block text-5xl sm:text-6xl md:text-7xl lg:text-8xl italic leading-[1.05] text-white'>
						{couple.groom}
					</span>
				</motion.h1>

				<motion.div variants={item} className='my-9'>
					<div className='flex items-center justify-center gap-4'>
						<span className='h-px w-16 bg-lb-champagne/50' />
						<Diamond opacity={0.75} />
						<span className='h-px w-16 bg-lb-champagne/50' />
					</div>
				</motion.div>

				<motion.div variants={item} className='w-full flex justify-center'>
					<div
						className='px-6 sm:px-10 py-4 backdrop-blur-sm max-w-full'
						style={{
							background: 'rgba(38,32,26,0.42)',
							border: '1px solid rgba(196,169,109,0.35)',
						}}
					>
						<p className='font-serif text-2xl sm:text-3xl md:text-4xl italic text-white'>
							{dates.wedding.display}
						</p>
						<p className='text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.2em] sm:tracking-[0.4em] text-lb-champagne/85 mt-2'>
							{dates.wedding.weekday} · {place.region} · {place.country}
						</p>
					</div>
				</motion.div>

				<motion.div
					variants={item}
					className='mt-11 w-full max-w-xs sm:max-w-none flex flex-col sm:flex-row items-center justify-center gap-4'
				>
					<a
						href='#agenda'
						className='w-full sm:w-auto text-center px-10 py-4 text-white text-xs uppercase tracking-[0.3em] font-semibold transition-all duration-300 hover:scale-[1.03] backdrop-blur-sm'
						style={{
							background: 'rgba(196,169,109,0.22)',
							border: '1.5px solid rgba(196,169,109,0.5)',
						}}
					>
						Zobacz harmonogram
					</a>
					<Link
						to='/galeria'
						className='w-full sm:w-auto text-center px-10 py-4 text-white/90 text-xs uppercase tracking-[0.3em] font-semibold border border-white/25 transition-all duration-300 hover:border-lb-champagne hover:text-white'
					>
						Galeria zdjęć
					</Link>
				</motion.div>

				<motion.div variants={item} className='mt-14'>
					<ArtDecoRule className='text-white/45 mx-auto rotate-180' />
				</motion.div>
			</motion.div>

			{/* Wskaźnik przewijania — wyśrodkowany przez flex, aby animacja y nie nadpisała translate-x */}
			<div className='absolute inset-x-0 bottom-6 z-10 flex justify-center pointer-events-none'>
				<motion.div
					className='flex flex-col items-center gap-2 text-lb-champagne/70'
					animate={{ y: [0, 8, 0] }}
					transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
				>
					<span className='text-[9px] uppercase tracking-[0.4em]'>Przewiń</span>
					<svg
						width='16'
						height='16'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={1.5}
							d='M19 9l-7 7-7-7'
						/>
					</svg>
				</motion.div>
			</div>
		</section>
	);
}
