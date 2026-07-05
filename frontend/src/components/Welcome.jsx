import { motion } from 'framer-motion';
import { Divider } from './Ornaments';
import { texts, couple } from '../data/wedding';

export default function Welcome() {
	return (
		<section id="welcome" className="py-20 md:py-28 px-4 bg-lb-cream">
			<motion.div
				className="max-w-3xl mx-auto text-center"
				initial={{ opacity: 0, y: 16 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7 }}
				viewport={{ once: true }}
			>
				<Divider className="mb-9" />
				<p className="lb-eyebrow mb-5">Kilka słów od nas</p>
				<h2 className="text-3xl md:text-5xl font-serif italic text-lb-dark mb-7">
					Drodzy Goście!
				</h2>
				<p className="text-base md:text-lg text-lb-text/70 leading-relaxed font-light max-w-2xl mx-auto">
					{texts.welcome}
				</p>
				<p className="mt-8 font-serif italic text-xl md:text-2xl text-lb-champagne">
					{couple.combined}
				</p>
			</motion.div>
		</section>
	);
}
