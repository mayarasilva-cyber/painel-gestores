#!/bin/bash
cd ~/Desktop/painel-gestores-repo
rm -f .git/index.lock
git add -A
git commit -m "feat: exames concluídos vs solicitados + aba visão gerencial"
git push origin main
echo ""
echo "✅ Publicado! Pode fechar esta janela."
