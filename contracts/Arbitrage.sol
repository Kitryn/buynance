// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.3;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
// import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';
import './Utils.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract Arbitrage is Ownable {
    using SafeERC20 for IERC20;
    address public mainFactory;
    address public otherFactory;
    IUniswapV2Router02 public mainRouter;
    IUniswapV2Router02 public otherRouter;
    uint constant deadline = 30 minutes;

    constructor(address _mainFactory, address _otherFactory, address _mainRouter, address _otherRouter) {
        mainFactory = _mainFactory;
        otherFactory = _otherFactory;
        mainRouter = IUniswapV2Router02(_mainRouter);
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
        address tokenBASE,
        address tokenALT,
        uint amountToSell,
        bool flashloanBASE
    ) external onlyOwner {
        address mainPair = IUniswapV2Factory(mainFactory).getPair(tokenBASE, tokenALT);
        require(mainPair != address(0), 'PAIR DOES NOT EXIST');
        
        (uint reservesMainBASE, uint reservesMainALT) = Utils.getReservesFromFactory(mainFactory, tokenBASE, tokenALT);
        (uint reservesOtherBASE, uint reservesOtherALT) = Utils.getReservesFromFactory(otherFactory, tokenBASE, tokenALT);
        
        uint flashloanAmount;
        uint amount0;
        uint amount1;

        if (flashloanBASE == true) {
            // If flashloan BASE to begin with, profits will be in ALT so need to convert
            flashloanAmount = Utils.getAmountOut(
                Utils.getAmountOut(amountToSell, reservesOtherBASE, reservesOtherALT),
                reservesMainALT,
                reservesMainBASE
            );
            require(flashloanAmount > amountToSell, 'NOT PROFITABLE');

            // we need to sort amounts into an order that Uniswap expects
            (amount0, amount1) = tokenBASE < tokenALT ? (flashloanAmount, uint(0)) : (uint(0), flashloanAmount);
        } else {
            // If flashloan ALT to begin with, profits will be in BASE
            flashloanAmount = amountToSell;
            
            // we need to sort amounts into an order that Uniswap expects
            (amount0, amount1) = tokenBASE < tokenALT ? (uint(0), flashloanAmount) : (flashloanAmount, uint(0));
        }
        
        // We also need to pass some data to the callback
        bytes memory data = abi.encode(
            amountToSell,
            flashloanBASE
        );

        IUniswapV2Pair(mainPair).swap(
            amount0,
            amount1,
            address(this),
            data
        );
    }

    function uniswapV2Call(
        address _sender,
        uint _amount0,
        uint _amount1,
        bytes calldata _data
    ) external {
        address[] memory path = new address[](2);
        // uint amountToken = _amount0 == 0 ? _amount1 : _amount0;
        address token0 = IUniswapV2Pair(msg.sender).token0();  
        address token1 = IUniswapV2Pair(msg.sender).token1();
        // WARNING: THIS WILL NOT WORK IN PROD! HASH IN LIBRARY NEEDS TO CHANGE
        require(msg.sender == IUniswapV2Factory(mainFactory).getPair(token0, token1), 'UNAUTHORIZED');
        require(_amount0 == 0 || _amount1 == 0);

        (uint amountToSell, bool flashloanBASE) = abi.decode(_data, (uint, bool));

        path[0] = _amount0 == 0 ? token1 : token0;
        path[1] = _amount0 == 0 ? token0 : token1;

        IERC20 inToken = IERC20(path[0]);  // this is what we have flashloaned
        IERC20 outToken = IERC20(path[1]);
        inToken.approve(address(otherRouter), amountToSell); 

        uint refund;
        uint amountReceived = otherRouter.swapExactTokensForTokens(
            amountToSell,
            0,  // we'll sanity check at the end
            path,
            address(this),
            block.timestamp + deadline // TODO - how do we pass in a proper deadline??
        )[1];
        
        if (flashloanBASE == true) {
            // If flashloan BASE to begin with, profits will be in ALT so need to convert
            // Swap amountToSell, then put all proceeds back to mainPair, and the difference between amountToSell and flashloanAmount is our profit
            // both refund and amountReceived will be in ALT currency
            refund = amountReceived;
            // the require(flashloanAmount > amountToSell) check has already been performed in startArbitrage()
        } else {
            // if flashloan ALT to begin with, profits will be in BASE so no need to convert
            // Swap amountToSell (which is equal to flashloanAmount), and refund only what is necessary to cover flashloan
            // both refund and amountReceived will be in BASE currency
            address[] memory invertedPath = new address[](2);
            invertedPath[0] = path[1];
            invertedPath[1] = path[0];
            // Possibly can optimise gas better here
            refund = Utils.getAmountsIn(
                mainFactory,
                amountToSell,
                invertedPath
            )[0];
            require(refund < amountReceived, 'REFUND GREATER THAN AMOUNT_RECEIVED');
        }
        outToken.transfer(msg.sender, refund);
    }
}