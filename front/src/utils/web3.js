import { ethers } from 'ethers';

export const checkNetwork = async () => {
    if (!window.ethereum) return false;
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        console.log("Current network:", {
            chainId,
            name: network.name,
            networkId: network.chainId,
        });
        const correctChainId = '0x7A69'; // Hardhat local
        if (chainId !== correctChainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: correctChainId }],
                });
                return true;
            } catch (switchError) {
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: correctChainId,
                                chainName: 'Hardhat Network',
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18,
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