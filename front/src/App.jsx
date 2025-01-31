import React, {useEffect, useState} from 'react';
import {WalletIcon} from 'lucide-react';
import {ethers} from 'ethers';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
console.log("Loading contract at address:", CONTRACT_ADDRESS);

const CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "payable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "bet",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint8[3]",
                "name": "result",
                "type": "uint8[3]"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "winAmount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "outcome",
                "type": "string"
            }
        ],
        "name": "Spin",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "addFunds",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "betAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            }
        ],
        "name": "getPlayerStats",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "totalBet",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "totalWon",
                "type": "uint256"
            },
            {
                "internalType": "int256",
                "name": "netResult",
                "type": "int256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "numberOfSymbols",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_betAmount",
                "type": "uint256"
            }
        ],
        "name": "setBetAmount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "spin",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "threeMatchMultiplier",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "totalBets",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "totalWinnings",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "twoMatchMultiplier",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdrawFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

function Web3App() {
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState('');
    const [contract, setContract] = useState(null);
    const [betAmount, setBetAmount] = useState('0');
    const [isSpinning, setIsSpinning] = useState(false);
    const [status, setStatus] = useState('');
    const [balance, setBalance] = useState('0');
    const [playerStats, setPlayerStats] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [gameInfo, setGameInfo] = useState(null);
    const [networkError, setNetworkError] = useState('');


    const updateStatus = (message) => {
        console.log("Status Update:", message);
        setStatus(message);
    };

    const verifyContractFunctions = async (contractInstance) => {
        try {
            // Lire le montant de mise du contrat
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

            return true;
        } catch (error) {
            console.error("Contract verification failed:", error);
            return false;
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

    const updateBalance = async () => {
        if (!window.ethereum || !account) return;

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const balance = await provider.getBalance(account);
            setBalance(ethers.utils.formatEther(balance));
        } catch (error) {
            console.error("Error updating balance:", error);
        }
    };

    const initializeContract = async () => {
        setNetworkError('');
        try {
            const {ethereum} = window;
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

            // Vérifier le réseau
            const networkOk = await checkNetwork();
            if (!networkOk) {
                throw new Error("Please connect to the correct network");
            }

            const provider = new ethers.providers.Web3Provider(ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);

            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setIsConnected(true);
                await initializeContract();
            }
        } catch (error) {
            console.error("Wallet connection error:", error);
            updateStatus(`Connection error: ${error.message}`);
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

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Vérifier le solde
            const currentBalance = await provider.getBalance(account);
            const betAmountWei = ethers.utils.parseEther(betAmount);
            // Fetch the current nonce
            const nonce = await provider.getTransactionCount(account, 'latest');

            if (currentBalance.lt(betAmountWei)) {
                throw new Error("Insufficient balance for bet");
            }

            // Paramètres de transaction adaptés pour Hardhat
            const txParams = {
                from: account,
                value: betAmountWei,
                gasLimit: ethers.utils.hexlify(1000000), // Gas limit plus élevé pour Hardhat
                nonce: nonce
            };

            console.log("Sending transaction with params:", txParams);

            const tx = await contract.spin(txParams);
            console.log("Transaction hash:", tx.hash);
            updateStatus(`Transaction sent. Hash: ${tx.hash}`);

            updateStatus("Waiting for confirmation...");
            const receipt = await tx.wait(1);

            if (receipt.status === 1) {
                console.log("Transaction successful:", receipt);
                updateStatus("Spin successful!");
                await updatePlayerStats();
                await updateBalance();
            } else {
                throw new Error("Transaction failed");
            }

        } catch (error) {
            console.error("Spin error:", error);

            let errorMessage = "An error occurred while spinning";

            if (error.message.includes("insufficient funds")) {
                errorMessage = "Insufficient funds for transaction";
            } else if (error.message.includes("user rejected")) {
                errorMessage = "Transaction rejected by user";
            } else if (error.data) {
                try {
                    const reason = error.data.message || error.message;
                    errorMessage = `Contract error: ${reason}`;
                } catch (e) {
                    errorMessage = error.message;
                }
            }

            updateStatus(errorMessage);
            console.log("Detailed error:", {
                message: error.message,
                data: error.data,
                transaction: error.transaction
            });

        } finally {
            setIsSpinning(false);
        }
    };


    const checkNetwork = async () => {
        if (!window.ethereum) return false;

        try {
            // Récupérer l'ID du réseau actuel
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();

            console.log("Current network:", {
                chainId,
                name: network.name,
                networkId: network.chainId
            });

            // Vérifier si nous sommes sur Hardhat (chainId: 31337)
            const correctChainId = '0x7A69'; // Hardhat
            if (chainId !== correctChainId) {
                try {
                    // Essayer de changer de réseau
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: correctChainId }],
                    });
                    return true;
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        // Réseau non ajouté, essayer de l'ajouter
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: correctChainId,
                                    chainName: 'Hardhat Network',
                                    nativeCurrency: {
                                        name: 'ETH',
                                        symbol: 'ETH',
                                        decimals: 18
                                    },
                                    rpcUrls: ['http://127.0.0.1:8545/'],
                                }],
                            });
                            return true;
                        } catch (addError) {
                            console.error('Error adding Hardhat network:', addError);
                            return false;
                        }
                    }
                    console.error('Error switching to Hardhat network:', switchError);
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Error checking network:', error);
            return false;
        }
    };

    useEffect(() => {
        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                setIsConnected(false);
                setAccount('');
                setContract(null);
            } else {
                setAccount(accounts[0]);
                initializeContract();
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
                                                Amount Won: <span className="font-bold">{lastResult.winAmount} ETH </span>
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 ml-4">
                                <div className="p-4 bg-blue-50 rounded-lg h-full flex flex-col items-center ">
                                    <h3 className="font-semibold mb-4 text-lg">Game Info:</h3>
                                    {gameInfo && (
                                        <div className="text-sm">
                                            <p className="font-semibold">Number&nbsp;of&nbsp;Symbols:</p>
                                            <p className="text-xl">{gameInfo.numberOfSymbols}</p>
                                            <p className="font-semibold">Two&nbsp;Match&nbsp;Multiplier:</p>
                                            <p className="text-xl">{gameInfo.twoMatchMultiplier}x</p>
                                            <p className="font-semibold">Three&nbsp;Match&nbsp;Multiplier:</p>
                                            <p className="text-xl">{gameInfo.threeMatchMultiplier}x</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {isConnected && (
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex-grow p-3 bg-gray-100 rounded-lg text-sm text-center font-semibold">
                                    <div className="flex">
                                        <div className="flex-grow">
                                            <p className="mb-2">Balance:</p>
                                            <p>{parseFloat(balance).toFixed(4)} ETH</p>
                                        </div>
                                        <div className="flex items-center">
                                            <button
                                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mb-2 text-sm">
                                                Balance Type
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-4 flex flex-col">
                                    <button
                                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors mb-2 text-sm">
                                        Deposit in BankRoll
                                    </button>
                                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                                        Withdraw from BankRoll
                                    </button>
                                </div>
                            </div>
                        )}

                        {isConnected && (

                            <div className="text-center mb-4">
                                <div className="flex flex-wrap justify-center gap-2">
                                    {playerStats && (
                                        <>
                                            <div className="bg-blue-50 p-2 rounded flex-1 min-w-[100px] text-center">
                                                <div className="text-sm text-gray-600 mb-2">
                                                    <p>Total Bet:</p>
                                                    <p className="font-semibold">{parseFloat(playerStats.totalBet).toFixed(4)} ETH</p>
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 p-2 rounded flex-1 min-w-[100px] text-center">
                                                <div className="text-sm text-gray-600 mb-2">
                                                    <p>Total Won:</p>
                                                    <p className="text-green-500 font-semibold">{parseFloat(playerStats.totalWon).toFixed(4)} ETH</p>
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 p-2 rounded flex-1 min-w-[100px] text-center">
                                                <div className="text-sm text-gray-600 mb-2">
                                                    <p>Net Result:</p>
                                                    <p className="text-yellow-400 font-semibold">{parseFloat(playerStats.netResult).toFixed(4)} ETH</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}


                        {gameInfo && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center font-semibold">
                                <p>{gameInfo.betAmount} ETH</p>
                                <p>Bet Amount: </p>
                            </div>
                        )}
                    </>
                )}

                <div className="flex justify-center mb-6">
                    {!isConnected &&(
                        <button
                            onClick={connectWallet}
                            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <WalletIcon size={20}/>
                            Connect Wallet
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
                                {isSpinning ? "Spinning..." : "Spin!"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Web3App;