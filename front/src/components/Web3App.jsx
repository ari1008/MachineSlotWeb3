import React, { useEffect, useState } from 'react';
import { WalletIcon } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/contract';
import { checkNetwork } from '../utils/web3';

function Web3App() {
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState('');
    const [contract, setContract] = useState(null);

    const [betAmount, setBetAmount] = useState('0');
    const [dynamicBet, setDynamicBet] = useState('0');
    const [isSpinning, setIsSpinning] = useState(false);
    const [status, setStatus] = useState('');
    const [balance, setBalance] = useState('0');
    const [balanceType, setBalanceType] = useState('Bank');
    const [playerStats, setPlayerStats] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [gameInfo, setGameInfo] = useState(null);
    const [networkError, setNetworkError] = useState('');
    const [referralAddress, setReferralAddress] = useState('');
    const [referralCount, setReferralCount] = useState(null);
    const [referralEarnings, setReferralEarnings] = useState('0');
    const [isOwner, setIsOwner] = useState(false);

    const updateStatus = (message) => {
        console.log("Status Update:", message);
        setStatus(message);
    };

    const verifyContractFunctions = async (contractInstance) => {
        try {
            const betAmountFromContract = await contractInstance.betAmount();
            console.log("Bet amount from contract:", betAmountFromContract.toString());
            setBetAmount(ethers.utils.formatEther(betAmountFromContract));

            const numberOfSymbols = await contractInstance.numberOfSymbols();
            console.log("Number of symbols:", numberOfSymbols.toString());

            const twoMatchMultiplier = await contractInstance.twoMatchMultiplier();
            const threeMatchMultiplier = await contractInstance.threeMatchMultiplier();

            setGameInfo({
                betAmount: ethers.utils.formatEther(betAmountFromContract),
                numberOfSymbols: numberOfSymbols.toString(),
                twoMatchMultiplier: twoMatchMultiplier.toString(),
                threeMatchMultiplier: threeMatchMultiplier.toString()
            });

            updateDynamicBet(contractInstance);
            updateReferralData(contractInstance);

            return true;
        } catch (error) {
            console.error("Contract verification failed:", error);
            return false;
        }
    };

    const updateDynamicBet = async (contractInstance) => {
        if (!contractInstance || !account) return;
        try {
            const suggested = await contractInstance.calculateDynamicBetAmount(account);
            setDynamicBet(ethers.utils.formatEther(suggested));
        } catch (error) {
            console.error("Error fetching dynamic bet amount:", error);
        }
    };

    const updateReferralData = async (contractInstance) => {
        if (!contractInstance || !account) return;
        try {
            const count = await contractInstance.getReferralCount(account);
            setReferralCount(count.toString());
            const earnings = await contractInstance.referralEarnings(account);
            setReferralEarnings(ethers.utils.formatEther(earnings));
        } catch (error) {
            console.error("Error fetching referral data:", error);
        }
    };

    const updatePlayerStats = async () => {
        if (!contract || !account) return;
        try {
            const stats = await contract.getPlayerStats(account);
            setPlayerStats({
                totalBet: ethers.utils.formatEther(stats.totalBet),
                totalWon: ethers.utils.formatEther(stats.totalWon),
                netResult: ethers.utils.formatEther(stats.netResult)
            });
        } catch (error) {
            console.error("Error fetching player stats:", error);
        }
    };

    const toggleBalanceType = () => {
        setBalanceType(balanceType === 'Bank' ? 'Bankroll' : 'Bank');
    };

    const updateBalance = async () => {
        if (!window.ethereum || !account) return;
        try {
            if (balanceType === 'Bank') {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const myBalance = await provider.getBalance(account);
                setBalance(ethers.utils.formatEther(myBalance));
            } else {
                const bankrollBalance = await contract.playerBankroll(account);
                setBalance(ethers.utils.formatEther(bankrollBalance));
            }
        } catch (error) {
            console.error("Error updating balance:", error);
        }
    };

    const checkIfOwner = async (contractInstance, userAccount) => {
        try {
            const contractOwner = await contractInstance.owner();
            console.log("Owner of contract : ", contractOwner.toLowerCase());
            console.log("Mine is : ", userAccount.toLowerCase());
            setIsOwner(contractOwner.toLowerCase() === userAccount.toLowerCase());
        } catch (error) {
            console.error("Error checking owner:", error);
        }
    };

    const initializeContract = async (userAccount) => {
        setNetworkError('');
        try {
            const { ethereum } = window;
            if (!ethereum) {
                throw new Error("MetaMask not installed");
            }
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();

            const contractInstance = new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer
            );

            const isValid = await verifyContractFunctions(contractInstance);
            if (!isValid) {
                throw new Error("Contract verification failed");
            }
            setContract(contractInstance);

            await checkIfOwner(contractInstance, userAccount);

            contractInstance.on("Spin", (player, bet, result, winAmount, outcome) => {
                setLastResult({
                    player,
                    bet: ethers.utils.formatEther(bet),
                    result: result.map(r => r.toString()),
                    winAmount: ethers.utils.formatEther(winAmount),
                    outcome
                });
                updatePlayerStats();
                updateBalance();
                updateDynamicBet(contractInstance);
            });

            await updatePlayerStats();
            await updateBalance();
            updateStatus("Contract initialized successfully");
        } catch (error) {
            console.error("Contract initialization error:", error);
            setNetworkError(error.message);
        }
    };

    const connectWallet = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                alert("Please install MetaMask!");
                return;
            }
            const networkOk = await checkNetwork();
            if (!networkOk) {
                throw new Error("Please connect to the correct network");
            }
            const provider = new ethers.providers.Web3Provider(ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setIsConnected(true);
                await initializeContract(accounts[0]);
            }
        } catch (error) {
            console.error("Wallet connection error:", error);
            updateStatus(`Connection error: ${error.message}`);
        }
    };

    const disconnectWallet = () => {
        setIsConnected(false);
        setAccount('');
        setContract(null);
        setIsOwner(false);
        setStatus("Disconnected from wallet");
    };

    const depositBankroll = async (amount) => {
        if (!contract) {
            updateStatus("Contract not initialized");
            return;
        }
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const nonce = await provider.getTransactionCount(account, 'latest');
            const tx = await contract.depositBankroll({
                value: ethers.utils.parseEther(amount),
                from: account,
                nonce: nonce
            });
            updateStatus("Deposit transaction sent");
            await tx.wait(1);
            updateStatus("Deposit successful");
            await updateBalance();
            updateDynamicBet(contract);
        } catch (error) {
            console.error("Deposit error:", error);
            updateStatus(`Deposit error: ${error.message}`);
        }
    };

    const handleSpin = async () => {
        if (!contract) {
            updateStatus("Contract not initialized");
            return;
        }
        setLastResult(null);
        try {
            setIsSpinning(true);
            updateStatus("Preparing spin...");

            const betAmountWei = ethers.utils.parseEther(dynamicBet);

            const bankroll = await contract.playerBankroll(account);
            if (bankroll.lt(betAmountWei)) {
                throw new Error("Insufficient bankroll for bet");
            }
            const tx = await contract.spin(betAmountWei, {
                gasLimit: 300000
            });
            updateStatus(`Transaction sent. Hash: ${tx.hash}`);
            updateStatus("Waiting for confirmation...");
            const receipt = await tx.wait(1);
            if (receipt.status === 1) {
                updateStatus("Spin successful!");
                await updatePlayerStats();
                await updateBalance();
                updateDynamicBet(contract);
            } else {
                throw new Error("Transaction failed");
            }
        } catch (error) {
            console.error("Spin error:", error);
            let errorMessage = "An error occurred while spinning";
            if (error.message.includes("Insufficient bankroll")) {
                errorMessage = "Insufficient bankroll for bet";
            } else if (error.message.includes("Bet too small")) {
                errorMessage = "Bet amount is too small";
            } else if (error.message.includes("Bet too large")) {
                errorMessage = "Bet amount is too large";
            }
            updateStatus(errorMessage);
        } finally {
            setIsSpinning(false);
        }
    };

    const registerReferral = async () => {
        if (!contract) {
            updateStatus("Contract not initialized");
            return;
        }
        if (!referralAddress) {
            updateStatus("Please enter a referral address");
            return;
        }
        try {
            updateStatus("Registering referral...");
            const tx = await contract.registerReferral(referralAddress, { gasLimit: 300000 });
            updateStatus(`Referral registration sent. Tx hash: ${tx.hash}`);
            await tx.wait(1);
            updateStatus("Referral registered successfully!");
            updateReferralData(contract);
        } catch (error) {
            console.error("Referral error:", error);
            updateStatus(`Referral error: ${error.message}`);
        }
    };

    const handleSetBetContract = async (newBet) => {
        if (!contract) {
            updateStatus("Contract not initialized");
            return;
        }
        try {
            updateStatus("Setting bet amount...");
            const tx = await contract.setBetAmount(ethers.utils.parseEther(newBet));
            await tx.wait(1);
            updateStatus(`Bet amount successfully set to ${newBet} ETH`);
            verifyContractFunctions(contract);
        } catch (error) {
            console.error("Error setting bet:", error);
            updateStatus("Error setting bet: " + error.message);
        }
    };

    const handleWithdrawFunds = async (withdrawAmount) => {
        if (!contract) {
            updateStatus("Contract not initialized");
            return;
        }
        try {
            updateStatus("Withdrawing from contract...");
            const weiAmount = ethers.utils.parseEther(withdrawAmount);
            const tx = await contract.withdrawFunds(weiAmount);
            await tx.wait(1);
            updateStatus(`Successfully withdrew ${withdrawAmount} ETH from contract`);
        } catch (error) {
            console.error("Error withdrawing funds:", error);
            updateStatus("Error withdrawing funds: " + error.message);
        }
    };

    useEffect(() => {
        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                setIsConnected(false);
                setAccount('');
                setContract(null);
                setIsOwner(false);
            } else {
                setAccount(accounts[0]);
                setIsConnected(true);
                setBalanceType('Bank');
                initializeContract(accounts[0]);
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
            if (contract) {
                contract.removeAllListeners("Spin");
            }
        };
    }, [contract]);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-center mb-6">
                    Slot Machine Web3
                </h1>

                {networkError && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {networkError}
                    </div>
                )}

                {status && (
                    <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
                        <p className="truncate">{status}</p>
                    </div>
                )}

                {isConnected && (
                    <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
                        <p className="mb-2">
                            <span className="text-green-500">Connected:</span>
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </p>
                        {isOwner && (
                            <p className="text-blue-500">
                                You are the owner of this contract!
                            </p>
                        )}
                    </div>
                )}

                {isConnected && (
                    <>
                        <div className="mb-4 p-4 bg-white rounded-lg flex justify-between">
                            <div className="flex-1 mr-4">
                                <div className="p-4 bg-green-50 rounded-lg flex flex-col items-center text-center h-full">
                                    <h3 className="font-semibold mb-4 text-lg">Last Result:</h3>
                                    <div className="flex items-center gap-10">
                                        {(lastResult ? lastResult.result : [null, null, null]).map((number, index, array) => {
                                            const isMatching = array.filter((n) => n === number).length > 1;
                                            return (
                                                <div
                                                    key={index}
                                                    className={`w-16 h-16 flex items-center justify-center text-3xl font-bold rounded-full ${
                                                        isSpinning
                                                            ? 'bg-blue-300'
                                                            : isMatching
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-green-200 text-green-900'
                                                    }`}
                                                >
                                                    {!isSpinning && number}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {lastResult && (
                                        <>
                                            <p className="mt-4 text-lg">Outcome: {lastResult.outcome}</p>
                                            <p className="text-lg">
                                                Amount Won: <span className="font-bold">{lastResult.winAmount} ETH</span>
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 ml-4">
                                <div className="p-4 bg-blue-50 rounded-lg h-full flex flex-col items-center">
                                    <h3 className="font-semibold mb-4 text-lg">Game Info:</h3>
                                    {gameInfo && (
                                        <div className="text-sm">
                                            <p className="font-semibold">Number&nbsp;of&nbsp;Symbols:</p>
                                            <p className="text-xl">{gameInfo.numberOfSymbols}</p>
                                            <p className="font-semibold">Two&nbsp;Match&nbsp;Multiplier:</p>
                                            <p className="text-xl">{gameInfo.twoMatchMultiplier}x</p>
                                            <p className="font-semibold">Three&nbsp;Match&nbsp;Multiplier:</p>
                                            <p className="text-xl">{gameInfo.threeMatchMultiplier}x</p>
                                            <p className="font-semibold mt-4">Suggested Bet:</p>
                                            <p className="text-xl">{dynamicBet} ETH</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <div className="flex-grow p-3 bg-gray-100 rounded-lg text-sm text-center font-semibold">
                                <div className="flex">
                                    <div className="flex-grow">
                                        <p className="mb-2">{balanceType} Balance:</p>
                                        <p>{parseFloat(balance).toFixed(4)} ETH</p>
                                    </div>
                                    <div className="flex items-center">
                                        <button
                                            onClick={toggleBalanceType}
                                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mb-2 text-sm"
                                        >
                                            Switch to <br />{balanceType === 'Bank' ? 'Bankroll' : 'Bank'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {balanceType === 'Bankroll' && (
                                <div className="ml-4 flex flex-col">
                                    <button
                                        onClick={() => depositBankroll("0.002")}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mb-2 text-sm"
                                    >
                                        Deposit in BankRoll
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="text-center mb-4">
                            <div className="flex flex-wrap justify-center gap-2">
                                {playerStats && (
                                    <>
                                        <div className="bg-blue-50 p-2 rounded flex-1 min-w-24 text-center">
                                            <div className="text-sm text-gray-600 mb-2">
                                                <p>Total Bet:</p>
                                                <p className="font-semibold">{parseFloat(playerStats.totalBet).toFixed(4)} ETH</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 p-2 rounded flex-1 min-w-24 text-center">
                                            <div className="text-sm text-gray-600 mb-2">
                                                <p>Total Won:</p>
                                                <p className="text-green-500 font-semibold">{parseFloat(playerStats.totalWon).toFixed(4)} ETH</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 p-2 rounded flex-1 min-w-24 text-center">
                                            <div className="text-sm text-gray-600 mb-2">
                                                <p>Net Result:</p>
                                                <p className="text-yellow-400 font-semibold">{parseFloat(playerStats.netResult).toFixed(4)} ETH</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center font-semibold">
                            <p>Base Bet Amount: {gameInfo && gameInfo.betAmount} ETH</p>
                        </div>

                        {/* Referral Section */}
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h2 className="text-lg font-semibold mb-2 text-center">Referral</h2>
                            <div className="mb-2">
                                <input
                                    type="text"
                                    placeholder="Referral Address"
                                    value={referralAddress}
                                    onChange={(e) => setReferralAddress(e.target.value)}
                                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <button
                                onClick={registerReferral}
                                className="w-full px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
                            >
                                Register Referral
                            </button>
                            <div className="mt-4 text-center">
                                <p className="font-semibold">My Referrals: {referralCount !== null ? referralCount : "Loading..."}</p>
                                <p className="font-semibold">Referral Earnings: {referralEarnings} ETH</p>
                            </div>
                        </div>

                        {/* Owner-only section */}
                        {isOwner && (
                            <div className="mb-4 p-4 bg-red-50 rounded-lg">
                                <h2 className="text-lg font-semibold mb-2 text-center">Owner Control</h2>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="New Bet Amount (ETH)"
                                            className="flex-1 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                                            onChange={(e) => setBetAmount(e.target.value)}
                                            value={betAmount}
                                        />
                                        <button
                                            onClick={() => handleSetBetContract(betAmount)}
                                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Set Bet
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Withdraw Amount (ETH)"
                                            className="flex-1 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                                            id="withdrawAmount"
                                        />
                                        <button
                                            onClick={() => {
                                                const withdrawAmount =
                                                    document.getElementById('withdrawAmount').value || '0';
                                                handleWithdrawFunds(withdrawAmount);
                                            }}
                                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                            Withdraw
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="flex justify-center mb-6">
                    {!isConnected && (
                        <button
                            onClick={connectWallet}
                            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <WalletIcon size={20} />
                            Connect Wallet
                        </button>
                    )}

                    {isConnected && (
                        <button
                            onClick={disconnectWallet}
                            className="ml-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Disconnect
                        </button>
                    )}
                </div>

                {isConnected && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h2 className="text-lg font-semibold mb-2 text-center">Play</h2>
                            <button
                                onClick={handleSpin}
                                disabled={isSpinning}
                                className={`
                  w-full px-4 py-2 rounded-lg transition-colors
                  ${isSpinning
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-500 hover:bg-green-600'
                                }
                  text-white
                `}
                            >
                                {isSpinning ? "Spinning..." : "Spin using Dynamic Bet"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Web3App;