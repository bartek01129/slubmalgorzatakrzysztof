/**
 * Jedno źródło prawdy dla treści strony ślubnej.
 * Zmieniając parę / daty / miejsca — edytujesz wyłącznie ten plik.
 */

export const couple = {
	bride: 'Małgorzata',
	groom: 'Krzysztof',
	combined: 'Małgorzata & Krzysztof',
	initials: 'M & K',
};

// Moment ceremonii (do odliczania). Godziny są lokalne (czas Teneryfy).
export const ceremonyISO = '2026-10-19T17:00:00';

export const dates = {
	wedding: { display: '19 Października 2026', weekday: 'Poniedziałek' },
	afterParty: { display: '20 Października 2026', weekday: 'Wtorek' },
};

export const place = {
	region: 'Adeje',
	country: 'Hiszpania',
};

// ——— HARMONOGRAM (dwa dni) ———
// isTransfer: true → punkt oznaczony jako transfer/autobus (klientka o to prosiła).
export const timelineWedding = [
	{ time: '16:00', title: 'Odbiór gości z hotelu', isTransfer: true },
	{ time: '16:30', title: 'Przyjazd gości' },
	{ time: '17:00', title: 'Ceremonia ślubna', highlight: true },
	{ time: '17:30', title: 'Zakończenie ceremonii · życzenia i szampan' },
	{ time: '18:00', title: 'Koktajl na tarasie', note: 'do 19:15' },
	{ time: '19:25', title: 'Wejście Pary Młodej przy basenie · przemówienia' },
	{ time: '19:45', title: 'Rozpoczęcie kolacji' },
	{ time: '22:15', title: 'Tort' },
	{ time: '22:30', title: 'Przejście do Jazz Clubu' },
	{ time: '22:40', title: 'Wesele', note: 'do 04:00' },
	{ time: '04:00', title: 'Odbiór gości i powrót do hotelu', isTransfer: true },
];

export const timelineAfterParty = [
	{
		time: '15:00',
		title: 'Autobus odbiera gości z hotelu i przewozi do willi',
		isTransfer: true,
	},
	{
		time: '15:30',
		title: 'Rozpoczęcie poprawin',
		note: 'relaks przy basenie, muzyka, jedzenie i napoje',
		highlight: true,
	},
	{ time: '15:30', title: 'Impreza', note: 'do 23:00' },
	{
		time: '23:00',
		title: 'Zakończenie poprawin · autobus powrotny do hotelu',
		isTransfer: true,
	},
];

// ——— MIEJSCA ———
const encode = (q) => encodeURIComponent(q);
const embed = (q) =>
	`https://maps.google.com/maps?q=${encode(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
const search = (q) =>
	`https://www.google.com/maps/search/?api=1&query=${encode(q)}`;

const ceremonyQuery =
	'Calle Roque Nublo 1, 38660 Adeje, Santa Cruz de Tenerife, Hiszpania';
const afterQuery =
	'Calle El Horno 17, 38678 Playa Paraíso, Adeje, Santa Cruz de Tenerife, Hiszpania';

export const locations = [
	{
		key: 'ceremony',
		label: 'Dzień I · Ślub',
		title: 'Ceremonia i Wesele',
		address: 'Calle Roque Nublo 1, 38660 Adeje',
		time: 'Ceremonia · 17:00, 19 października',
		embedSrc: embed(ceremonyQuery),
		mapsUrl: search(ceremonyQuery),
		iframeTitle: 'Mapa — miejsce ceremonii, Adeje',
		animateX: -30,
	},
	{
		key: 'afterparty',
		label: 'Dzień II · Poprawiny',
		title: 'Poprawiny przy basenie',
		address: 'Calle El Horno 17, 38678 Playa Paraíso, Adeje',
		time: 'Start · 15:30, 20 października',
		embedSrc: embed(afterQuery),
		mapsUrl: search(afterQuery),
		iframeTitle: 'Mapa — poprawiny, Playa Paraíso',
		animateX: 30,
	},
];

// ——— DRESS CODE ———
export const dressCodes = [
	{
		key: 'wedding',
		day: 'Dzień I · Ślub',
		title: 'Modern Bond Elegance',
		intro:
			'Inspiracją jest klasyczna elegancja w stylu Jamesa Bonda — ponadczasowy szyk i wieczorowy sznyt.',
		lines: [
			{
				label: 'Panowie',
				text: 'Smokingi oraz ciemne, dobrze skrojone garnitury.',
			},
			{
				label: 'Panie',
				text: 'Jasne, eleganckie suknie wieczorowe w odcieniach champagne, beżu, pudrowego różu, srebra i pastelach.',
			},
		],
		palette: ['#EDE3D0', '#C4A96D', '#E7C9CE', '#C9CDD2', '#312A22'],
	},
	{
		key: 'afterparty',
		day: 'Dzień II · Poprawiny',
		title: 'Boho nad basenem',
		intro:
			'Luźniejszy, słoneczny klimat — impreza toczy się przy basenie, więc postawcie na swobodę i wygodę.',
		lines: [
			{
				label: 'Styl',
				text: 'Boho: przewiewne tkaniny, naturalne tony, lekkość i komfort.',
			},
			{
				label: 'Pamiętajcie',
				text: 'Zabierzcie stroje kąpielowe — basen czeka!',
			},
		],
		palette: ['#EBE0CE', '#D8C4A0', '#B9A17A', '#8C9B86', '#6E5A43'],
	},
];

// ——— TEKSTY ———
export const texts = {
	welcome:
		'Z ogromną radością zapraszamy Was do wspólnego świętowania naszego ślubu — na słonecznej Teneryfie, wśród oceanu, palm i zachwycających zachodów słońca. Na tej stronie znajdziecie wszystko, co najważniejsze: harmonogram obu dni, informacje o transferach, dress code oraz miejsce ceremonii.',
	gifts:
		'Największym prezentem będzie Wasza obecność w tym wyjątkowym dniu. Jeśli jednak chcielibyście obdarować nas upominkiem, zamiast kwiatów i prezentów prosimy o cegiełkę na spełnienie naszego marzenia o podróży poślubnej.',
	thanks:
		'Dziękujemy, że jesteście częścią naszej historii. To, że pokonacie z nami setki kilometrów, aby świętować tę chwilę, znaczy dla nas więcej, niż potrafią wyrazić słowa. Do zobaczenia na Teneryfie.',
};
