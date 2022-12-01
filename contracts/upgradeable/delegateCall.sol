// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// REQUSITO: Ambos contratos tienen el mismo storage layout
// Publicar en primer lugar el contrato 'contratoASerLlamado'

// En el contrato 'contratoQueVaALlamar',
// se ejecuta el método 'addToWhitelist'
// Al hacerlo, se escribe sobre 'contratoQueVaALlamar'
// usando el código de 'contratoASerLlamado'

contract contratoASerLlamado {
    mapping(address => bool) public whitelist;

    function addToWhitelist(address _account) external {
        whitelist[_account] = true;
    }
}

contract contratoQueVaALlamar {
    mapping(address => bool) public whitelist;

    function addToWhitelist(address _scAddress, address _account) external {
        (bool success, bytes memory data) = _scAddress.delegatecall(
            abi.encodeWithSignature("addToWhitelist(address)", _account)
        );

        if (!success) {
            revert(string(data));
        }
    }
}
