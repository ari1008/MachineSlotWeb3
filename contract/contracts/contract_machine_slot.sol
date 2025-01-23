// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SlotMachine {
    address public owner;
    uint256 public betAmount;
    uint8 public numberOfSymbols;
    uint256 public threeMatchMultiplier;
    uint256 public twoMatchMultiplier;

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

    function spin() public payable {
        require(msg.value == betAmount, "Incorrect bet amount");
        require(address(this).balance >= msg.value * threeMatchMultiplier, "Not enough funds in contract");

        totalBets[msg.sender] += msg.value;

        uint8[3] memory result = generateRandomResult();
        uint256 winAmount = calculateWin(msg.value, result);
        string memory outcome;

        if (_isThreeMatch(result)) {
            outcome = "JACKPOT! Three matching symbols!";
        } else if (_isTwoMatch(result)) {
            outcome = "Winner! Two matching symbols!";
        } else {
            outcome = "No match. Try again!";
        }

        if (winAmount > 0) {
            payable(msg.sender).transfer(winAmount);
            totalWinnings[msg.sender] += winAmount;
        }

        emit Spin(msg.sender, msg.value, result, winAmount, outcome);
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

    function withdrawFunds(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "Not enough funds");
        payable(owner).transfer(amount);
    }
}