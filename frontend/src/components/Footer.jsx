import { Link } from 'react-router-dom';
import { DiamondBand } from './Ornaments';
import { couple } from '../data/wedding';

const navLinks = [
	{ name: 'Strona główna', href: '#hero', type: 'anchor' },
	{ name: 'Harmonogram', href: '#agenda', type: 'anchor' },
	{ name: 'Dress code', href: '#dresscode', type: 'anchor' },
	{ name: 'Miejsce', href: '#map', type: 'anchor' },
	{ name: 'Galeria', href: '/galeria', type: 'route' },
];

export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="bg-lb-dark text-lb-cream pt-14 pb-12 px-4 border-t border-lb-champagne/10">
			<div className="max-w-5xl mx-auto">
				<DiamondBand className="mb-12" />

				<nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-12 pb-10 border-b border-lb-cream/5">
					{navLinks.map((link) =>
						link.type === 'route' ? (
							<Link
								key={link.name}
								to={link.href}
								className="text-lb-cream/35 hover:text-lb-champagne transition-colors text-[10px] uppercase tracking-[0.3em]"
							>
								{link.name}
							</Link>
						) : (
							<a
								key={link.name}
								href={link.href}
								className="text-lb-cream/35 hover:text-lb-champagne transition-colors text-[10px] uppercase tracking-[0.3em]"
							>
								{link.name}
							</a>
						),
					)}
				</nav>

				<div className="text-center">
					<h3 className="text-2xl font-serif italic mb-3">{couple.combined}</h3>
					<p className="text-lb-cream/35 text-xs mb-8">
						© {year} {couple.combined}
					</p>
					<a
						href="#hero"
						className="text-lb-champagne/40 hover:text-lb-champagne transition-colors text-[10px] tracking-[0.3em] uppercase"
					>
						Powrót do góry ↑
					</a>
				</div>
			</div>
		</footer>
	);
}
