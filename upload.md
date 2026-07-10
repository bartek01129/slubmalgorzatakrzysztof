# UPLOAD — galeria zdjęć: audyt + docelowa architektura + plan wdrożenia

> **Po co ten plik:** źródło pamięci po „compact". Zawiera pełną decyzję architektoniczną,
> listę realnych błędów obecnej logiki oraz gotowy do wykonania plan (z kodem).
> **Wykonawca po compact:** przeczytaj całość, potem realizuj sekcję „PLAN WDROŻENIA" krok po kroku.

---

## 0. Kontekst (stan na moment pisania)

- Projekt: `slubmalgorzatakrzysztof` (React/Vite + Express). Strona ślubna Małgorzata & Krzysztof, 19–20.10.2026, Teneryfa.
- **Cel docelowy deployu:** **własny VPS** (Docker + Traefik, CI w `.github/workflows/publish.yml`), **własna domena** (do kupienia). NIE Vercel docelowo.
- Zdjęcia: **Cloudinary** (darmowy plan), upload unsigned prosto z przeglądarki.
- Wymóg klienta: **nie płacić za magazyn zdjęć** + galeria ma działać **idealnie** (realtime, bez cichych porażek).
- Cloudinary aktualnie w `.env` (frontend): `VITE_CLOUDINARY_CLOUD_NAME=duvtdsdmp`, `VITE_CLOUDINARY_UPLOAD_PRESET=wedding_preset` — **to konto/preset ze STAREGO projektu (Paulina & Bartek)**. Do rozważenia osobne konto (patrz sekcja 8).

### Pliki, których dotyczy zmiana
- `backend/server.js` — rewrite (usuń DB, dodaj proxy do Cloudinary).
- `backend/package.json` — usuń `mysql2`, dodaj `cloudinary`.
- `backend/.env` / `.env.example` — usuń `DB_URL`, dodaj `CLOUDINARY_*` + `GALLERY_TAG`.
- `frontend/src/components/page/PhotoBooth.jsx` — rewrite logiki uploadu.
- `frontend/.env` — dodaj `VITE_GALLERY_TAG` (musi = `GALLERY_TAG` w backendzie).
- `docker-compose-prod.yml` — env: `DB_URL` → `CLOUDINARY_*` + `GALLERY_TAG`.
- `.github/workflows/publish.yml` — deploy: eksport `CLOUDINARY_*` zamiast `DB_URL`.
- Cloudinary dashboard — hardening presetu (robi CZŁOWIEK, sekcja 6).

---

## 1. WERDYKT: baza danych jest NIEPOTRZEBNA (usunąć)

Tabela `photos` trzyma `url` + `public_id` + `created_at`. **Każdą z tych informacji Cloudinary już przechowuje** i oddaje przez Admin/Search API (`secure_url`, `public_id`, `created_at`). Baza to kopia metadanych, których jedynym źródłem prawdy jest Cloudinary.

