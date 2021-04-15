// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.3;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
// import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';
import './Utils.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import 'hardhat/console.sol';

contract Arbitrage is Ownable {
    using SafeERC20 for IERC20;
    address public baseFactory;
    IUniswapV2Router02 public baseRouter;
    IUniswapV2Router02 public otherRouter;
    uint constant deadline = 30 minutes;

    constructor(address _baseFactory, address _baseRouter, address _otherRouter) {
        baseFactory = _baseFactory;
        baseRouter = IUniswapV2Router02(_baseRouter);
        otherRouter = IUniswapV2Router02(_otherRouter);
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

    function startArbitrage(
        address tokenA,
        address tokenB,
        uint amountA
    ) external onlyOwner {
        // will ALWAYS borrow tokenA to sell on otherRouter!
        address basePair = IUniswapV2Factory(baseFactory).getPair(tokenA, tokenB);
        require(basePair != address(0), 'PAIR DOES NOT EXIST');
        
        // we need to sort amountA and amountB to a order Uniswap expects (amountB is always 0)
        (uint sortedAmount0, uint sortedAmount1) = tokenA < tokenB ? (amountA, uint256(0)) : (uint256(0), amountA);

        IUniswapV2Pair(basePair).swap(
            sortedAmount0,
            sortedAmount1,
            address(this),
            bytes('wat')
        );
    }

    function uniswapV2Call(
        address _sender,
        uint _amount0,
        uint _amount1,
        bytes calldata _data
    ) external {
        address[] memory path = new address[](2);
        uint amountToken = _amount0 == 0 ? _amount1 : _amount0;
        address token0 = IUniswapV2Pair(msg.sender).token0();  // should be msg.sender
        address token1 = IUniswapV2Pair(msg.sender).token1();
        // WARNING: THIS WILL NOT WORK IN PROD! HASH IN LIBRARY NEEDS TO CHANGE
        require(msg.sender == Utils.pairFor(baseFactory, token0, token1), 'UNAUTHORIZED');
        require(_amount0 == 0 || _amount1 == 0);

        path[0] = _amount0 == 0 ? token1 : token0;
        path[1] = _amount0 == 0 ? token0 : token1;

        IERC20 token = IERC20(path[0]);
        IERC20 otherToken = IERC20(path[1]);
        token.approve(address(otherRouter), amountToken);

        uint refundToBase = Utils.getAmountsIn(
            baseFactory,
            amountToken,
            path
        )[0];
        uint amountReceived = otherRouter.swapExactTokensForTokens(
            amountToken,
            refundToBase, 
            path, 
            address(this), 
            block.timestamp + deadline  // TODO - how do we pass in a proper deadline??
        )[1];

        otherToken.transfer(msg.sender, refundToBase);
    }
}