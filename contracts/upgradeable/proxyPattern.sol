// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IContratoConFallback {
    function metodoNoExiste() external;

    function increaseCounterInTen() external returns (uint256);
}

// Nosotros
contract Llamante {
    uint256 public counterFromCallback;

    function llamarContratoFallback(
        address _scAddress
    ) external returns (uint256) {
        counterFromCallback = IContratoConFallback(_scAddress)
            .increaseCounterInTen();
        return counterFromCallback;
    }
}

// Proxy
contract ContratoConFallback {
    uint256 public counter;
    address contratoLogicaAddress;

    function setContratoLogica(address _scAddress) external {
        contratoLogicaAddress = _scAddress;
    }

    fallback(bytes calldata _input) external returns (bytes memory _output) {
        bool _success;
        (_success, _output) = contratoLogicaAddress.delegatecall(_input);
        if (!_success) {
            assembly {
                revert(add(_output, 0x20), mload(_output))
            }
        }
    }
}

// Logic - implementation
contract contratoDeLogica {
    uint256 public counter;
    address contratoLogicaAddress;

    function increaseCounterInTen() external returns (uint256) {
        counter += 10;
        return counter;
    }
}
