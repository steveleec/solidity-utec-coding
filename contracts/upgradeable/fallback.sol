// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface II {
    function transfer() external;
}

// Nosotros
contract Llamante {
    bytes public argCodified =
        abi.encodeWithSignature("metodoNoExiste(uint256)", 123456);
    uint256 public resultFromCallback;

    function llamarContratoFallback2(address _scAddress) external {
        (bool success, bytes memory output) = _scAddress.call(argCodified);
        require(success, "Error en la llamada al Proxy");

        // decodificando el resultado que viene de fallback
        resultFromCallback = abi.decode(output, (uint256));
    }
}

// Proxy / 2
contract ContratoConFallback {
    uint256 public counter;
    bytes public input;

    // no existe el metodo transfer
    // function transfer
    // no existe el metodo mint

    fallback(bytes calldata _input) external returns (bytes memory _output) {
        input = _input;
        counter++;
        _output = abi.encode(counter);
    }
}
