import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IUniswapV2Router02 {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}

interface IUniswapV2Factory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
}

// Address Token A: 0x52A525D4c44b0E0491c14CA7Ff5A45a3884c15B3
// Address Token B: 0x89EC644A1224eC1595952D6f0b90c041A46a0765
// Address LiquidityPool SC: 0x73E9D688842E6AbFaCe854fE7Fd880BE82ED6670
contract LiquidityPool {
    // Router Goerli
    address routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

    address factoryAddress = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    IUniswapV2Factory factory = IUniswapV2Factory(factoryAddress);

    IERC20 tokenA = IERC20(0x52A525D4c44b0E0491c14CA7Ff5A45a3884c15B3);
    IERC20 tokenB = IERC20(0x89EC644A1224eC1595952D6f0b90c041A46a0765);

    event LiquidityAdded(uint amountA, uint amountB, uint liquidity);

    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint _amountADesired,
        uint _amountBDesired,
        uint _amountAMin,
        uint _amountBMin,
        address _to,
        uint _deadline
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        // Approve the router to spend the token
        tokenA.approve(routerAddress, _amountADesired);
        tokenB.approve(routerAddress, _amountBDesired);

        // Add liquidity
        (amountA, amountB, liquidity) = router.addLiquidity(
            _tokenA,
            _tokenB,
            _amountADesired,
            _amountBDesired,
            _amountAMin,
            _amountBMin,
            _to,
            _deadline
        );

        emit LiquidityAdded(amountA, amountB, liquidity);
    }

    function getPair(
        address _tokenA,
        address _tokenB
    ) external view returns (address pair) {
        pair = factory.getPair(_tokenA, _tokenB);
    }
}
