pragma solidity =0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/lib/contracts/libraries/Babylonian.sol';
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import '../libraries/UniswapV2LiquidityMathLibrary.sol';
import '../interfaces/IERC20.sol';
import '../interfaces/IUniswapV2Router01.sol';
import '../libraries/SafeMath.sol';
import '../libraries/UniswapV2Library.sol';

// Need to install uniswap libraries.

//Inputs:
//1. Factory DEX 1
//2. Router DEX 1
//3. Factory DEX 2
//4. Router DEX 2
//5. Address token A
//6. Address token B 
//7. 'True price' token A (price from one of the DEX)
//8. 'True price' token B (price from one of the DEX)

contract ExampleSwapToPrice {
    using SafeMath for uint256;
    
    // initiate address for router and factory for DEX 1 and DEX 2
    IUniswapV2Router01 public immutable router1;
    address public immutable factory1;
    IUniswapV2Router01 public immutable router2;
    address public immutable factory2;

    // input address for router and factory for DEX 1 and DEX 2
    constructor(address factory1_, IUniswapV2Router01 router1_, address factory2_, IUniswapV2Router01 router2_) public {
        factory1 = factory1_;
        router1 = router1_;
        factory2 = factory2_;
        router2 = router2_;
    }

    // swaps an amount of either token such that the trade is profit-maximizing, given an external true price
    // true price is expressed in the ratio of token A to token B
    // caller must approve this contract to spend whichever token is intended to be swapped
    // 'True price' here should refer to True price of the 2nd exchange
    // Would probably be easier if we did the profit maximizing out of the SC (save gas as well, maybe?)
    function swapToPrice(
        address tokenA,
        address tokenB,
        uint256 truePriceTokenA,
        uint256 truePriceTokenB,
        uint256 maxSpendTokenA,
        uint256 maxSpendTokenB,
        address to,
        uint256 deadline
    ) public {
        // true price is expressed as a ratio, so both values must be non-zero
        require(truePriceTokenA != 0 && truePriceTokenB != 0, "ExampleSwapToPrice: ZERO_PRICE");
        // caller can specify 0 for either if they wish to swap in only one direction, but not both
        require(maxSpendTokenA != 0 || maxSpendTokenB != 0, "ExampleSwapToPrice: ZERO_SPEND");

        bool aToB;
        uint256 amountIn;
        {
            (uint256 reserveA, uint256 reserveB) = UniswapV2Library.getReserves(factory1, tokenA, tokenB);
            (aToB, amountIn) = UniswapV2LiquidityMathLibrary.computeProfitMaximizingTrade(
                truePriceTokenA, truePriceTokenB,
                reserveA, reserveB
            );
        }

        require(amountIn > 0, 'ExampleSwapToPrice: ZERO_AMOUNT_IN');

        // spend up to the allowance of the token in
        uint256 maxSpend = aToB ? maxSpendTokenA : maxSpendTokenB;
        if (amountIn > maxSpend) {
            amountIn = maxSpend;
        }

        address tokenIn = aToB ? tokenA : tokenB;
        address tokenOut = aToB ? tokenB : tokenA;
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
        TransferHelper.safeApprove(tokenIn, address(router1), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        // Profit maximizing swap on first exchange
        router1.swapExactTokensForTokens(
            amountIn,
            0, // amountOutMin: we can skip computing this number because the math is tested
            path,
            to,
            deadline
        );
        // Get amount out
        if (aToB) {
            uint amountOut = UniswapV2Library.getAmountOut(amountIn, reserveA, reserveB);
        } else {
            uint amountOut = UniswapV2Library.getAmountOut(amountIn, reserveB, reserveA);
        }
        
        
        // Swapping on 2nd exchange at price of 2nd exchange('True Price')
        address[] memory path_2 = new address[](2);
        path_2[0] = tokenOut;
        path_2[1] = tokenIn;
        uint amountIn_2 = amountOut;
        router2.swapExactTokensForTokens(
            amountIn_2,
            0, // amountOutMin: we can skip computing this number because the math is tested
            path_2,
            to,
            deadline
        );
        // Write test to ensure that we are profitting after gas fees
        // require((TokenA_out-amountIn)*truePriceTokenA - gas_fees > 0, 'Trade not profitable')

    }
}