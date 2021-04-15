// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.3;

import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';

contract Arbitrage {
    address public baseFactory;
    IUniswapV2Router02 public baseRouter;
    uint constant deadline = 30 minutes;

    constructor(address _baseFactory, address _baseRouter) {
        baseFactory = _baseFactory;
        baseRouter = IUniswapV2Router02(_baseRouter);
    }
}