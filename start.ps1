# Aller dans le dossier contract
cd contract

# Démarrer le nœud hardhat
Start-Process -FilePath "npx" -ArgumentList "hardhat", "node" -NoNewWindow

# Attendre 5 secondes
Start-Sleep -Seconds 5

# Déployer avec ignition
Start-Process -FilePath "npx" -ArgumentList "hardhat", "ignition", "deploy", "./ignition/modules/deploy.ts", "--network", "localhost" -Wait -NoNewWindow

# Aller dans le dossier front
cd ../front

# Lancer npm run dev
npm run dev