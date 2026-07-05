import { motion } from 'framer-motion';
import { Divider } from './Ornaments';
import { texts } from '../data/wedding';

export default function Gifts() {
	return (
		<section id="gifts" className="py-20 md:py-24 px-4 bg-lb-cream border-t border-lb-soft/40">
			<motion.div
				className="max-w-3xl mx-auto text-center"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6 }}
				viewport={{ once: true }}
			>
				<Divider className="mb-8" />

				{/* Motyw podróży poślubnej */}
				<div className="flex justify-center mb-6 text-lb-champagne">
					<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M17.5 19H9l-2-4H4.5a1.5 1.5 0 010-3H7l2-4h1.5l-1 4h3l2-2.5h1.5l-1 2.5h3.5a1.5 1.5 0 010 3H17l-1 4z" />
					</svg>
				</div>

				<p className="lb-eyebrow mb-4">Podziękowanie za pamięć</p>
				<h2 className="text-3xl md:text-4xl font-serif italic text-lb-dark mb-6">
					Prezenty
				</h2>
				<p className="text-base md:text-lg text-lb-text/65 leading-relaxed max-w-2xl mx-auto font-light">
					{texts.gifts}
				</p>
			</motion.div>
		</section>
	);
}
