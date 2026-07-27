const https = require("https");
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "public", "farma");

const imgs = [
  // Decaland 10ml
  { f: "landerlan-decaland-10ml.jpg", u: "https://elnegro.com.py/wp-content/uploads/2022/10/thumb_decalanddepot200mg.jpg" },
  // Decaland 5ml
  { f: "landerlan-decaland-5ml.jpg", u: "https://elnegro.com.py/wp-content/uploads/2022/09/thumb_landerlan-decaland-decaland-depot-200mg-5ml.jpg" },
  // Durateston (imagen de mayor calidad)
  { f: "landerlan-durateston.jpg", u: "https://elnegro.com.py/wp-content/uploads/2022/10/Durateston-Plus-Gold-101-300x284-1.jpg" },
  // Biletan Forte (webp de mayor calidad)
  { f: "biletan-forte.webp", u: "https://elnegro.com.py/wp-content/uploads/2024/08/Biletan-Forte-200-mg-Contenido-de-20-comprimidos-recubiertos-48200.webp" },
  // Clembuterol 0,04mg
  { f: "landerlan-clembuterol-04.jpg", u: "https://elnegro.com.py/wp-content/uploads/2024/10/Clembuterol_2.jpg" },
];

(async () => {
  for (const { f, u } of imgs) {
    await new Promise(resolve => {
      const dest = path.join(dir, f);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
        console.log("SKIP " + f);
        return resolve();
      }
      const file = fs.createWriteStream(dest);
      const proto = require(u.startsWith("https") ? "https" : "http");
      proto.get(u, { headers: { "User-Agent": "Mozilla/5.0 RENDIX/3" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          // retry redirect
          https.get(res.headers.location, { headers: { "User-Agent": "Mozilla/5.0 RENDIX/3" } }, (res2) => {
            res2.pipe(file);
            file.on("finish", () => { file.close(); console.log("OK(redir) " + f); resolve(); });
          }).on("error", e => { console.log("ERR " + f); resolve(); });
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          console.log("FAIL " + res.statusCode + " " + f);
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
    await new Promise(r => setTimeout(r, 400));
  }
  console.log("\nDONE - archivos en public/farma:");
  fs.readdirSync(dir).sort().forEach(f => {
    const s = fs.statSync(path.join(dir, f)).size;
    console.log("  " + f + " (" + Math.round(s/1024) + "KB)");
  });
})();
