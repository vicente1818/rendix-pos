@echo off
git config core.protectNTFS false
git add src/ public/ scripts/
git commit -m "FIX: Reparacion automatica de imagenes con fallback inteligente local para todos los productos en IndexedDB"
git push origin main --force
