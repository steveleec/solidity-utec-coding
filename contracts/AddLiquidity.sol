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

contract LiquidityPool {
    // Router Goerli
    address routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

    IERC20 tokenA = IERC20(0xe8e5087004C10a99FB1a13E7C48Ca4a1f3bEf8c9);
    IERC20 tokenB = IERC20(0xEBabd70215B973930663b5E259870AB8efBA5886);

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
}
