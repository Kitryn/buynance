pragma solidity =0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/lib/contracts/libraries/Babylonian.sol';
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import '../libraries/UniswapV2LiquidityMathLibrary.sol';
import '../interfaces/IERC20.sol';
import '../interfaces/IUniswapV2Router01.sol';
import '../libraries/SafeMath.sol';
import '../libraries/UniswapV2Library.sol';

//Inputs:
//1. Factory DEX 1
//2. Router DEX 1
//3. Factory DEX 2
//4. Router DEX 2

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

    function swapToPrice(
        address tokenA,
        address tokenB,
        uint256 maxSpendTokenA,
        uint256 maxSpendTokenB,
        address to,
        uint256 deadline
    ) public {

        // caller can specify 0 for either if they wish to swap in only one direction, but not both
        require(maxSpendTokenA != 0 || maxSpendTokenB != 0, "ExampleSwapToPrice: ZERO_SPEND");
        
        //Initialize variables we need 
        bool aToB;
        uint256 amountIn;
        uint256 amountOut;
        
        {
            (uint256 truePriceTokenA,uint256 truePriceTokenB) = UniswapV2Library.getReserves(factory2, tokenA, tokenB);

            // true price is expressed as a ratio, so both values must be non-zero
            require(truePriceTokenA != 0 && truePriceTokenB != 0, "ExampleSwapToPrice: ZERO_PRICE");
            // caller can specify 0 for either if they wish to swap in only one direction, but not both
            require(maxSpendTokenA != 0 || maxSpendTokenB != 0, "ExampleSwapToPrice: ZERO_SPEND");

            (uint256 reserveA, uint256 reserveB) = UniswapV2Library.getReserves(factory1, tokenA, tokenB);
            (aToB, amountIn) = UniswapV2LiquidityMathLibrary.computeProfitMaximizingTrade(
                truePriceTokenA, truePriceTokenB,
                reserveA, reserveB
            );
            if (aToB) {
                amountOut = UniswapV2Library.getAmountOut(amountIn, reserveA, reserveB);
            } else {
                amountOut = UniswapV2Library.getAmountOut(amountIn, reserveB, reserveA);
            }
            // spend up to the allowance of the token in
            uint256 maxSpend = aToB ? maxSpendTokenA : maxSpendTokenB;
            if (amountIn > maxSpend) {
                amountIn = maxSpend;
            }
        }

        require(amountIn > 0, 'ExampleSwapToPrice: ZERO_AMOUNT_IN');

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

        // Swapping on 2nd exchange at price of 2nd exchange('True Price')
        address[] memory path_2 = new address[](2);
        path_2[0] = tokenOut;
        path_2[1] = tokenIn;
        //uint amountIn_2 = 5;
        router2.swapExactTokensForTokens(
            amountOut,
            0, // amountOutMin: we can skip computing this number because the math is tested
            path_2,
            to,
            deadline
        );
        // Write test to ensure that we are profitting after gas fees
        // require((TokenA_out-amountIn)*truePriceTokenA - gas_fees > 0, 'Trade not profitable')

    }
}