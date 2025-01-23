cd contract
npx hardhat node  & sleep 5
npx hardhat ignition deploy ./ignition/modules/deploy.ts --network localhost
cd ../front
npm run dev