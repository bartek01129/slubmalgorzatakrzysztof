import { motion } from 'framer-motion';
import { Diamond } from './Ornaments';
import { flights } from '../data/wedding';

function PlaneIcon({ className = '' }) {
	return (
		<svg
			className={className}
			width='20'
			height='20'
			viewBox='0 0 24 24'
			fill='currentColor'
			aria-hidden='true'
		>
			<path d='M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z' />
		</svg>
	);
}

// Kropkowana trasa lotu z samolotem pośrodku
function FlightPath() {
	return (
		<div className='flex-1 flex items-center gap-2 px-2 sm:px-4 min-w-[70px]'>
			<span className='w-1.5 h-1.5 rounded-full border border-lb-champagne/60 flex-shrink-0' />
			<span
				className='flex-1 h-px'
				style={{
					backgroundImage:
						'repeating-linear-gradient(90deg, rgba(196,169,109,0.55) 0, rgba(196,169,109,0.55) 4px, transparent 4px, transparent 10px)',
				}}
			/>
			<motion.span
				className='text-lb-champagne flex-shrink-0'
				initial={{ x: -14, opacity: 0 }}
				whileInView={{ x: 0, opacity: 1 }}
				transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
				viewport={{ once: true }}
			>
				<PlaneIcon className='rotate-90' />
			</motion.span>
			<span
				className='flex-1 h-px'
				style={{
					backgroundImage:
						'repeating-linear-gradient(90deg, rgba(196,169,109,0.55) 0, rgba(196,169,109,0.55) 4px, transparent 4px, transparent 10px)',
				}}
			/>
			<span className='w-1.5 h-1.5 rounded-full bg-lb-champagne/70 flex-shrink-0' />
		</div>
	);
}

function BoardingPass({ flight, index }) {
	return (
		<motion.article
			initial={{ opacity: 0, y: 28 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.12, duration: 0.6 }}
			viewport={{ once: true }}
			className='relative bg-white border border-lb-soft/60 shadow-lb-soft hover:shadow-lb-elegant transition-shadow duration-500'
		>
			{/* Pasek górny: etykieta + data */}
			<div className='flex items-center justify-between gap-4 px-6 sm:px-8 pt-6'>
				<span className='lb-eyebrow'>{flight.label}</span>
				<span className='text-[10px] uppercase tracking-[0.25em] text-lb-text/45'>
					{flight.weekday} · {flight.date}
				</span>
			</div>

			{/* Trasa */}
			<div className='px-6 sm:px-8 py-7 flex items-center'>
				<div className='text-left'>
					<p className='font-serif italic text-xl sm:text-2xl md:text-3xl text-lb-dark leading-tight'>
						{flight.from.city}
					</p>
					<p className='text-lb-champagne font-serif text-lg sm:text-xl font-semibold tabular-nums mt-1'>
						{flight.from.time}
					</p>
				</div>

				<FlightPath />

				<div className='text-right'>
					<p className='font-serif italic text-xl sm:text-2xl md:text-3xl text-lb-dark leading-tight'>
						{flight.to.city}
					</p>
					<p className='text-lb-champagne font-serif text-lg sm:text-xl font-semibold tabular-nums mt-1'>
						{flight.to.time}
					</p>
				</div>
			</div>

			{/* Perforacja jak w bilecie */}
			<div className='relative'>
				<div className='border-t border-dashed border-lb-soft' />
				<span className='absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-lb-cream shadow-[inset_-3px_0_5px_-2px_rgba(49,42,34,0.32)]' />
				<span className='absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-lb-cream shadow-[inset_3px_0_5px_-2px_rgba(49,42,34,0.32)]' />
			</div>

			{/* Odcinek ze szczegółami */}
			<div className='px-6 sm:px-8 py-5 flex flex-wrap gap-x-10 gap-y-3 bg-lb-warm-cream/50'>
				{flight.details.map((d) => (
					<div key={d.label}>
						<p className='text-[9px] uppercase tracking-[0.25em] text-lb-text/45 mb-0.5'>
							{d.label}
						</p>
						<p className='text-lb-dark font-serif text-base sm:text-lg tabular-nums'>
							{d.value}
						</p>
					</div>
				))}
			</div>
		</motion.article>
	);
}

export default function Flights() {
	return (
		<section id='przeloty' className='py-24 px-4 bg-lb-cream'>
			<div className='max-w-3xl mx-auto'>
				<motion.div
					className='text-center mb-14'
					initial={{ opacity: 0, y: -18 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					viewport={{ once: true }}
				>
					<p className='lb-eyebrow mb-3'>Podróż</p>
					<h2 className='text-4xl md:text-5xl font-serif italic text-lb-dark mb-5'>
						Przeloty
					</h2>
					<div className='flex items-center justify-center gap-3'>
						<span className='h-px w-16 bg-lb-champagne/40' />
						<Diamond opacity={0.5} />
						<span className='h-px w-16 bg-lb-champagne/40' />
					</div>
					<p className='text-lb-text/50 text-sm font-light mt-5 max-w-md mx-auto'>
						Lecimy razem! Poniżej najważniejsze godziny podróży.
					</p>
				</motion.div>

				<div className='space-y-8'>
					{flights.map((flight, i) => (
						<BoardingPass key={flight.key} flight={flight} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
