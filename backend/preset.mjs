import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
});

const WANT_TAG = process.env.GALLERY_TAG || 'mk2026';

// 1) Wypisz wszystkie presety + ich obecne tagi/unsigned
const list = await cloudinary.api.upload_presets({ max_results: 50 });
console.log('=== Presety na koncie ===');
for (const p of list.presets) {
	console.log(
		`- name="${p.name}"  unsigned=${p.unsigned}  tags=${JSON.stringify(
			p.settings?.tags ?? null,
		)}`,
	);
}
console.log('');

// 2) Zaktualizuj preset o nazwie = VITE preset (mk2026) → tags = mk2026
const target = process.env.PRESET_NAME || 'mk2026';
try {
	const before = await cloudinary.api.upload_preset(target);
	console.log(`PRZED: "${target}" tags =`, JSON.stringify(before.settings?.tags ?? null));

	const upd = await cloudinary.api.update_upload_preset(target, { tags: WANT_TAG });
	console.log('update_upload_preset →', upd.message || 'ok');

	const after = await cloudinary.api.upload_preset(target);
	console.log(`PO:    "${target}" tags =`, JSON.stringify(after.settings?.tags ?? null));
	console.log(`       unsigned = ${after.unsigned}`);
} catch (e) {
	console.log('Błąd przy presecie "' + target + '":', e.error?.message || e.message);
}
