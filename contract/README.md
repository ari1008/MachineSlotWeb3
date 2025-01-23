# MachineSlotWeb3

// 1. Configuration initiale
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/deploy.ts --network localhost
npx hardhat console --network localhost
const { formatUnits } = await import('viem')
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const slot = await hre.viem.getContractAt("SlotMachine", CONTRACT_ADDRESS)
const [account] = await hre.viem.getWalletClients()

// 2. Lecture des informations de base
// Obtenir le montant du pari
const betAmount = await slot.read.betAmount()
console.log("Montant du pari:", formatUnits(betAmount, 18), "ETH")

// Obtenir le solde du contrat
const balance = await slot.read.getBalance()
console.log("Solde du contrat:", formatUnits(balance, 18), "ETH")

// Obtenir le propriétaire
const owner = await slot.read.owner()
console.log("Propriétaire:", owner)

// Obtenir les probabilités de gain
const odds = await slot.read.odds()
console.log("Probabilités:", odds)

// 3. Actions de jeu
// Faire un spin
const spinTx = await slot.write.spin({
value: betAmount,
account: account.account
})
console.log("Transaction spin:", spinTx)

// 4. Actions du propriétaire (uniquement si vous êtes le owner)
// Retirer les fonds
const withdrawTx = await slot.write.withdraw({
account: account.account
})
console.log("Transaction retrait:", withdrawTx)

// Modifier le montant du pari
const newBetAmount = 100000000000000000n // 0.1 ETH
const setBetAmountTx = await slot.write.setBetAmount(newBetAmount, {
account: account.account
})
console.log("Transaction modification pari:", setBetAmountTx)

// Modifier les probabilités
const newOdds = 50 // 50%
const setOddsTx = await slot.write.setOdds(newOdds, {
account: account.account
})
console.log("Transaction modification odds:", setOddsTx)

// 5. Lire les événements
// Obtenir tous les spins
const allSpins = await slot.getEvents.Spin()
console.log("Tous les spins:", allSpins)

// Obtenir le dernier spin
const lastSpin = allSpins[allSpins.length - 1]
if (lastSpin) {
console.log("Dernier spin:", {
symbols: lastSpin.args.symbols,
payout: formatUnits(lastSpin.args.payout, 18),
won: lastSpin.args.won
})
}

// 6. Vérifier les transactions
const publicClient = await hre.viem.getPublicClient()
const receipt = await publicClient.getTransactionReceipt({
hash: spinTx // ou n'importe quel autre hash de transaction
})
console.log("Reçu de transaction:", receipt)

// 7. Déposer des fonds dans le contrat (en tant que owner)
const depositAmount = 1000000000000000000n // 1 ETH
const depositTx = await slot.write.deposit({
value: depositAmount,
account: account.account
})
console.log("Transaction dépôt:", depositTx)