Dlaczego to szkodzi (nie tylko „można usunąć"):
- **Dwa źródła prawdy** → mogą się rozjechać (plik jest, wpisu w DB brak = niewidoczny; wpis jest, plik skasowany = martwy kafelek).
- **Dodatkowy punkt awarii** → DB pada = galeria pada, choć pliki całe w Cloudinary.
- **Więcej do utrzymania/zabezpieczenia** (connection string, pula, backup) po nic.
- Koszt to drugorzędny argument — nawet lokalny SQLite byłby darmowy. Główny argument: **redundancja + kruchość.**

**Backend zostaje** (i tak jest VPS), ale jako **cienki, cache'owany proxy do Cloudinary**, nie właściciel listy.
- `GET /api/photos` → backend pyta Cloudinary Search API (sekret po stronie serwera), cache 20–30 s w pamięci, zwraca listę. Realtime.
- `POST /api/photos` → **usunąć w całości.** Upload leci przeglądarka→Cloudinary; backend nie ma czego zapisywać.

Kiedy DB miałaby sens (NIE teraz — YAGNI): podpisy pod zdjęciami, polubienia, imiona autorów, moderacja z historią. Gdy przyjdzie taki wymóg → SQLite na VPS w 20 min. Dziś: galeria = wspólny strumień zdjęć, DB zbędna.

---

## 2. Surowy audyt OBECNEJ logiki uploadu (co jest źle)

Plik `frontend/src/components/page/PhotoBooth.jsx`, funkcja `handleUpload` + backend `POST /api/photos`.

| # | Defekt | Severity | Opis |
|---|---|---|---|
| 1 | **Tylko 1 plik naraz** | KRYTYCZNY | `e.target.files[0]` + brak `multiple`. Gość zaznacza 20 zdjęć → 19 ignorowanych po cichu. |
| 2 | **Ciche porażki** | KRYTYCZNY | Gdy Cloudinary odrzuci plik, `secure_url` = undefined → nic się nie dzieje, spinner gaśnie, brak komunikatu. Gość myśli, że wgrał. Brak `else` z `cloudData.error?.message`. |
| 3 | **Otwarty preset unsigned bez limitów** | KRYTYCZNY (koszt/nadużycie) | Nazwa presetu jest w bundlu JS. Ktokolwiek może zapchać konto śmieciami/wielkimi plikami. Limity MUSZĄ być w presecie Cloudinary (sekcja 6). |
| 4 | **Brak walidacji rozmiaru/typu po stronie klienta** | WYSOKI | 60 MB z lustrzanki na hotelowym wifi = wieczne oczekiwanie / fail. |
| 5 | **Brak paska postępu** | WYSOKI | `fetch` nie daje progresu uploadu. Duży plik = 20–30 s bez feedbacku → gość myśli, że zawiesiło → klika ponownie / duplikaty. Potrzebny `XMLHttpRequest` (`upload.onprogress`). |
| 6 | **HEIC z iPhone** | ŚREDNI | Oryginalny `secure_url` to `.heic` (przeglądarka nie wyświetli). Ratuje `f_auto` w transformacji — działa, ale przez przypadek. Zasada: ZAWSZE serwować z `f_auto`, nigdy goły `secure_url`. |
| 7 | **Po uploadzie pełny re-fetch** | NISKI | `fetchPhotos()` zamiast dołożyć zdjęcie z odpowiedzi (mamy `secure_url`). Marnotrawstwo + miganie „zniknęło/wróciło". Rozwiązanie: optymistyczne dodanie. |
| 8 | **`POST /api/photos` bez auth** | ŚREDNI | Publiczny endpoint. Na Vercel dodatkowo udaje sukces (dostaje `index.html` 200 → `dbRes.ok` = true, fałszywy pozytyw). Po przejściu na proxy bez DB endpoint znika → problem znika. |

**Podsumowanie:** obecny kod nadaje się na demo dla znajomych, nie dla klienta. #1 i #2 są najgorsze; #3 to realne ryzyko kosztowe.

---

## 3. DOCELOWA architektura (VPS + własna domena)

```
UPLOAD:   telefon ──► Cloudinary  (unsigned, preset z limitami, tag "mk2026")
                          │  (przeglądarka dostaje secure_url + public_id od razu)
                          ▼
                     optymistyczne dodanie do widoku (wgrywający widzi natychmiast)

LISTA:    galeria ──► GET /api/photos ──► backend (Express na VPS)
                                              │  cache 20–30 s w pamięci
                                              ▼
                                         Cloudinary Search API (tags=mk2026, sort created_at desc)
```

- **Realtime:** Search API widzi upload natychmiast; cache tylko chroni limit API i zbija ruch wielu gości do ~1 zapytania na interwał.
- **Bez DB, bez `POST`.** Jedyny stan to Cloudinary.
- **Sekret Cloudinary tylko w backendzie** (env na VPS) — nigdy w bundlu frontendu.
- **Poll co ~30 s** na stronie galerii → goście widzą też nowe zdjęcia innych (nie tylko swoje). Backend cache sprawia, że poll jest tani.

---

## 4. KOD — backend (`backend/server.js`) — pełny rewrite

```js
import express from 'express';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GALLERY_TAG = process.env.GALLERY_TAG || 'mk2026';
const CACHE_TTL_MS = 25_000; // 25 s — chroni limit API i zbija ruch gości

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
});

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

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/photos', async (req, res) => {
	try {
		const now = Date.now();
		if (now - cache.at > CACHE_TTL_MS) {
			cache = { at: now, data: await fetchFromCloudinary() };
		}
		res.set('Cache-Control', 'public, max-age=15');
		res.json(cache.data);
	} catch (err) {
		console.error('Cloudinary list error:', err);
		// Odporność: jeśli mamy stare dane w cache — oddaj je zamiast błędu.
		if (cache.data.length) return res.json(cache.data);
		res.status(500).json({ error: 'Nie udało się pobrać galerii.' });
	}
});

app.listen(PORT, () => console.log(`Wedding backend on port ${PORT} (tag: ${GALLERY_TAG})`));
```

**`backend/package.json`** — usuń `mysql2`, dodaj `cloudinary`:
```json
"dependencies": {
	"cloudinary": "^2.5.1",
	"cors": "^2.8.5",
	"dotenv": "^16.4.5",
	"express": "^4.18.2"
}
```
Po zmianie: `cd backend && npm install` (odświeży `package-lock.json`).

**`backend/.env`** (i `.env.example` z placeholderami):
```dotenv
PORT=3001
FRONTEND_URL=https://TWOJA-DOMENA        # dev: http://localhost:5173
GALLERY_TAG=mk2026

CLOUDINARY_CLOUD_NAME=duvtdsdmp
CLOUDINARY_API_KEY=xxxxxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx   # SEKRET — tylko serwer
```
> API key + secret: Cloudinary → Dashboard → „API Keys". **Secret nigdy do frontendu ani do repo.**

---

## 5. KOD — frontend (`PhotoBooth.jsx`) — nowa logika uploadu

Cele: multi-select, walidacja, pasek postępu (XHR), realne błędy, optymistyczne dodawanie, poll co 30 s, zawsze `f_auto` przy wyświetlaniu.

### 5a. Stałe / helpery (góra pliku)
```js
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const GALLERY_TAG = import.meta.env.VITE_GALLERY_TAG || 'mk2026';
const API_URL = '/api/photos';
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB (musi ≤ limitowi w presecie)

// miniatura / pełny obraz — ZAWSZE przez f_auto (naprawia HEIC)
const thumb = (url) =>
	url.replace('/upload/', '/upload/w_400,h_533,c_fill,g_auto,q_auto:eco,f_auto/');
const full = (url) => url.replace('/upload/', '/upload/q_auto,f_auto/');

function isAcceptable(file) {
	const okType = file.type.startsWith('image/');
	const okHeic = /\.(heic|heif)$/i.test(file.name); // iPhone bywa bez type
	return (okType || okHeic) && file.size <= MAX_BYTES;
}

// Upload jednego pliku z progresem (XHR, bo fetch nie daje upload.onprogress)
function uploadToCloudinary(file, onProgress) {
	return new Promise((resolve, reject) => {
		const fd = new FormData();
		fd.append('file', file);
		fd.append('upload_preset', PRESET);
		fd.append('tags', GALLERY_TAG); // + tag ustawiony też w presecie (belt & suspenders)

		const xhr = new XMLHttpRequest();
		xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress(e.loaded / e.total);
		};
		xhr.onload = () => {
			try {
				const data = JSON.parse(xhr.responseText);
				if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(data);
				else reject(new Error(data?.error?.message || `Błąd uploadu (${xhr.status})`));
			} catch {
				reject(new Error('Błędna odpowiedź Cloudinary'));
			}
		};
		xhr.onerror = () => reject(new Error('Błąd sieci podczas przesyłania'));
		xhr.send(fd);
	});
}
```

### 5b. Stan + obsługa wielu plików (w komponencie)
```js
const [photos, setPhotos] = useState([]);
const [queue, setQueue] = useState([]);       // [{name, progress, status}]
const [errorMsg, setErrorMsg] = useState('');

const fetchPhotos = useCallback(async () => {
	try {
		const res = await fetch(API_URL);
		if (!res.ok) return;
		const data = await res.json();
		// scal z optymistycznymi, dedup po public_id, najnowsze pierwsze
		setPhotos((prev) => {
			const byId = new Map();
			[...data, ...prev].forEach((p) => byId.set(p.public_id, p));
			return [...byId.values()].sort(
				(a, b) => new Date(b.created_at) - new Date(a.created_at),
			);
		});
	} catch { /* cisza — poll spróbuje znowu */ }
}, []);

useEffect(() => {
	fetchPhotos();
	const id = setInterval(fetchPhotos, 30_000); // poll — widać zdjęcia innych
	return () => clearInterval(id);
}, [fetchPhotos]);

const handleFiles = async (fileList) => {
	const files = Array.from(fileList || []);
	if (!files.length) return;
	setErrorMsg('');

	const accepted = files.filter(isAcceptable);
	const rejected = files.length - accepted.length;
	if (rejected > 0)
		setErrorMsg(`Pominięto ${rejected} plik(ów) — dozwolone zdjęcia do 15 MB.`);

	for (const file of accepted) {
		const item = { name: file.name, progress: 0, status: 'uploading' };
		setQueue((q) => [...q, item]);
		try {
			const data = await uploadToCloudinary(file, (p) =>
				setQueue((q) => q.map((it) => (it === item ? { ...it, progress: p } : it))),
			);
			// optymistyczne dodanie — wgrywający widzi od razu
			setPhotos((prev) => {
				if (prev.some((p) => p.public_id === data.public_id)) return prev;
				return [
					{
						id: data.public_id,
						public_id: data.public_id,
						url: data.secure_url,
						created_at: data.created_at || new Date().toISOString(),
					},
					...prev,
				];
			});
			setQueue((q) => q.map((it) => (it === item ? { ...it, status: 'done' } : it)));
		} catch (err) {
			setQueue((q) => q.map((it) => (it === item ? { ...it, status: 'error' } : it)));
			setErrorMsg(err.message || 'Nie udało się przesłać zdjęcia.');
		}
	}
	// posprzątaj zakończone po chwili
	setTimeout(() => setQueue((q) => q.filter((it) => it.status === 'uploading')), 2500);
};
```

### 5c. Zmiany w JSX
- Oba inputy: `onChange={(e) => handleFiles(e.target.files)}`, wyczyść `e.target.value` po starcie.
- Input „z biblioteki": dodaj **`multiple`**. Input „Zrób zdjęcie": zostaje pojedynczy (`capture="environment"`, bez `multiple`).
- Zamiast pojedynczego spinnera „Przesyłanie..." → **lista `queue` z paskiem postępu** na plik (`it.progress * 100`%), stan `done/error`.
- `errorMsg` pokaż jako subtelny komunikat pod panelem (kolor błędu).
- W siatce i lightboxie używaj `thumb(photo.url)` / `full(photo.url)` (helpery wyżej) — **nigdy gołego `photo.url`** (HEIC).
- Usuń całą starą `handleUpload` i odwołania do `POST API_URL`.

> Styl: zachować obecny wygląd art-deco (kremowe tło, szampan, ostre krawędzie). Pasek postępu = cienka linia `bg-lb-champagne`, tło `bg-lb-soft/40`.

**`frontend/.env`** — dodaj:
```dotenv
VITE_GALLERY_TAG=mk2026
```

---

## 6. Cloudinary — HARDENING (robi CZŁOWIEK w dashboardzie; KRYTYCZNE)

Bez tego preset unsigned = otwarta furtka. Settings → Upload → upload preset `wedding_preset` (lub nowy):
1. **Signing Mode: Unsigned** (musi zostać — upload z przeglądarki).
2. **Tags:** `mk2026` (auto-tag każdego uploadu → Search po tagu; nie do podrobienia przez klienta).
3. **Allowed formats:** `jpg, png, webp, heic, heif` (odetnij PDF/SVG/exe itd.).
4. **Max file size:** `15000000` (15 MB) — **musi ≥ `MAX_BYTES` we froncie**, najlepiej równo.
5. **Incoming transformation:** `c_limit,w_2400,h_2400` — cappuje wymiary od razu przy wgrywaniu (chroni storage/transfer).
6. (Opcjonalnie) **Folder:** np. `mk2026/` — porządek w Media Library.
7. (Opcjonalnie) **Moderation:** jeśli chcesz akceptować zdjęcia ręcznie — ale wtedy trzeba filtrować po `moderation_status:approved` w Search (na wesele zwykle zbędne).

Admin API (do listowania) wymaga API key+secret — z Dashboard → API Keys.

---

## 7. Infra — compose / CI / env

**`docker-compose-prod.yml`** (usługa `backend` → sekcja `environment`): zamień
```yaml
- DB_URL=${DB_URL}
```
na
```yaml
- GALLERY_TAG=mk2026
- CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
- CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
- CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
```
(FRONTEND_URL zostaje — ustaw na docelową domenę.)

**`.github/workflows/publish.yml`** (job `deploy`, sekcja `script`): usuń `export DB_URL=...`, dodaj:
```bash
export CLOUDINARY_CLOUD_NAME="${{ secrets.CLOUDINARY_CLOUD_NAME }}"
export CLOUDINARY_API_KEY="${{ secrets.CLOUDINARY_API_KEY }}"
export CLOUDINARY_API_SECRET="${{ secrets.CLOUDINARY_API_SECRET }}"
```
**GitHub Secrets do dodania:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
**Do usunięcia:** `DB_URL` (nieużywane).
Build-args frontendu bez zmian (`VITE_PASSWORD`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`) + dołóż `VITE_GALLERY_TAG` do Dockerfile frontendu (ARG/ENV) i do build-args w CI.

**`frontend/Dockerfile`** — dopisz do ARG/ENV:
```dockerfile
ARG VITE_GALLERY_TAG
ENV VITE_GALLERY_TAG=$VITE_GALLERY_TAG
```
i w CI build-args: `VITE_GALLERY_TAG=${{ secrets.VITE_GALLERY_TAG }}` (albo na sztywno `mk2026`).

**nginx / Traefik:** bez zmian — Traefik dalej routuje `Host && PathPrefix(/api)` do backendu.

---

## 8. Limity, wydajność, koszty (weryfikacja że „idealnie" i za 0 zł)

- **Cloudinary free:** 25 kredytów/mies. (1 kredyt ≈ 1 GB storage / 1 GB transfer / 1000 transformacji). Wesele ~2–4 GB zdjęć + transfer miniatur (`q_auto:eco,f_auto` mocno tnie wagę) → mieścisz się kilkukrotnie.
- **Admin/Search API rate limit (free):** rzędu setek zapytań/godz. Cache 25 s w backendzie sprawia, że **niezależnie od liczby gości** upstream to ~1 zapytanie / 25 s (~144/h) nawet przy pełnym ruchu i pollingu. Bezpiecznie pod limitem.
- **>500 zdjęć:** paginacja `next_cursor` już w kodzie (pętla). Każda strona to +1 zapytanie na odświeżenie cache (raz na 25 s) — dla wesela realnie 1 strona.
- **Realtime:** wgrywający widzi swoje zdjęcie natychmiast (optymistycznie); inni w ≤25 s (poll 30 s + cache). Brak odczuwalnego opóźnienia dla klienta.
- **Koszt razem:** VPS (i tak masz) + Cloudinary free = **0 zł ekstra**. Zero bazy, zero magazynu do opłacania.

### Konto Cloudinary — decyzja do podjęcia
`.env` wskazuje na `duvtdsdmp` / `wedding_preset` — to konto STAREGO projektu. Opcje:
- **Zostaw** — tag `mk2026` odseparuje wesela logicznie (Search po tagu), ale pliki obu wesel są na jednym koncie i jednym limicie.
- **Nowe konto dla klientki (zalecane dla klienta)** — załóż osobne Cloudinary, podmień `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` (front) oraz `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` (back). Czysty limit, czysta własność, łatwe przekazanie klientce.

---

## 9. PLAN WDROŻENIA (kolejność wykonania po compact)

1. **backend/package.json** — usuń `mysql2`, dodaj `cloudinary`; `cd backend && npm install`.
2. **backend/server.js** — wklej rewrite z sekcji 4 (bez DB, Search API + cache).
3. **backend/.env + .env.example** — `DB_URL` → `GALLERY_TAG` + `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`.
4. **frontend/.env** — dodaj `VITE_GALLERY_TAG=mk2026`.
5. **PhotoBooth.jsx** — wymień logikę uploadu na sekcję 5 (multi, XHR progress, walidacja, optymistyczne dodawanie, poll, `thumb/full`). Usuń `POST`.
6. **docker-compose-prod.yml + publish.yml + frontend/Dockerfile** — env/secrets wg sekcji 7.
7. **Cloudinary dashboard** (człowiek) — hardening presetu wg sekcji 6 + pobierz API key/secret.
8. **Weryfikacja** (sekcja 10).
9. (Opcjonalnie) usuń resztki: w repo nie ma już potrzeby na cokolwiek DB-owe; `initDB`, tabela, `mysql2` znikają wraz z rewrite.

---

## 10. Weryfikacja (definicja „działa idealnie")

Lokalnie (dev): backend `npm run dev` z realnym `CLOUDINARY_*` w `backend/.env`; front `npm run dev`.
- [ ] `curl http://localhost:3001/api/photos` → zwraca `[]` lub listę (JSON), nie błąd.
- [ ] Wgranie 1 zdjęcia → pojawia się natychmiast (optymistycznie), pasek postępu dochodzi do 100%.
- [ ] Wgranie **wielu** zdjęć naraz (multi-select) → wszystkie się pojawiają, każde z progresem.
- [ ] Odświeżenie strony → zdjęcia dalej są (bo są w Cloudinary, nie w pamięci przeglądarki).
- [ ] Drugie urządzenie/incognito → widzi te same zdjęcia (≤25–30 s od wgrania).
- [ ] Plik >15 MB / nie-obraz → pomijany z czytelnym komunikatem (nie cisza).
- [ ] Zdjęcie z iPhone (HEIC) → wyświetla się (dzięki `f_auto`).
- [ ] Wyłącz Cloudinary/zły secret → `/api/photos` nie wywala aplikacji (oddaje stary cache lub czysty błąd).
- [ ] `npm run build` (frontend) przechodzi; backend startuje bez `DB_URL`.

## 11. Otwarte decyzje dla właściciela projektu
1. Nowe konto Cloudinary dla klientki czy zostać na `duvtdsdmp`? (sekcja 8)
2. Wielkość `MAX_BYTES` / max w presecie (domyślnie 15 MB) — OK?
3. Czy dopuszczać krótkie **wideo** (osobny zakres: `resource_type:video`, większe limity, inne transformacje)? Domyślnie: tylko zdjęcia.
4. Moderacja zdjęć (ręczna akceptacja) — domyślnie NIE.

---
*Dokument źródłowy do wykonania. Po wdrożeniu można go zaktualizować lub usunąć.*
