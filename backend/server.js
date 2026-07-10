import express from 'express';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GALLERY_TAG = process.env.GALLERY_TAG || 'mk2026';
const CACHE_TTL_MS = 25_000; // 25 s — chroni limit Cloudinary API i zbija ruch wielu gości

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
});

// Jedyne źródło prawdy to Cloudinary. Backend tylko listuje (Search API) i cache'uje.
let cache = { at: 0, data: [] };

async function fetchFromCloudinary() {
	const collected = [];
	let cursor;
	do {
		let q = cloudinary.search
			.expression(`tags=${GALLERY_TAG} AND resource_type:image`)
			.sort_by('created_at', 'desc')
			.max_results(500);
		if (cursor) q = q.next_cursor(cursor);
		const res = await q.execute();
		collected.push(...res.resources);
		cursor = res.next_cursor;
	} while (cursor);

	return collected.map((r) => ({
		id: r.public_id,
		url: r.secure_url,
		public_id: r.public_id,
		created_at: r.created_at,
	}));
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ——— GALERIA — lista zdjęć z Cloudinary (cache 25 s, paginacja next_cursor) ———
app.get('/api/photos', async (req, res) => {
	try {
		const now = Date.now();
		if (now - cache.at > CACHE_TTL_MS) {
			cache = { at: now, data: await fetchFromCloudinary() };
		}
		// Bez cache przeglądarki — świeżość ma zapewnić poll; obciążenie Cloudinary
		// chroni już nasz 25 s cache w pamięci (wyżej).
		res.set('Cache-Control', 'no-store');
		res.json(cache.data);
	} catch (err) {
		console.error('Cloudinary list error:', err);
		// Odporność: jeśli mamy stare dane w cache — oddaj je zamiast błędu.
		if (cache.data.length) return res.json(cache.data);
		res.status(500).json({ error: 'Nie udało się pobrać galerii.' });
	}
});

app.listen(PORT, () =>
	console.log(`Wedding backend on port ${PORT} (tag: ${GALLERY_TAG})`),
);
