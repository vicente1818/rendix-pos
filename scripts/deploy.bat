@echo off
git config core.protectNTFS false
git add src/ public/ scripts/ vite.config.js
git commit -m "FEAT: PWA offline precache total (87 archivos, JPG/WebP/Fuentes), Sparkline SVG fix y whatsapp link repair"
git push origin main --force
