const https = require("https");
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "public", "farma");

// Posibles URLs de Cabergolina basadas en patrones de elnegro.com.py
const candidates = [
  "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_cabertrix.jpg",
  "https://elnegro.com.py/wp-content/uploads/2022/10/thumb_cabertrix.jpg",
  "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_cabergolina.jpg",
  "https://elnegro.com.py/wp-content/uploads/2022/10/thumb_cabergolina.jpg",
  "https://elnegro.com.py/wp-content/uploads/2023/07/cabertrix-cabergolina-050-mg-caja-de-8-comprimidos.jpg",
  "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_cabertrix-cabergolina.jpg",
  "https://elnegro.com.py/wp-content/uploads/2024/08/Cabertrix-Cabergolina-050-mg.webp",
  "https://elnegro.com.py/wp-content/uploads/2024/08/Cabertrix-Cabergolina.webp",
];

(async () => {
  for (const u of candidates) {
    const found = await new Promise(resolve => {
      https.get(u, { headers: { "User-Agent": "Mozilla/5.0 RENDIX/3" } }, (res) => {
        const status = res.statusCode;
        res.resume();
        if (status === 200) {
          console.log("FOUND: " + u);
          resolve(u);
        } else {
          console.log("  " + status + " " + path.basename(u));
          resolve(null);
        }
      }).on("error", () => resolve(null));
    });
    if (found) {
      // Descargar
      const ext = path.extname(found);
      const dest = path.join(dir, "landerlan-cabergolina" + ext);
      await new Promise(resolve => {
        const file = fs.createWriteStream(dest);
        https.get(found, { headers: { "User-Agent": "Mozilla/5.0 RENDIX/3" } }, (res) => {
          res.pipe(file);
          file.on("finish", () => { file.close(); const s = fs.statSync(dest).size; console.log("OK landerlan-cabergolina" + ext + " (" + Math.round(s/1024) + "KB)"); resolve(); });
        }).on("error", () => resolve());
      });
      break;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log("DONE");
})();
