import { motion } from 'framer-motion';
import { Diamond } from './Ornaments';
import { dressCodes } from '../data/wedding';

function DressCard({ code, index }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 28 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.12, duration: 0.6 }}
			viewport={{ once: true }}
			className="group bg-lb-cream border border-lb-soft/60 p-8 md:p-10 shadow-lb-softer hover:shadow-lb-elegant transition-shadow duration-500"
		>
			<p className="lb-eyebrow mb-4">{code.day}</p>
			<h3 className="font-serif italic text-2xl md:text-3xl text-lb-dark mb-4">
				{code.title}
			</h3>
			<div className="flex items-center gap-3 mb-6">
				<span className="h-px w-8 bg-lb-champagne/40" />
				<Diamond size={6} opacity={0.5} />
			</div>
			<p className="text-lb-text/65 font-light leading-relaxed mb-7">{code.intro}</p>

			<div className="space-y-4 mb-8">
				{code.lines.map((line, i) => (
					<div key={i} className="flex gap-3">
						<span className="text-[10px] uppercase tracking-[0.2em] text-lb-champagne font-semibold w-24 flex-shrink-0 pt-1">
							{line.label}
						</span>
						<span className="text-lb-text/75 text-sm md:text-base font-light">
							{line.text}
						</span>
					</div>
				))}
			</div>

			{/* Paleta kolorów */}
			<div>
				<p className="text-[9px] uppercase tracking-[0.3em] text-lb-text/40 mb-3">
					Paleta
				</p>
				<div className="flex gap-2">
					{code.palette.map((c) => (
						<span
							key={c}
							className="w-9 h-9 rounded-full border border-lb-soft/70 transition-transform duration-300 group-hover:scale-105"
							style={{ background: c }}
							title={c}
						/>
					))}
				</div>
			</div>
		</motion.div>
	);
}

export default function DressCode() {
	return (
		<section id="dresscode" className="py-24 px-4 bg-lb-warm-cream">
			<div className="max-w-5xl mx-auto">
				<motion.div
					className="text-center mb-16"
					initial={{ opacity: 0, y: -18 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					viewport={{ once: true }}
				>
					<p className="lb-eyebrow mb-3">Co założyć</p>
					<h2 className="text-4xl md:text-5xl font-serif italic text-lb-dark mb-5">
						Dress Code
					</h2>
					<div className="flex items-center justify-center gap-3">
						<span className="h-px w-16 bg-lb-champagne/40" />
						<Diamond opacity={0.5} />
						<span className="h-px w-16 bg-lb-champagne/40" />
					</div>
					<p className="text-lb-text/50 text-sm font-light mt-5 max-w-lg mx-auto">
						Dwa dni, dwa nastroje. Poniżej podpowiedzi, jak dopełnić klimat każdego z nich.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
					{dressCodes.map((code, i) => (
						<DressCard key={code.key} code={code} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
