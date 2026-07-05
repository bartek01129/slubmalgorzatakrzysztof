import { motion } from 'framer-motion';
import { ArtDecoRule } from './Ornaments';
import { texts, couple, dates, place } from '../data/wedding';

export default function Podziekowanie() {
	return (
		<section id="podziekowanie" className="relative py-28 md:py-36 px-4 bg-lb-dark text-lb-cream overflow-hidden">
			<div
				className="absolute inset-0"
				style={{
					background:
						'radial-gradient(120% 80% at 50% 0%, rgba(196,169,109,0.28), transparent 60%)',
				}}
			/>

			<motion.div
				className="relative max-w-3xl mx-auto text-center"
				initial={{ opacity: 0, y: 24 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
				viewport={{ once: true }}
			>
				<ArtDecoRule className="text-lb-champagne/60 mx-auto mb-9" />
				<p className="text-[10px] uppercase tracking-[0.5em] text-lb-champagne/70 mb-7">
					Dziękujemy
				</p>
				<p className="font-serif italic text-2xl md:text-3xl leading-relaxed text-lb-cream/90 max-w-2xl mx-auto">
					{texts.thanks}
				</p>

				<div className="mt-12 mb-2 font-serif italic text-4xl md:text-5xl text-lb-cream">
					{couple.combined}
				</div>
				<p className="text-[11px] uppercase tracking-[0.4em] text-lb-champagne/70">
					{dates.wedding.display} · {place.region}
				</p>

				<ArtDecoRule className="text-lb-champagne/40 mx-auto mt-10 rotate-180" />
			</motion.div>
		</section>
	);
}
