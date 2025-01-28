const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function demonstrateSlotMachine() {
    console.log("🎰 DÉMONSTRATION DE LA MACHINE À SOUS 🎰\n");

    try {
        const accounts = await hre.viem.getWalletClients()
        const [owner, player, referrer] = accounts;


        const slot = await hre.viem.getContractAt("SlotMachine", CONTRACT_ADDRESS);
        console.log("📊 INFORMATIONS DE BASE");
        const betAmount = await slot.read.betAmount();
        const balance = await slot.read.getBalance();
        const contractOwner = await slot.read.owner();

        console.log(`Mise de base: ${betAmount} ETH`);
        console.log(`Solde du contrat: ${balance} ETH`);
        console.log(`Propriétaire: ${contractOwner}\n`);

        console.log("👥 DÉMONSTRATION DU SYSTÈME DE PARRAINAGE");

        const referralTx = await slot.write.registerReferral(
            [referrer.account.address],
            {account: player.account.address}
        );
        console.log(`Parrain enregistré: ${referrer.account.address}`);
        console.log(`Parrain enregistré réussi  ${referralTx}`)

        const referralCount = await slot.read.getReferralCount([referrer.account.address]);
        console.log(`Nombre de filleuls: ${referralCount}\n`);

        console.log("💰 DÉMONSTRATION DE LA GESTION DE BANKROLL");
        const depositAmount = 1000000000000000000n; // 1 ETH
        const depositTx = await slot.write.depositBankroll({
            value: depositAmount,
            account: player.account.address
        });
        console.log(`Dépôt de 1 ETH effectué`);
        console.log(`DepositTx ${depositTx}`)
        const suggestedBet = await slot.read.calculateDynamicBetAmount([player.account.address]);
        console.log(`Mise suggérée: ${suggestedBet} ETH\n`);

        console.log("🎮 DÉMONSTRATION DU JEU");
        for (let i = 0; i < 3; i++) {
            console.log(`\nTour ${i + 1}:`);
            const spinTx = await slot.write.spin({
                value: betAmount,
                account: player.account.address
            });

            console.log(`Transaction de spin: ${spinTx}`);
        }

        console.log("\n📈 STATISTIQUES DU JOUEUR");
        const stats = await slot.read.getPlayerStats([player.account.address]);
        console.log(`Total misé: ${stats[0]} ETH`);
        console.log(`Total gagné: ${stats[1]} ETH`);
        console.log(`Résultat net: ${stats[2]} ETH\n`);


        console.log("💎 GAINS DU PARRAIN");
        const referralEarnings = await slot.read.referralEarnings([referrer.account.address]);
        console.log(`Gains du parrain: ${referralEarnings} ETH\n`);

    } catch (error) {
        console.error("❌ Erreur:", error);
    }
}

async function demonstrateReferralSystem() {
    try {
        const accounts = await hre.viem.getWalletClients()
        const player = accounts[2]
        const newReferrer = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"

        const slot = await hre.viem.getContractAt("SlotMachine", CONTRACT_ADDRESS);

        console.log("👥 SYSTÈME DE PARRAINAGE\n")

        console.log("Enregistrement du parrain")
        const referralTx = await slot.write.registerReferral(
            [newReferrer],
            {account: player.account.address}
        )
        console.log(`Parrain enregistré: ${newReferrer}`)
        console.log(`Transaction: ${referralTx}`)

        const referralCount = await slot.read.getReferralCount([newReferrer])
        console.log(`Nombre de filleuls: ${referralCount}`)

        console.log("\nDémonstration des gains de parrainage")
        const betAmount = await slot.read.betAmount()

        for (let i = 0; i < 3; i++) {
            console.log(`\nPartie ${i + 1}:`)
            const spinTx = await slot.write.spin({
                value: betAmount,
                account: player.account.address
            })
            console.log(`Transaction: ${spinTx}`)
        }

        console.log("\nVérification des gains")
        const referralEarnings = await slot.read.referralEarnings([newReferrer])
        console.log(`Gains du parrain: ${referralEarnings} ETH`)

    } catch (error) {
        console.error("Erreur:", error)
    }
}


async function demonstrateBankroll() {
    try {
        const accounts = await hre.viem.getWalletClients()
        const [owner, player1, player2] = accounts;

        const slot = await hre.viem.getContractAt("SlotMachine", CONTRACT_ADDRESS);

        console.log("💰 DÉMONSTRATION DU SYSTÈME DE BANKROLL\n");

        const initialContractBalance = await slot.read.getBalance();
        console.log("1️⃣ ÉTAT INITIAL");
        console.log(`Balance du contrat: ${initialContractBalance} ETH`);

        const initialPlayerBankroll = await slot.read.playerBankroll([player1.account.address]);
        console.log(`Bankroll initiale du joueur: ${initialPlayerBankroll} ETH\n`);

        console.log("2️⃣ DÉPÔT DANS LA BANKROLL");
        const depositAmount = 1000000000000000000n; // 1 ETH
        try {
            const depositTx = await slot.write.depositBankroll({
                value: depositAmount,
                account: player1.account.address
            });
            console.log(`Transaction de dépôt effectuée: ${depositTx}`);

            const newPlayerBankroll = await slot.read.playerBankroll([player1.account.address]);
            console.log(`Nouvelle bankroll du joueur: ${newPlayerBankroll} ETH\n`);
        } catch (error) {
            console.error("Erreur lors du dépôt:", error.message);
        }

        console.log("3️⃣ CALCUL DE LA MISE SUGGÉRÉE");
        const suggestedBet = await slot.read.calculateDynamicBetAmount([player1.account.address]);
        console.log(`Mise suggérée pour le joueur: ${suggestedBet} ETH\n`);

        console.log("4️⃣ IMPACT DU JEU SUR LA BANKROLL");
        const betAmount = await slot.read.betAmount();

        for (let i = 0; i < 3; i++) {
            console.log(`\nPartie ${i + 1}:`);
            const bankrollBefore = await slot.read.playerBankroll([player1.account.address]);
            console.log(`Bankroll avant la partie: ${bankrollBefore} ETH`);

            const spinTx = await slot.write.spin({
                value: betAmount,
                account: player1.account.address
            });
            console.log(`Transaction de spin: ${spinTx}`);

            const bankrollAfter = await slot.read.playerBankroll([player1.account.address]);
            console.log(`Bankroll après la partie: ${bankrollAfter} ETH`);
        }


        console.log("\n5️⃣ STATISTIQUES DU JOUEUR");
        const stats = await slot.read.getPlayerStats([player1.account.address]);
        console.log(`Total misé: ${stats[0]} ETH`);
        console.log(`Total gagné: ${stats[1]} ETH`);
        console.log(`Résultat net: ${stats[2]} ETH`);

        const finalContractBalance = await slot.read.getBalance();
        console.log("\n6️⃣ ÉTAT FINAL");
        console.log(`Balance finale du contrat: ${finalContractBalance} ETH`);

    } catch (error) {
        console.error("❌ Erreur:", error);
    }
}


async function main() {
    await demonstrateSlotMachine();
    await demonstrateReferralSystem();
    await demonstrateBankroll()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });