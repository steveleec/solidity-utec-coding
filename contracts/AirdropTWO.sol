// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
2. REPETIBLE CON LÍMITE, PREMIO POR REFERIDO

* El usuario puede participar en el airdrop una vez por día hasta un límite de 10 veces
* Si un usuario participa del airdrop a raíz de haber sido referido, el que refirió gana 3 días adicionales para poder participar
* El contrato Airdrop mantiene los tokens para repartir (no llama al `mint` )
* El contrato Airdrop tiene que verificar que el `totalSupply`  del token no sobrepase el millón
* El método `participateInAirdrop` le permite participar por un número random de tokens de 1000 - 5000 tokens
*/

interface IMiPrimerTKN {
    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract AirdropTwo is Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // instanciamos el token en el contrato
    IMiPrimerTKN miPrimerToken;

    struct Participant {
        address cuentaParticipante; // eso me ayudará a saber si ya está registrado
        uint256 participaciones;
        uint256 limiteParticipaciones;
        uint256 ultimaVezParticipado;
    }
    mapping(address => Participant) public participantes;

    constructor(address _tokenAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        miPrimerToken = IMiPrimerTKN(_tokenAddress);
    }

    function participateInAirdrop() public {
        _participateInAirdrop(address(0));
    }

    function participateInAirdrop(address _elQueRefirio) public {
        _participateInAirdrop(_elQueRefirio);
    }

    function _participateInAirdrop(address _account) internal {
        // si esto se cumple, es porque el usuario es nuevo
        // solo funciona si es la primera vez que participa
        // de lo contrario ya se tiene guardado el registro del usuario
        if (participantes[msg.sender].cuentaParticipante == address(0)) {
            // crear el registro del participante
            Participant memory participant = Participant({
                cuentaParticipante: msg.sender,
                participaciones: 1,
                limiteParticipaciones: 10,
                ultimaVezParticipado: block.timestamp
            });

            // guardar el registro del participante
            participantes[msg.sender] = participant;
        } else {
            // está reclamando por segunda vez
            Participant memory participant = participantes[msg.sender];

            // verificar que no se haya participado en el último día
            // 1 days = 86400 seconds
            require(
                participant.ultimaVezParticipado + 1 days < block.timestamp,
                "Ya participaste en el ultimo dia"
            );

            // verificar que no se haya excedido el límite de participaciones
            require(
                participant.participaciones < participant.limiteParticipaciones,
                "Llegaste limite de participaciones"
            );

            // actualizar el registro del participante
            participantes[msg.sender].participaciones++;
            participantes[msg.sender].ultimaVezParticipado = block.timestamp;
        }

        // calcular el número random de tokens a recibir
        uint256 tokensToReceive = _getRadomNumber10005000();

        // verificar que el Contrato Airdrop tenga los tokens para repartir
        uint256 balTokensAirdrop = miPrimerToken.balanceOf(address(this));
        require(
            balTokensAirdrop >= tokensToReceive,
            "El contrato Airdrop no tiene tokens suficientes"
        );

        // transferir los tokens al usuario haciendo uso de la interfaz
        // transfer descuenta los tokens de quien llama el método
        // en este caso el que llama es el contrato Airdrop
        miPrimerToken.transfer(msg.sender, tokensToReceive);

        // manejar el caso de que el usuario haya sido referido
        require(msg.sender != _account, "No puede autoreferirse");
        if (_account != address(0)) _manejarReferido(_account);
    }

    function _manejarReferido(address _elQueRefirio) internal {
        if (participantes[_elQueRefirio].cuentaParticipante != address(0)) {
            participantes[_elQueRefirio].limiteParticipaciones += 3;
        } else {
            // crear el registro del participante
            Participant memory participant = Participant({
                cuentaParticipante: _elQueRefirio,
                participaciones: 0,
                limiteParticipaciones: 13,
                ultimaVezParticipado: block.timestamp
            });

            // guardar el registro del participante
            participantes[_elQueRefirio] = participant;
        }
    }

    ///////////////////////////////////////////////////////////////
    ////                     HELPER FUNCTIONS                  ////
    ///////////////////////////////////////////////////////////////

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _getRadomNumber10005000() internal view returns (uint256) {
        return
            (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) %
                4000) +
            1000 +
            1;
    }

    function setTokenAddress(address _tokenAddress) external {
        miPrimerToken = IMiPrimerTKN(_tokenAddress);
    }

    function transferTokensFromSmartContract()
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        miPrimerToken.transfer(
            msg.sender,
            miPrimerToken.balanceOf(address(this))
        );
    }
}
