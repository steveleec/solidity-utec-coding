// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

// Token A (Goerli): 0xf16919B58cEEFF7175bDfcD34616fBe79C185Cc2
contract TokenA is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("TokenA", "TKNA") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}

// Token B (Goerli):: 0x98d70FC7B0B02989dA9312EF01b6cFF051A8BaEC
contract TokenB is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("TokenB", "TKNB") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}

interface IUniswapRouter02 {
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

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IUniswapV2Factory {
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint
    );

    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);

    function allPairs(uint) external view returns (address pair);

    function allPairsLength() external view returns (uint);

    function feeTo() external view returns (address);

    function feeToSetter() external view returns (address);

    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair);
}

// Address P:  0x6adaBFE862850E1034787Bb395E089d50Ce63BB6
// Address I:  0x0cad8dc7b2eAA7d536DF028c4A2A71c56B85f5b4
contract DeFi is Initializable, UUPSUpgradeable {
    // Router Goerli
    address routerAddress;
    IUniswapRouter02 router;

    // Factory Goerli
    address factoryAddress;
    IUniswapV2Factory factory;

    // Tokens
    IERC20 tokenA;
    IERC20 tokenB;

    address pairAddress;

    event Liquidity(uint256 amntA, uint256 amntB, uint256 liquidity);

    function initialize(address _tokenA, address _tokenB) external initializer {
        __UUPSUpgradeable_init();

        routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        router = IUniswapRouter02(routerAddress);

        factoryAddress = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
        factory = IUniswapV2Factory(factoryAddress);

        tokenB = IERC20(_tokenA);
        tokenA = IERC20(_tokenB);
    }

    function createPair() public {
        pairAddress = factory.createPair(address(tokenA), address(tokenB));
    }

    function getPair() public view returns (address) {
        return factory.getPair(address(tokenA), address(tokenB));
    }

    function addLiquidity()
        public
        returns (uint amntA, uint amntB, uint liquidity)
    {
        uint256 amountA = 25000 * 10 ** 18;
        uint256 amountB = 1000 * 10 ** 18;

        tokenA.approve(routerAddress, amountA);
        tokenB.approve(routerAddress, amountB);

        (amntA, amntB, liquidity) = router.addLiquidity(
            address(tokenA),
            address(tokenB),
            amountA,
            amountB,
            1,
            1,
            msg.sender,
            block.timestamp
        );

        emit Liquidity(amntA, amntB, liquidity);
    }

    function swapExactTokensForTokens(
        uint amountIn
    ) external returns (uint[] memory amounts) {
        uint256 amountOutMin = 1;
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        address to = msg.sender;
        uint256 deadline = block.timestamp;
        /**
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
         */

        tokenA.approve(routerAddress, amountIn);

        return
            router.swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                path,
                to,
                deadline
            );
    }

    event SwapTokensForExactTokens(uint[] amounts);

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax
    ) external returns (uint[] memory amounts) {
        address[] memory path = new address[](2);
        path[0] = address(tokenB);
        path[1] = address(tokenA);
        address to = msg.sender;
        uint256 deadline = block.timestamp;
        /**
            uint amountOut,
            uint amountInMax,
            address[] calldata path,
            address to,
            uint deadline
         */

        tokenB.transferFrom(msg.sender, address(this), amountInMax);
        tokenB.approve(routerAddress, amountInMax);

        uint[] memory _amounts = router.swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            to,
            deadline
        );

        tokenB.transfer(msg.sender, amountInMax - _amounts[0]);

        emit SwapTokensForExactTokens(_amounts);

        return _amounts;
    }

    function _authorizeUpgrade(address newImplementation) internal override {}
}
