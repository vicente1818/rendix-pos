const https = require("https");
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "public", "farma");

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const known = [
  { f: "landerlan-landertropin.jpg", u: "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_landertropin.jpg" },
  { f: "landerlan-oxandroland.jpg", u: "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_oxandroland-oxandrolona-100-tabs-de-5mg-landerlan.jpg" },
  { f: "landerlan-stanozoland.jpg", u: "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_landerlan-stanozoland-10mg-stanozolol-100-comprimidos.jpg" },
];

const candidates = [
  { f: "landerlan-hcg.jpg", urls: [
    "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_hcg.jpg",
    "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_gonadotropina.jpg",
    "https://elnegro.com.py/wp-content/uploads/2022/10/thumb_hcg.jpg",
    "https://elnegro.com.py/wp-content/uploads/2023/07/gonadotropina-corionica-humana.jpg"
  ]},
  { f: "landerlan-primobolan.jpg", urls: [
    "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_primobolan.jpg",
    "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_metenolona.jpg",
    "https://elnegro.com.py/wp-content/uploads/2022/10/thumb_primobolan.jpg"
  ]}
];

function fetchOne(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 RENDIX/4" } }, (res) => {
      if (res.statusCode === 200) resolve(true);
      else resolve(false);
      res.resume();
    }).on("error", () => resolve(false));
  });
}

function downloadFile(url, dest) {
  return new Promise(resolve => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 RENDIX/4" } }, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return resolve(false);
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(true);
      });
    }).on("error", () => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      resolve(false);
    });
  });
}

async function main() {
  console.log("Descargando imágenes conocidas...");
  for (const { f, u } of known) {
    const dest = path.join(dir, f);
    const ok = await downloadFile(u, dest);
    console.log(`  ${ok ? "✅" : "❌"} ${f}`);
  }

  console.log("\nBuscando candidatas para HCG y Primobolan...");
  for (const item of candidates) {
    let found = false;
    for (const url of item.urls) {
      const ok = await fetchOne(url);
      if (ok) {
        await downloadFile(url, path.join(dir, item.f));
        console.log(`  ✅ ${item.f} desde ${url}`);
        found = true;
        break;
      }
    }
    if (!found) {
      // Usar drostanolona como copia fallback local
      const fallbackSrc = path.join(dir, "landerlan-drostanolona.jpg");
      const dest = path.join(dir, item.f);
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, dest);
        console.log(`  📋 ${item.f} (copiado de fallback local)`);
      }
    }
  }
}

main();
