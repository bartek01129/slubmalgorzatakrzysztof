import { motion } from 'framer-motion';
import { Diamond } from './Ornaments';
import { locations } from '../data/wedding';

export default function Map() {
	return (
		<section id="map" className="py-24 px-4 bg-lb-cream">
			<div className="max-w-6xl mx-auto">
				<motion.div
					className="text-center mb-16"
					initial={{ opacity: 0, y: -18 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					viewport={{ once: true }}
				>
					<p className="lb-eyebrow mb-3">Miejsce ceremonii i poprawin</p>
					<h2 className="text-4xl md:text-5xl font-serif italic text-lb-dark mb-5">
						Jak do nas trafić
					</h2>
					<div className="flex items-center justify-center gap-3">
						<span className="h-px w-16 bg-lb-champagne/40" />
						<Diamond opacity={0.5} />
						<span className="h-px w-16 bg-lb-champagne/40" />
					</div>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
					{locations.map((loc) => (
						<motion.div
							key={loc.key}
							initial={{ opacity: 0, x: loc.animateX }}
							whileInView={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.7 }}
							viewport={{ once: true }}
							className="space-y-4"
						>
							<p className="lb-eyebrow">{loc.label}</p>
							<h3 className="text-2xl font-serif italic text-lb-dark">{loc.title}</h3>

							<div className="overflow-hidden shadow-lb-elegant h-80 md:h-96 border border-lb-soft/50">
								<iframe
									src={loc.embedSrc}
									width="100%"
									height="100%"
									style={{ border: 0 }}
									allowFullScreen
									loading="lazy"
									referrerPolicy="no-referrer-when-downgrade"
									title={loc.iframeTitle}
								/>
							</div>

							<div
								className="bg-white p-6 shadow-lb-softer"
								style={{ borderLeft: '3px solid #C4A96D' }}
							>
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
									<div>
										<p className="text-lb-text font-medium mb-1">{loc.address}</p>
										<p className="text-[10px] uppercase tracking-[0.2em] text-lb-champagne mt-2">
											{loc.time}
										</p>
									</div>
									<a
										href={loc.mapsUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-lb-dark text-lb-cream text-xs font-semibold uppercase tracking-[0.12em] hover:bg-lb-champagne transition-all shadow-lb-soft whitespace-nowrap"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										Nawiguj
									</a>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
