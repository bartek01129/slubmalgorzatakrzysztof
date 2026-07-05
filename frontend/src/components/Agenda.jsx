import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Diamond, decoWeaveStyle } from './Ornaments';
import { timelineWedding, timelineAfterParty, dates } from '../data/wedding';

const days = [
	{ key: 'wedding', tab: 'Dzień I · Ślub', date: dates.wedding, events: timelineWedding },
	{ key: 'after', tab: 'Dzień II · Poprawiny', date: dates.afterParty, events: timelineAfterParty },
];

function BusIcon({ className = '' }) {
	return (
		<svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
			<path strokeLinecap="round" strokeLinejoin="round" d="M4 16V6a2 2 0 012-2h9a2 2 0 012 2v10M4 16h13M4 16v2a1 1 0 001 1h1a1 1 0 001-1v-2m10-2V9h2.5a1 1 0 01.8.4l1.5 2a1 1 0 01.2.6v2m-6 0h6m0 0v2a1 1 0 01-1 1h-1a1 1 0 01-1-1v-2M7 8h8M7 12h.01M13 12h.01" />
		</svg>
	);
}

function TimelineRow({ event, i }) {
	const isTransfer = event.isTransfer;
	return (
		<motion.div
			className="relative flex items-stretch"
			initial={{ opacity: 0, x: 18 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: i * 0.06, duration: 0.5 }}
		>
			{/* Godzina */}
			<div className="w-[54px] md:w-[76px] flex-shrink-0 text-right pr-4 py-5">
				<span className="text-lb-champagne font-serif text-lg md:text-xl font-semibold tabular-nums">
					{event.time}
				</span>
			</div>

			{/* Kropka na osi */}
			<div className="relative flex-shrink-0 w-[22px] flex justify-center">
				{event.highlight ? (
					<span className="w-3 h-3 bg-lb-champagne rotate-45 mt-[26px] relative z-10 shadow-[0_0_0_4px_#312A22]" />
				) : (
					<span
						className={`w-2.5 h-2.5 rounded-full mt-[26px] relative z-10 shadow-[0_0_0_4px_#312A22] ${
							isTransfer ? 'bg-lb-champagne/50' : 'bg-lb-champagne'
						}`}
					/>
				)}
			</div>

			{/* Treść */}
			<div className="flex-1 pl-5 py-5 border-b border-lb-champagne/10">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					<h3
						className={`leading-snug ${
							event.highlight
								? 'text-lb-cream font-serif italic text-lg md:text-xl'
								: 'text-lb-cream/85 font-light text-base md:text-lg'
						}`}
					>
						{event.title}
					</h3>
					{isTransfer && (
						<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-lb-champagne border border-lb-champagne/30">
							<BusIcon /> Transfer
						</span>
					)}
				</div>
				{event.note && (
					<p className="text-lb-cream/40 text-sm font-light italic mt-1">{event.note}</p>
				)}
			</div>
		</motion.div>
	);
}

export default function Agenda() {
	const [active, setActive] = useState('wedding');
	const day = days.find((d) => d.key === active);

	return (
		<section id="agenda" className="relative py-24 px-4 bg-lb-dark overflow-hidden">
			<div className="absolute inset-0" style={decoWeaveStyle(0.04)} />

			<div className="relative max-w-3xl mx-auto">
				<motion.div
					className="text-center mb-12"
					initial={{ opacity: 0, y: -18 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					viewport={{ once: true }}
				>
					<p className="text-[10px] uppercase tracking-[0.4em] mb-3 text-lb-champagne/70">
						Program uroczystości
					</p>
					<h2 className="text-4xl md:text-5xl font-serif italic text-lb-cream mb-5">
						Harmonogram
					</h2>
					<div className="flex items-center justify-center gap-3">
						<span className="h-px w-10 bg-lb-champagne/25" />
						<Diamond opacity={0.5} />
						<span className="h-px w-10 bg-lb-champagne/25" />
					</div>
					<p className="text-lb-cream/45 text-sm font-light mt-6 max-w-md mx-auto">
						Transfery autokarem są zapewnione w obie strony — odbiór z hotelu i powrót po zabawie.
					</p>
				</motion.div>

				{/* Przełącznik dni */}
				<div className="flex justify-center gap-2 mb-12">
					{days.map((d) => (
						<button
							key={d.key}
							onClick={() => setActive(d.key)}
							className={`px-5 md:px-7 py-3 text-[10px] md:text-xs uppercase tracking-[0.25em] font-semibold transition-all duration-300 border ${
								active === d.key
									? 'bg-lb-champagne text-lb-dark border-lb-champagne'
									: 'text-lb-cream/60 border-lb-champagne/20 hover:border-lb-champagne/50 hover:text-lb-cream'
							}`}
						>
							{d.tab}
						</button>
					))}
				</div>

				{/* Data aktywnego dnia */}
				<AnimatePresence mode="wait">
					<motion.div
						key={active}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.35 }}
					>
						<p className="text-center text-lb-champagne/70 text-[11px] uppercase tracking-[0.35em] mb-10">
							{day.date.weekday} · {day.date.display}
						</p>

						<div className="relative">
							<div className="absolute left-[65px] md:left-[87px] top-0 bottom-0 w-px bg-lb-champagne/15" />
							<div>
								{day.events.map((event, i) => (
									<TimelineRow key={`${active}-${i}`} event={event} i={i} />
								))}
							</div>
						</div>
					</motion.div>
				</AnimatePresence>
			</div>
		</section>
	);
}
