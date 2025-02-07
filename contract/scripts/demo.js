const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function demonstrateSlotMachine() {
    console.log("🎰 DÉMONSTRATION DE LA MACHINE À SOUS 🎰\n");

    try {
        const accounts = await hre.viem.getWalletClients();
        const [owner, player, referrer] = accounts;
        console.log(owner)
        exit()
        const slot = await hre.viem.getContractAt("SlotMachine", CONTRACT_ADDRESS);

        console.log("📊 INFORMATIONS DE BASE");
        const betAmount = await slot.read.betAmount();
        const balance = await slot.read.getBalance();
        const contractOwner = await slot.read.owner();

        console.log(`Mise de base: ${betAmount} ETH`);
        console.log(`Solde du contrat: ${balance} ETH`);
        console.log(`Propriétaire: ${contractOwner}\n`);

        console.log("👥 TEST DU SYSTÈME DE PARRAINAGE");
        const referralTx = await slot.write.registerReferral(
            [referrer.account.address],
            {account: player.account.address}
        );
        console.log(`Transaction de parrainage: ${referralTx}`);

        const referralCount = await slot.read.getReferralCount([referrer.account.address]);
        console.log(`Nombre de filleuls: ${referralCount}\n`);


        console.log("💰 TEST DE LA BANKROLL");
        const depositAmount = 10000000000000000000n; // 10 ETH
        const depositTx = await slot.write.depositBankroll({
            value: depositAmount,
            account: player.account.address
        });
        console.log(`Dépôt effectué: ${depositTx}`);

        const playerBankroll = await slot.read.playerBankroll([player.account.address]);
        console.log(`Bankroll du joueur: ${playerBankroll} ETH\n`);

        console.log("🎮 TEST DES SPINS");
        const spinAmounts = [
            1000000000000000n,  // 0.001 ETH
            2000000000000000n,  // 0.002 ETH
            5000000000000000n   // 0.005 ETH
        ];

        for (let i = 0; i < spinAmounts.length; i++) {
            console.log(`\nSpin ${i + 1} - Mise: ${spinAmounts[i]} ETH`);

            const bankrollBefore = await slot.read.playerBankroll([player.account.address]);
            console.log(`Bankroll avant: ${bankrollBefore} ETH`);

            const spinTx = await slot.write.spin(
                [spinAmounts[i]],
                {account: player.account.address}
            );
            console.log(`Transaction: ${spinTx}`);

            const bankrollAfter = await slot.read.playerBankroll([player.account.address]);
            console.log(`Bankroll après: ${bankrollAfter} ETH`);


            await new Promise(resolve => setTimeout(resolve, 1000));
        }


        console.log("\n📊 STATISTIQUES FINALES");
        const stats = await slot.read.getPlayerStats([player.account.address]);
        console.log(`Total misé: ${stats[0]} ETH`);
        console.log(`Total gagné: ${stats[1]} ETH`);
        console.log(`Résultat net: ${stats[2]} ETH`);

        const referralEarnings = await slot.read.referralEarnings([referrer.account.address]);
        console.log(`Gains du parrain: ${referralEarnings} ETH\n`);

    } catch (error) {
        console.error("❌ Erreur:", error);
    }
}

async function testContractOwnership() {
    try {
        const accounts = await hre.viem.getWalletClients();
        const [owner, nonOwner] = accounts;
        const slot = await hre.viem.getContractAt("SlotMachine", CONTRACT_ADDRESS);

        console.log("🔐 TEST DES PERMISSIONS");

        console.log("\nTest de setBetAmount:");
        const newBetAmount = 2000000000000000n; // 0.002 ETH

        try {
            const tx = await slot.write.setBetAmount(
                [newBetAmount],
                {account: owner.account.address}
            );
            console.log(`✅ Propriétaire peut modifier la mise: ${tx}`);
        } catch (error) {
            console.log("❌ Erreur lors de la modification de la mise par le propriétaire");
        }

        try {
            const tx = await slot.write.setBetAmount(
                [newBetAmount],
                {account: nonOwner.account.address}
            );
            console.log("❌ Non-propriétaire ne devrait pas pouvoir modifier la mise");
        } catch (error) {
            console.log("✅ Non-propriétaire ne peut pas modifier la mise (attendu)");
        }

    } catch (error) {
        console.error("❌ Erreur:", error);
    }
}

async function testBankrollSystem() {
    try {
        const accounts = await hre.viem.getWalletClients();
        const [owner, player1, player2] = accounts;
        const slot = await hre.viem.getContractAt("SlotMachine", CONTRACT_ADDRESS);

        console.log("\n💰 TEST APPROFONDI DU SYSTÈME DE BANKROLL");


        const depositAmount1 = 5000000000000000000n; // 5 ETH
        const depositAmount2 = 3000000000000000000n; // 3 ETH

        console.log("\nTest des dépôts:");
        const deposit1 = await slot.write.depositBankroll({
            value: depositAmount1,
            account: player1.account.address
        });
        console.log(`Dépôt joueur 1: ${deposit1}`);

        const deposit2 = await slot.write.depositBankroll({
            value: depositAmount2,
            account: player2.account.address
        });
        console.log(`Dépôt joueur 2: ${deposit2}`);


        const bankroll1 = await slot.read.playerBankroll([player1.account.address]);
        const bankroll2 = await slot.read.playerBankroll([player2.account.address]);
        console.log(`\nBankroll joueur 1: ${bankroll1} ETH`);
        console.log(`Bankroll joueur 2: ${bankroll2} ETH`);


        const suggested1 = await slot.read.calculateDynamicBetAmount([player1.account.address]);
        const suggested2 = await slot.read.calculateDynamicBetAmount([player2.account.address]);
        console.log(`\nMise suggérée joueur 1: ${suggested1} ETH`);
        console.log(`Mise suggérée joueur 2: ${suggested2} ETH`);

    } catch (error) {
        console.error("❌ Erreur:", error);
    }
}

async function main() {
    console.log("🎲 DÉBUT DES TESTS 🎲\n");

    await demonstrateSlotMachine();
    //await testContractOwnership();
    //await testBankrollSystem();

    console.log("\n🎲 FIN DES TESTS 🎲");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });