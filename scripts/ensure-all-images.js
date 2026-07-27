const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "public", "farma");

const fallbackSrc = path.join(dir, "landerlan-drostanolona.jpg");
const files = [
  "landerlan-landertropin.jpg",
  "landerlan-oxandroland.jpg",
  "landerlan-stanozoland.jpg",
  "landerlan-hcg.jpg",
  "landerlan-primobolan.jpg"
];

for (const f of files) {
  const dest = path.join(dir, f);
  if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
    fs.copyFileSync(fallbackSrc, dest);
    console.log("Copied fallback to:", f);
  }
}
console.log("All local image fallbacks verified.");
