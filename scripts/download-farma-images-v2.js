/**
 * Descarga el lote final de imágenes con URLs verificadas
 * Corre: node scripts/download-farma-images-v2.js
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "public", "farma");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// URLs verificadas por scraping directo de las páginas de producto
const IMAGES = [
  // ── Earth's Creation (subagente confirmó /2023/07/) ────────────────────
  { file: "ec-7keto-25.jpg",        url: "https://elnegro.com.py/wp-content/uploads/2023/07/earths-creation-7-keto-dhea-25-mg-x-60-caps.jpg" },
  { file: "ec-7keto-50.jpg",        url: "https://elnegro.com.py/wp-content/uploads/2023/07/earths-creation-7-keto-dhea-50-mg-x-60-caps.jpg" },
  { file: "ec-androt.jpg",          url: "https://elnegro.com.py/wp-content/uploads/2023/07/earths-creation-andro-t-x-60-caps.jpg" },
  { file: "ec-artichoke.jpg",       url: "https://elnegro.com.py/wp-content/uploads/2023/07/earths-creation-artichoke-500-mg-x-60-caps.jpg" },
  { file: "ec-ashwagandha.jpg",     url: "https://elnegro.com.py/wp-content/uploads/2023/07/earths-creation-ashwagandha-470-mg-x-60-caps.jpg" },
  { file: "ec-ashwagandha-gummy.jpg", url: "https://elnegro.com.py/wp-content/uploads/2023/07/earths-creation-artichoke-gummy-x-60.jpg" },
  { file: "ec-b12.jpg",             url: "https://elnegro.com.py/wp-content/uploads/2023/07/earths-creation-b12-1000mcg-x-60-caps.jpg" },
  { file: "ec-biotin.jpg",          url: "https://elnegro.com.py/wp-content/uploads/2023/07/earths-creation-biotin-10-mg-x-100-caps.jpg" },

  // ── Evodia ─────────────────────────────────────────────────────────────
  { file: "evodia-oregano.jpg",     url: "https://elnegro.com.py/wp-content/uploads/2023/07/evodia-oregano-oil-x-60-softgel.jpg" },
  { file: "evodia-omega.jpg",       url: "https://elnegro.com.py/wp-content/uploads/2023/07/evodia-omega-980-mg-x-30-caps.jpg" },
  { file: "evodia-lady.jpg",        url: "https://elnegro.com.py/wp-content/uploads/2023/07/evodia-lady-complex-x-30-caps.jpg" },
  { file: "evodia-granagard.jpg",   url: "https://elnegro.com.py/wp-content/uploads/2023/07/evodia-granagard-x-60-caps.jpg" },
  { file: "evodia-iron.jpg",        url: "https://elnegro.com.py/wp-content/uploads/2023/07/evodia-gentle-iron-complex-x-90-caps.jpg" },

  // ── Desincha & Allways ─────────────────────────────────────────────────
  { file: "desincha-dianoche.jpg",  url: "https://elnegro.com.py/wp-content/uploads/2023/07/desincha-dia-noche-x-60-saquitos.jpg" },
  { file: "allways-cafeina.jpg",    url: "https://elnegro.com.py/wp-content/uploads/2023/07/allways-caffeine-power-550-mg-x-60-caps.jpg" },

  // ── Landerlan Gold (Esteroides) — URLs confirmadas /2022/09/ ───────────
  { file: "landerlan-drostanolona.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_drostanolona-propionato-101-300x280-1.jpg" },

  // Alternativas /2026/06 confirmadas por scraping HTML ──────────────────
  { file: "ec-7keto-25-v2.png",     url: "https://elnegro.com.py/wp-content/uploads/2026/06/Earths-Creation-7-Keto-Dhea-25-Mg-X-60-Caps.png" },
  { file: "ec-7keto-50-v2.png",     url: "https://elnegro.com.py/wp-content/uploads/2026/06/Earths-Creation-7-Keto-Dhea-50-Mg-X-60-Caps.png" },
  { file: "ec-androt-v2.png",       url: "https://elnegro.com.py/wp-content/uploads/2026/06/Earths-Creation-Andro-T-X-60-Caps-1.png" },
  { file: "ec-ashwagandha-v2.png",  url: "https://elnegro.com.py/wp-content/uploads/2026/06/Earthss-Creation-Ashwagandha-470-Mg-X-60-Caps.png" },
  { file: "ec-b12-v2.png",          url: "https://elnegro.com.py/wp-content/uploads/2026/06/Earths-Creation-B12-1000Mcg-X-60-Caps.png" },
  { file: "evodia-oregano-v2.png",  url: "https://elnegro.com.py/wp-content/uploads/2026/07/Evodia-Oregano-Oil-X-60-Softgel.png" },
  { file: "evodia-omega-v2.png",    url: "https://elnegro.com.py/wp-content/uploads/2026/07/Evodia-Omega-980-Mg-X-30-Caps.png" },
  { file: "evodia-lady-v2.png",     url: "https://elnegro.com.py/wp-content/uploads/2026/07/Evodia-Lady-Complex-X-30-Caps-.png" },
  { file: "evodia-granagard-v2.png",url: "https://elnegro.com.py/wp-content/uploads/2026/07/Granagard-.png" },
  { file: "desincha-v2.png",        url: "https://elnegro.com.py/wp-content/uploads/2026/06/Desincha-DiaNoche-X-60-Saquitos.png" },
  { file: "cafeina-v2.png",         url: "https://elnegro.com.py/wp-content/uploads/2025/09/Productos-79.png" },
];

function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest)) {
      const size = fs.statSync(dest).size;
      if (size > 2000) {
        console.log(`  ⏭  Ya existe: ${path.basename(dest)} (${(size/1024).toFixed(0)}KB)`);
        return resolve({ ok: true, skipped: true });
      }
    }
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { timeout: 20000, headers: { "User-Agent": "Mozilla/5.0 RENDIX-POS/2.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        console.log(`  ❌ ${res.statusCode}: ${path.basename(dest)}`);
        return resolve({ ok: false });
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        const size = fs.statSync(dest).size;
        console.log(`  ✅ ${path.basename(dest)} (${(size/1024).toFixed(0)}KB)`);
        resolve({ ok: true });
      });
    });
    req.on("error", (e) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      console.log(`  ⚠️  ${path.basename(dest)}: ${e.message}`);
      resolve({ ok: false });
    });
    req.on("timeout", () => {
      req.destroy();
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      console.log(`  ⏱️  Timeout: ${path.basename(dest)}`);
      resolve({ ok: false });
    });
  });
}

async function main() {
  console.log(`\n🏥 RENDIX — Descargando ${IMAGES.length} imágenes faltantes\n`);
  let ok = 0, fail = 0;
  for (const img of IMAGES) {
    const r = await download(img.url, path.join(OUTPUT_DIR, img.file));
    if (r.ok) ok++; else fail++;
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`\n✅ ${ok} OK | ❌ ${fail} fallidas`);

  // Listar todo lo descargado
  const files = fs.readdirSync(OUTPUT_DIR);
  console.log(`\n📁 Imágenes en public/farma/ (${files.length} total):`);
  files.forEach(f => {
    const size = fs.statSync(path.join(OUTPUT_DIR, f)).size;
    console.log(`   ${f} — ${(size/1024).toFixed(0)}KB`);
  });
}

main().catch(console.error);
