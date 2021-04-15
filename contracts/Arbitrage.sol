// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.3;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract Arbitrage is Ownable {
    using SafeERC20 for IERC20;
    address public baseFactory;
    IUniswapV2Router02 public baseRouter;
    uint constant deadline = 30 minutes;

    constructor(address _baseFactory, address _baseRouter) {
        baseFactory = _baseFactory;
        baseRouter = IUniswapV2Router02(_baseRouter);
    }

    function withdrawAll() public onlyOwner {
        uint balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    function withdrawAllToken(address _tokenAddress) public onlyOwner {
        IERC20 token = IERC20(_tokenAddress);
        uint balance = token.balanceOf(address(this));
        require(balance > 0, "INSUFFICIENT TOKEN BALANCE");
        token.safeTransfer(address(owner()), balance);
    }

    receive() external payable {}
}