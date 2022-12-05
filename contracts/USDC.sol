// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Goerli verified: 0xD8415F64d6DCa99a282b6433A29A060230820C86
contract USDCoin6 is ERC20, ERC20Burnable, Ownable {
    event Purchase(address owner, uint256 typeNft);

    constructor() ERC20("USD Coin 6", "USDC") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
