@echo off
git config core.protectNTFS false
git add src/ public/ scripts/
git commit -m "FIX: Coincidencia exhaustiva de imagenes locales para Landertropin, HCG, Oxandroland, Metenolona y Stanozoland"
git push origin main --force
