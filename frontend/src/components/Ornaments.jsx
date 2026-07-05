/**
 * Ornamenty art-deco — wspólne motywy graficzne w stylu "Modern Bond Elegance".
 * Trzymamy je w jednym miejscu, żeby cała strona mówiła jednym językiem wizualnym.
 */

const GOLD = '#C4A96D';

// Pojedynczy romb (diament) — podstawowy element zdobniczy.
export function Diamond({ size = 8, color = GOLD, opacity = 0.6, className = '' }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 8 8"
			fill="none"
			className={className}
			aria-hidden="true"
		>
			<path d="M4 0L8 4L4 8L0 4Z" fill={color} opacity={opacity} />
		</svg>
	);
}

// Separator: cienka linia — romb — cienka linia.
export function Divider({ width = 'w-16', tone = 'champagne', className = '' }) {
	const line =
		tone === 'light' ? 'bg-white/40' : 'bg-lb-champagne/40';
	return (
		<div className={`flex items-center justify-center gap-4 ${className}`}>
			<span className={`h-px ${width} ${line}`} />
			<Diamond opacity={0.55} />
			<span className={`h-px ${width} ${line}`} />
		</div>
	);
}

// Rozbudowany ornament z rombem centralnym i cyzelowanymi liniami (Hero, sekcje główne).
export function ArtDecoRule({ className = '' }) {
	return (
		<svg
			className={className}
			width="200"
			height="24"
			viewBox="0 0 200 24"
			fill="none"
			aria-hidden="true"
		>
			<path d="M100 2L109 12L100 22L91 12Z" stroke="currentColor" strokeWidth="0.8" opacity="0.55" />
			<path d="M100 6.5L104.5 12L100 17.5L95.5 12Z" fill="currentColor" opacity="0.22" />
			<line x1="14" y1="12" x2="86" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.32" />
			<path d="M36 8L40 12L36 16" stroke="currentColor" strokeWidth="0.5" opacity="0.28" fill="none" />
			<path d="M56 9L59 12L56 15" stroke="currentColor" strokeWidth="0.5" opacity="0.2" fill="none" />
			<circle cx="14" cy="12" r="1.2" fill="currentColor" opacity="0.4" />
			<line x1="114" y1="12" x2="186" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.32" />
			<path d="M164 8L160 12L164 16" stroke="currentColor" strokeWidth="0.5" opacity="0.28" fill="none" />
			<path d="M144 9L141 12L144 15" stroke="currentColor" strokeWidth="0.5" opacity="0.2" fill="none" />
			<circle cx="186" cy="12" r="1.2" fill="currentColor" opacity="0.4" />
		</svg>
	);
}

// Pasek pięciu rombów rosnących ku środkowi (stopka, akcenty).
export function DiamondBand({ className = '' }) {
	return (
		<div className={`flex items-center justify-center gap-2 ${className}`}>
			<Diamond size={4} opacity={0.3} />
			<Diamond size={6} opacity={0.5} />
			<Diamond size={8} opacity={0.65} />
			<Diamond size={6} opacity={0.5} />
			<Diamond size={4} opacity={0.3} />
		</div>
	);
}

// Delikatna diagonalna tekstura art-deco (dla ciemnych paneli).
export function decoWeaveStyle(opacity = 0.05) {
	return {
		backgroundImage: `repeating-linear-gradient(45deg, ${GOLD} 0, ${GOLD} 1px, transparent 0, transparent 46px), repeating-linear-gradient(-45deg, ${GOLD} 0, ${GOLD} 1px, transparent 0, transparent 46px)`,
		opacity,
	};
}
