@echo off
git config core.protectNTFS false
git add src/ public/ scripts/
git commit -m "FEAT: Actualizadas imagenes de Decaland, Durateston, Biletan Forte y Clembuterol"
git push origin main --force
