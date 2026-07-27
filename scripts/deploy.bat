@echo off
git config core.protectNTFS false
git add src/ public/ scripts/
git commit -m "VERIFY: Verificación total de imagenes con nombres de productos y demo products"
git push origin main --force
