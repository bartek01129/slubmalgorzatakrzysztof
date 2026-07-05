import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Baza (MariaDB/MySQL) — pula połączeń
const pool = mysql.createPool(process.env.DB_URL);

async function initDB() {
	const conn = await pool.getConnection();
	try {
		await conn.execute(`
			CREATE TABLE IF NOT EXISTS photos (
				id INT AUTO_INCREMENT PRIMARY KEY,
				url VARCHAR(500) NOT NULL,
				public_id VARCHAR(255),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);
		console.log('Database ready');
	} finally {
		conn.release();
	}
}

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

// ——— GALERIA (Cloudinary → zapis URL w DB) ———
app.get('/api/photos', async (req, res) => {
	try {
		const [rows] = await pool.execute(
			'SELECT id, url, public_id, created_at FROM photos ORDER BY created_at DESC',
		);
		res.json(rows);
	} catch (err) {
		console.error('Photos GET error:', err);
		res.status(500).json({ error: 'Błąd pobierania zdjęć.' });
	}
});

app.post('/api/photos', async (req, res) => {
	const { url, public_id } = req.body;

	if (!url || typeof url !== 'string') {
		return res.status(400).json({ error: 'Brak adresu zdjęcia.' });
	}

	try {
		await pool.execute('INSERT INTO photos (url, public_id) VALUES (?, ?)', [
			url,
			public_id || null,
		]);
		res.status(201).json({ success: true });
	} catch (err) {
		console.error('Photos POST error:', err);
		res.status(500).json({ error: 'Błąd zapisu zdjęcia.' });
	}
});

// Start
initDB()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Wedding backend running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error('DB init failed:', err);
		process.exit(1);
	});
