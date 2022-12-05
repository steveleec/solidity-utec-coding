// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IUSDC {
    function transfer() external;
}

// Goerli verified: 0xCb6d59738799636d62aaFbdfcC0Ef17c32625937
contract CompraNFT is Ownable {
    event PurchaseNFT(address owner);

    constructor() {}

    function purchaseNFT() public {
        // obtenemos el USDC del comprador
        // usdc.transferFrom(msg.sender, address(this), amount);

        // emitimos el evento para Sentinel (defender);
        emit PurchaseNFT(msg.sender);
    }
}
