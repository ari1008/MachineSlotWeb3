// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SlotMachine {
    address public owner;
    uint256 public betAmount;
    uint8 public numberOfSymbols;
    uint256 public threeMatchMultiplier;
    uint256 public twoMatchMultiplier;
    uint256 public referralBonus = 5;
    mapping(address => address) public referrers;
    mapping(address => uint256) public referralEarnings;
    mapping(address => address[]) public referrals;

    mapping(address => uint256) public playerBankroll;

    event ReferralBonus(
        address indexed referrer,
        address indexed player,
        uint256 bonus
    );

    mapping(address => uint256) public totalWinnings;
    mapping(address => uint256) public totalBets;

    event Spin(
        address player,
        uint256 bet,
        uint8[3] result,
        uint256 winAmount,
        string outcome
    );

    constructor() payable {
        owner = msg.sender;
        betAmount = 1000000000000000; // 0.001 ETH par défaut
        numberOfSymbols = 6;
        threeMatchMultiplier = 5;
        twoMatchMultiplier = 2;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }


    function setBetAmount(uint256 _betAmount) public {
        betAmount = _betAmount;
    }

    function _isThreeMatch(uint8[3] memory result) private pure returns (bool) {
        return (result[0] == result[1] && result[1] == result[2]);
    }

    function _isTwoMatch(uint8[3] memory result) private pure returns (bool) {
        return (result[0] == result[1] || result[1] == result[2] || result[0] == result[2]);
    }

    function generateRandomResult() private view returns (uint8[3] memory) {
        uint8[3] memory result;
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao)));

        for (uint8 i = 0; i < 3; i++) {
            result[i] = uint8(randomNumber % numberOfSymbols);
            randomNumber = randomNumber / numberOfSymbols;
        }

        return result;
    }

    function calculateWin(uint256 _bet, uint8[3] memory _result) private view returns (uint256) {
        if (_isThreeMatch(_result)) {
            return _bet * threeMatchMultiplier;
        }
        else if (_isTwoMatch(_result)) {
            return _bet * twoMatchMultiplier;
        }
        return 0;
    }

    function getPlayerStats(address player) public view returns (
        uint256 totalBet,
        uint256 totalWon,
        int256 netResult
    ) {
        totalBet = totalBets[player];
        totalWon = totalWinnings[player];
        netResult = int256(totalWon) - int256(totalBet);
        return (totalBet, totalWon, netResult);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function addFunds() public payable {

    }

    function registerReferral(address referrer) public {
        require(referrer != msg.sender, "Cannot refer yourself");
        require(referrers[msg.sender] == address(0), "Already referred");
        require(referrer != address(0), "Invalid referrer address");

        referrers[msg.sender] = referrer;
        referrals[referrer].push(msg.sender);
    }

    function getReferralCount(address referrer) public view returns (uint256) {
        return referrals[referrer].length;
    }

    function depositBankroll() public payable {
        playerBankroll[msg.sender] += msg.value;
    }


    function spin(uint256 betSize) public {
        require(betSize >= betAmount, "Bet too small");
        require(betSize <= betAmount * 10, "Bet too large");
        require(playerBankroll[msg.sender] >= betSize, "Insufficient bankroll");

        playerBankroll[msg.sender] -= betSize;
        totalBets[msg.sender] += betSize;

        uint8[3] memory result = generateRandomResult();
        uint256 winAmount = calculateWin(betSize, result);
        string memory outcome;

        address referrer = referrers[msg.sender];
        if (referrer != address(0)) {
            uint256 referralAmount = (betSize * referralBonus) / 100;
            referralEarnings[referrer] += referralAmount;
            playerBankroll[referrer] += referralAmount;
            emit ReferralBonus(referrer, msg.sender, referralAmount);
        }

        if (_isThreeMatch(result)) {
            outcome = "JACKPOT! Three matching symbols!";
        } else if (_isTwoMatch(result)) {
            outcome = "Winner! Two matching symbols!";
        } else {
            outcome = "No match. Try again!";
        }

        if (winAmount > 0) {
            playerBankroll[msg.sender] += winAmount;
            totalWinnings[msg.sender] += winAmount;
        }

        emit Spin(msg.sender, betSize, result, winAmount, outcome);
    }

    function calculateDynamicBetAmount(address player) public view returns (uint256) {
        uint256 bankroll = playerBankroll[player];
        if (bankroll == 0) return betAmount;

        uint256 suggestedBet = bankroll / 100;

        if (suggestedBet < betAmount) {
            return betAmount;
        } else if (suggestedBet > betAmount * 10) {
            return betAmount * 10;
        }

        return suggestedBet;
    }


    function withdrawFunds(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "Not enough funds");
        payable(owner).transfer(amount);
    }
}