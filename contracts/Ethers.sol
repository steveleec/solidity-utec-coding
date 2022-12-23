// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ReceiverFallback {
    event Received(uint256 etherAmount);
    event Fallback(uint256 etherAmount);

    fallback() external payable {
        emit Fallback(msg.value);
    }
}

contract ReceiverReceived {
    uint256 etherReceived;

    event Received(uint256 etherAmount);
    event Fallback(uint256 etherAmount);
    event MethodIncrease(uint256 etherAmount);

    function increaseEther() public payable {
        emit MethodIncrease(msg.value);
        etherReceived += msg.value;

        for (uint256 i; i < 10; i++) {
            booleans[i] = true;
        }
    }

    mapping(uint256 => bool) booleans;

    receive() external payable {
        emit Received(msg.value);
        etherReceived += msg.value;

        for (uint256 i; i < 10; i++) {
            booleans[i] = true;
        }
    }

    fallback() external payable {
        emit Fallback(msg.value);
        etherReceived += msg.value;
    }
}

contract Sender {
    constructor() payable {}

    // 1 - Seguro a atques de reentrada dado que solo se pasa 2300 de gas al otro contrato
    // 2 - 'send' es el low-level contraparte de 'transfer'
    // 3 - Se usa cuando se quiere manejar el error en el contrato sin revertir todos los cambios de estado
    function send(address _scAddress, uint256 _amount) public {
        bool success = payable(_scAddress).send(_amount);
        require(success, "Transfer failed");
    }

    // 1 - Se debe usar como último recurso
    // 2 - Permite definir la cantidad de gas a gastar
    function call(address _scAddress, uint256 _amount) public {
        (bool success, ) = payable(_scAddress).call{
            value: _amount,
            gas: 500000
        }("");
        require(success, "Transfer failed");
    }

    function callWithMethod(address _scAddress, uint256 _amount) public {
        (bool success, ) = payable(_scAddress).call{
            value: _amount,
            gas: 500000
        }(abi.encodeWithSignature("increaseEther()"));
        require(success, "Transfer failed");
    }

    // 1 - Seguro a atques de reentrada dado que solo se pasa 2300 de gas al otro contrato
    // 2 - Este método es el recomendado de usar por encima de los otros - revierte automaticamente en caso de errores
    function transfer(address _scAddress, uint256 _amount) public {
        payable(_scAddress).transfer(_amount);
    }
}
