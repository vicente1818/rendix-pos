/**
 * Script para descargar todas las imágenes de FARMA EL NEGRO
 * y guardarlas en public/farma/
 * Ejecutar con: node scripts/download-farma-images.js
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "public", "farma");

// Crear directorio si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("📁 Creado directorio:", OUTPUT_DIR);
}

const IMAGES = [
  // FAPASA
  { file: "fapasa-tamsulon-duo.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Fapasa-Tamsulon-Duo-05-Mg-X-30-Caps.png" },
  { file: "fapasa-tamsulon-04.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Fapasa-Tamsulon-04-Mg-X-30-Caps.png" },
  { file: "fapasa-emadian.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Fapasa-Emadian-25-Mg-X-30-Comprimidos.png" },
  { file: "fapasa-domper.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Fapasa-Domper-Digest-X-30-Comp.png" },

  // ETICOS — Cetrizet
  { file: "eticos-cetrizet.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-Cetrizet-10-Mg-perlas.png" },

  // ETICOS — Lipoless (usando URLs con encoding de guión largo)
  { file: "eticos-mdlipoless-15-1v.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-%E2%80%93-Md-Lipoless-15-Mg-X-1-Vial-De-24-Ml.png" },
  { file: "eticos-lipoless-75-viales.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-%E2%80%93-Lipoless-75-Mg-X-4-Viales.png" },
  { file: "eticos-lipoless-75-jeringas.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-%E2%80%93-Lipoless-75-Mg-x-4-Jeringas-CVastago.png" },
  { file: "eticos-lipoless-5-viales.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-%E2%80%93-Lipoless-5-Mg-X-4-Viales.png" },
  { file: "eticos-lipoless-5-jeringas.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-%E2%80%93-Lipoless-5-Mg-x-4-Jeringas-CVastago.png" },
  { file: "eticos-lipoless-25-viales.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-%E2%80%93-Lipoless-25-Mg-X-4-Viales.png" },
  { file: "eticos-lipoless-25-jeringas.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-%E2%80%93-Lipoless-25-Mg-x-4-Jeringas-CVastago.png" },
  { file: "eticos-lipoless-15-viales.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-%E2%80%93-Lipoless-15-Mg-X-4-Viales-.png" },
  { file: "eticos-lipoless-15-jeringas.png", url: "https://elnegro.com.py/wp-content/uploads/2026/07/Eticos-%E2%80%93-Lipoless-15-Mg-x-4-Jeringas-CVastago.png" },

  // LANDERLAN GOLD — Esteroides
  { file: "landerlan-boldenona-250.jpg", url: "https://elnegro.com.py/wp-content/uploads/2021/06/Boldenona-Undecileanato-Landerlan-Gold.jpg" },
  { file: "landerlan-clembuterol-brontel.jpg", url: "https://elnegro.com.py/wp-content/uploads/2021/06/Brontel-clenbuterol-clorhidrato.jpg" },
  { file: "landerlan-cabergolina.jpg", url: "https://elnegro.com.py/wp-content/uploads/2021/06/Cabertrix-cabergolina.jpg" },
  { file: "landerlan-clembuterol-04.jpg", url: "https://elnegro.com.py/wp-content/uploads/2021/07/Clembuterol-Landerlan.jpg" },
  { file: "landerlan-decaland-10ml.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Decaland-depot-200mg-Landerlan-Gold-10ml.jpg" },
  { file: "landerlan-decaland-5ml.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Decaland-Depot-200mg-5ml.jpg" },
  { file: "landerlan-drostanolona.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Drostanolona-Propionato-Landerlan-Gold.jpg" },
  { file: "landerlan-durateston.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Durateston-Plusgold-Landerlan-Gold.jpg" },
  { file: "biletan-forte.jpg", url: "https://elnegro.com.py/wp-content/uploads/2021/06/Biletan-forte-acido-tioctico.jpg" },

  // EARTH'S CREATION
  { file: "ec-7keto-25.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Earths-Creation-7-Keto-Dhea-25mg.jpg" },
  { file: "ec-7keto-50.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Earths-Creation-7-Keto-Dhea-50mg.jpg" },
  { file: "ec-androt.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Earths-Creation-Andro-T.jpg" },
  { file: "ec-artichoke.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Earths-Creation-Artichoke-500mg.jpg" },
  { file: "ec-ashwagandha.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Earths-Creation-Ashwagandha-470mg.jpg" },
  { file: "ec-ashwagandha-gummy.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Earths-Creation-Ashwagandha-Gummy.jpg" },
  { file: "ec-b12.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Earths-Creation-B12-1000mcg.jpg" },
  { file: "ec-biotin.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/01/Earths-Creation-Biotin-10mg.jpg" },

  // EVODIA
  { file: "evodia-oregano.jpg", url: "https://elnegro.com.py/wp-content/uploads/2023/01/Evodia-Oregano-Oil.jpg" },
  { file: "evodia-omega.jpg", url: "https://elnegro.com.py/wp-content/uploads/2023/01/Evodia-Omega-980mg.jpg" },
  { file: "evodia-lady.jpg", url: "https://elnegro.com.py/wp-content/uploads/2023/01/Evodia-Lady-Complex.jpg" },
  { file: "evodia-granagard.jpg", url: "https://elnegro.com.py/wp-content/uploads/2023/01/Evodia-Granagard.jpg" },
  { file: "evodia-iron.jpg", url: "https://elnegro.com.py/wp-content/uploads/2023/01/Evodia-Gentle-Iron-Complex.jpg" },

  // DESINCHA
  { file: "desincha-dianoche.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/05/Desincha-Dia-Noche.jpg" },

  // ALLWAYS
  { file: "allways-cafeina.jpg", url: "https://elnegro.com.py/wp-content/uploads/2022/03/Allways-Caffeine-Power-550mg.jpg" },
];

function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest)) {
      const size = fs.statSync(dest).size;
      if (size > 1000) {
        console.log(`  ⏭  Ya existe: ${path.basename(dest)} (${(size/1024).toFixed(1)} KB)`);
        return resolve({ ok: true, skipped: true });
      }
    }

    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith("https") ? https : http;

    const req = protocol.get(url, { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0 RENDIX-POS-Scraper/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        console.log(`  ❌ Error ${res.statusCode}: ${path.basename(dest)}`);
        return resolve({ ok: false, status: res.statusCode });
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        const size = fs.statSync(dest).size;
        console.log(`  ✅ ${path.basename(dest)} (${(size/1024).toFixed(1)} KB)`);
        resolve({ ok: true });
      });
    });

    req.on("error", (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      console.log(`  ⚠️  Red: ${path.basename(dest)} → ${err.message}`);
      resolve({ ok: false, error: err.message });
    });

    req.on("timeout", () => {
      req.destroy();
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      console.log(`  ⏱️  Timeout: ${path.basename(dest)}`);
      resolve({ ok: false, error: "timeout" });
    });
  });
}

async function main() {
  console.log(`\n🏥 RENDIX POS — Descargando ${IMAGES.length} imágenes FARMA EL NEGRO`);
  console.log(`📁 Destino: ${OUTPUT_DIR}\n`);

  let ok = 0, fail = 0;
  for (const img of IMAGES) {
    const dest = path.join(OUTPUT_DIR, img.file);
    const result = await download(img.url, dest);
    if (result.ok) ok++; else fail++;
    await new Promise(r => setTimeout(r, 300)); // pausa entre requests
  }

  console.log(`\n✅ Completado: ${ok} OK, ${fail} fallidas`);
  console.log(`\n📌 Las imágenes están en: public/farma/`);
  console.log(`📌 Referencia en catálogo: /farma/nombre-archivo.jpg`);
}

main().catch(console.error);
