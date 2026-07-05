import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			colors: {
				// Champagne beige · "Modern Bond Elegance"
				'lb-cream': '#FAF6F0', // główne tło (ciepły krem)
				'lb-warm-cream': '#F4ECDF', // cieplejsze tło alternatywne
				'lb-soft': '#DDD4C5', // taupe — subtelne obramowania
				'lb-champagne': '#C4A96D', // wiodący akcent (szampan/złoto)
				'lb-gold': '#A9884C', // głębsze złoto (hover, detale)
				'lb-dark': '#312A22', // ciemne espresso (sekcje, footer, przyciski)
				'lb-text': '#4A4038', // tekst podstawowy (ciepły brąz)
			},
			fontFamily: {
				serif: ['"Playfair Display"', 'Georgia', 'serif'],
				sans: ['Montserrat', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				xs: ['12px', '16px'],
				sm: ['14px', '20px'],
				base: ['16px', '26px'],
				lg: ['18px', '30px'],
				xl: ['20px', '30px'],
				'2xl': ['24px', '34px'],
				'3xl': ['30px', '38px'],
				'4xl': ['36px', '42px'],
				'5xl': ['48px', '52px'],
				'6xl': ['60px', '64px'],
				'7xl': ['72px', '76px'],
				'8xl': ['96px', '1'],
				'9xl': ['128px', '1'],
			},
			boxShadow: {
				'lb-softer': '0 4px 15px rgba(49, 42, 34, 0.06)',
				'lb-soft': '0 10px 30px rgba(49, 42, 34, 0.08)',
				'lb-elegant': '0 22px 55px rgba(49, 42, 34, 0.14)',
			},
			animation: {
				float: 'float 7s ease-in-out infinite',
				'fade-in': 'fadeIn 1.2s ease forwards',
				shimmer: 'shimmer 6s ease-in-out infinite',
			},
			keyframes: {
				float: {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-14px)' },
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				shimmer: {
					'0%, 100%': { opacity: '0.35' },
					'50%': { opacity: '0.9' },
				},
			},
		},
	},
	plugins: [forms],
};
