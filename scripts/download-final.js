const https = require("https");
const fs = require("fs");
const path = require("path");
const dir = "C:/Users/vicen/.gemini/antigravity/scratch/rendix-pos/public/farma";

const imgs = [
  { f: "landerlan-boldenona-250.jpg", u: "https://elnegro.com.py/wp-content/uploads/2022/10/thumb_boldenona.jpg" },
  { f: "landerlan-clembuterol-brontel.jpg", u: "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_brontel.jpg" },
  { f: "ec-artichoke-v2.png", u: "https://elnegro.com.py/wp-content/uploads/2026/06/Earths-Creation-Artichoke-500-Mg-X-60-Caps.png" },
  { f: "ec-ashwagandha-gummy-v2.png", u: "https://elnegro.com.py/wp-content/uploads/2026/06/Earths-Creation-Ashwagandha-Gummy-X-60.png" },
  { f: "ec-biotin-v2.png", u: "https://elnegro.com.py/wp-content/uploads/2026/06/Earths-Creation-Biotin-10-Mg-X-100-Caps.png" },
  { f: "evodia-iron-v2.png", u: "https://elnegro.com.py/wp-content/uploads/2026/07/Evodia-Gentle-Iron-Complex-X-90-Caps.png" },
];

(async () => {
  for (const { f, u } of imgs) {
    await new Promise(resolve => {
      const dest = path.join(dir, f);
      const file = fs.createWriteStream(dest);
      https.get(u, { headers: { "User-Agent": "Mozilla/5.0 RENDIX/2" } }, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          console.log("FAIL " + res.statusCode + ": " + f);
          return resolve();
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          const s = fs.statSync(dest).size;
          console.log("OK " + f + " (" + Math.round(s/1024) + "KB)");
          resolve();
        });
      }).on("error", e => { console.log("ERR " + f + ": " + e.message); resolve(); });
    });
    await new Promise(r => setTimeout(r, 300));
  }
  const files = fs.readdirSync(dir);
  console.log("\nTotal en /public/farma: " + files.length + " archivos");
  files.forEach(f => console.log("  " + f + " - " + Math.round(fs.statSync(path.join(dir,f)).size/1024) + "KB"));
})();
