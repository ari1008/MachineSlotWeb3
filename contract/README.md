cd contract
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/deploy.ts --network localhost
npx hardhat run scripts/demo.js  --network localhost 