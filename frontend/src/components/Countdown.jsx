import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Diamond } from './Ornaments';
import { ceremonyISO } from '../data/wedding';

function TimeUnit({ value, label }) {
	return (
		<div className="flex flex-col items-center px-2.5 sm:px-7">
			<div className="text-[2rem] sm:text-4xl md:text-5xl font-serif italic text-lb-dark tabular-nums">
				{String(value).padStart(2, '0')}
			</div>
			<div className="h-px w-8 bg-lb-champagne/40 my-2.5" />
			<div className="text-[9px] md:text-[10px] text-lb-gold/70 uppercase tracking-[0.3em]">
				{label}
			</div>
		</div>
	);
}

function calc() {
	const distance = new Date(ceremonyISO).getTime() - Date.now();
	if (distance <= 0) return null;
	return {
		days: Math.floor(distance / 86400000),
		hours: Math.floor((distance / 3600000) % 24),
		minutes: Math.floor((distance / 60000) % 60),
		seconds: Math.floor((distance / 1000) % 60),
	};
}

export default function Countdown() {
	const [timeLeft, setTimeLeft] = useState(calc);

	useEffect(() => {
		const timer = setInterval(() => setTimeLeft(calc()), 1000);
		return () => clearInterval(timer);
	}, []);

	return (
		<section
			id="countdown"
			className="py-14 md:py-16 px-4 bg-lb-cream border-b border-lb-soft/60"
		>
			<motion.div
				className="max-w-4xl mx-auto text-center"
				initial={{ opacity: 0, y: 12 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7 }}
				viewport={{ once: true }}
			>
				<p className="lb-eyebrow mb-7">
					{timeLeft ? 'Do naszego „Tak” pozostało' : 'Ten dzień właśnie nadszedł'}
				</p>

				{timeLeft ? (
					<div className="flex justify-center items-center">
						<TimeUnit value={timeLeft.days} label="Dni" />
						<Diamond opacity={0.4} className="mb-5" />
						<TimeUnit value={timeLeft.hours} label="Godzin" />
						<Diamond opacity={0.4} className="mb-5" />
						<TimeUnit value={timeLeft.minutes} label="Minut" />
						<Diamond opacity={0.4} className="mb-5" />
						<TimeUnit value={timeLeft.seconds} label="Sekund" />
					</div>
				) : (
					<p className="font-serif italic text-3xl md:text-4xl text-lb-dark">
						Świętujemy razem!
					</p>
				)}
			</motion.div>
		</section>
	);
}
