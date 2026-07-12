import express from 'express';
import cors from 'cors';
import path from 'node:path';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import * as store from './store.js';
import { UUID_RE } from './store.js';
import * as images from './images.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const DATA_DIR = process.env.DATA_DIR || '/data/photos';
const MAX_PHOTOS = Number(process.env.MAX_PHOTOS || 1000);
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 15);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const dirs = {
	originals: path.join(DATA_DIR, 'originals'),
	web: path.join(DATA_DIR, 'web'),
	thumbs: path.join(DATA_DIR, 'thumbs'),
	tmp: path.join(DATA_DIR, 'tmp'),
};

// Rekord indeksu → obiekt zdjęcia w kształcie z kontraktu (front zależy od tych pól).
function toPhoto(rec) {
	return {
		id: rec.id,
		public_id: rec.id,
		thumb_url: `/photos/thumbs/${rec.id}.webp`,
		web_url: `/photos/web/${rec.id}.webp`,
		url: `/photos/web/${rec.id}.webp`,
		created_at: rec.created_at,
	};
}

function tokenMatches(provided) {
	const a = Buffer.from(provided);
	const b = Buffer.from(ADMIN_TOKEN);
	// timingSafeEqual wymaga równych długości; różna długość = na pewno inny token.
	if (a.length !== b.length) return false;
	return crypto.timingSafeEqual(a, b);
}

const app = express();

// Za Traefikiem prawdziwe IP jest w X-Forwarded-For. Bez tego rate limit widziałby
// jedno IP proxy i po 30 przesłaniach zablokowałby wszystkich gości naraz.
app.set('trust proxy', 1);

app.use(cors({ origin: FRONTEND_URL }));

// Statyka: pliki mają nazwy UUID i nigdy się nie zmieniają → cache immutable na rok.
// originals/ NIGDY nie montujemy. fallthrough:false → brak pliku daje 404 od razu.
const staticOpts = { immutable: true, maxAge: '365d', index: false, fallthrough: false };
app.use('/photos/web', express.static(dirs.web, staticOpts));
app.use('/photos/thumbs', express.static(dirs.thumbs, staticOpts));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Lista zdjęć prosto z indeksu w pamięci; świeżość zapewnia poll frontu (no-store).
app.get('/api/photos', (req, res) => {
	res.set('Cache-Control', 'no-store');
	res.json(store.getAll().map(toPhoto));
});

// Rate limit TYLKO na upload: 30 przesłań / 10 min / IP. Kontraktowy JSON dla 429.
const uploadLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	limit: 30,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) =>
		res.status(429).json({ error: 'Za dużo przesłań, spróbuj za chwilę.' }),
});

const upload = images.createUpload(dirs, MAX_UPLOAD_BYTES);

app.post('/api/photos', uploadLimiter, (req, res) => {
	upload.single('file')(req, res, async (err) => {
		if (err) {
			// Multer domyślnie daje 500 na przekroczenie limitu — tłumaczymy na 413.
			if (err.code === 'LIMIT_FILE_SIZE') {
				return res
					.status(413)
					.json({ error: `Plik za duży (max ${MAX_UPLOAD_MB} MB).` });
			}
			return res.status(500).json({ error: 'Błąd przesyłania pliku.' });
		}
		if (!req.file) return res.status(400).json({ error: 'To nie jest obraz.' });

		// Szybka wczesna odmowa: przy pełnej galerii nie marnujemy CPU na sharpa.
		// (Ostateczny, wolny od race check jest w sekcji krytycznej store.insert.)
		if (store.count() >= MAX_PHOTOS) {
			await images.safeUnlink(req.file.path);
			return res
				.status(409)
				.json({ error: 'Galeria jest pełna.', code: 'GALLERY_FULL' });
		}

		let rec;
		let inserted = false;
		try {
			rec = await images.processUpload(req.file.path, dirs);
			const result = await store.insert(rec);
			inserted = result.ok;
			if (!result.ok) {
				// Limit dobity w sekcji krytycznej → wycofujemy wygenerowane pliki.
				await images.removeFiles(rec.id, rec.original_ext, dirs);
				return res
					.status(409)
					.json({ error: 'Galeria jest pełna.', code: 'GALLERY_FULL' });
			}
			return res.status(201).json(toPhoto(rec));
		} catch (e) {
			// Jeśli pliki zdążyły powstać, a zdjęcie NIE weszło do indeksu
			// (np. padł zapis photos.json) — sprzątamy, żeby na wolumenie
			// nie zostawały sieroty niewidoczne w galerii.
			if (rec && !inserted) await images.removeFiles(rec.id, rec.original_ext, dirs);
			if (e.code === 'NOT_IMAGE') {
				return res.status(400).json({ error: 'To nie jest obraz.' });
			}
			console.error('Upload error:', e);
			return res.status(500).json({ error: 'Nie udało się zapisać zdjęcia.' });
		}
	});
});

app.delete('/api/photos/:id', async (req, res) => {
	// Brak skonfigurowanego tokenu = admin wyłączony → nikt nie kasuje.
	if (!ADMIN_TOKEN || !tokenMatches(req.get('X-Admin-Token') || '')) {
		return res.status(401).json({ error: 'Brak autoryzacji.' });
	}

	const { id } = req.params;
	// Walidacja UUID zanim id trafi do ścieżki pliku (path traversal).
	if (!UUID_RE.test(id)) return res.status(404).json({ error: 'Nie znaleziono zdjęcia.' });

	const rec = await store.remove(id);
	if (!rec) return res.status(404).json({ error: 'Nie znaleziono zdjęcia.' });

	// Pliki kasujemy po usunięciu wpisu — indeks jest źródłem prawdy dla listy.
	await images.removeFiles(id, rec.original_ext, dirs);
	return res.status(204).end();
});

async function main() {
	images.initSharp();
	const loaded = await store.init({ dataDir: DATA_DIR, dirs, maxPhotos: MAX_PHOTOS });
	app.listen(PORT, () =>
		console.log(`Wedding backend on port ${PORT} (DATA_DIR: ${DATA_DIR}, zdjęć: ${loaded})`),
	);
}

main().catch((err) => {
	console.error('Boot error:', err);
	process.exit(1);
});
