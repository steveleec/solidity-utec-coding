const { expect } = require("chai");
const { ethers } = require("hardhat");

const getRole = (role) =>
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

async function advanceTime(extratime) {
  // se obtiene el timestamp del blocke
  var blockNumBefore = await ethers.provider.getBlockNumber();
  var blockBefore = await ethers.provider.getBlock(blockNumBefore);
  var timestampBefore = blockBefore.timestamp;

  // se instruye al blockchain interno de añadir x segundos
  await network.provider.send("evm_setNextBlockTimestamp", [
    timestampBefore + extratime,
  ]);

  // se mina un nuevo bloque con el nuevo tiempo
  await network.provider.send("evm_mine");
}

describe("MI PRIMER TOKEN TESTING", function () {
  var MiPrimerToken, AirdropTwo;
  var miPrimerToken, airdropTwo;
  var owner, alice, bob, carl, deysi, estefan;

  before(async () => {
    [owner, alice, bob, carl, deysi, estefan] = await ethers.getSigners();
  });

  async function publicarMiPrimerToken() {
    var name = "Mi Primer Token";
    var symbol = "MPRTKN";

    // publicar MiPrimerToken
    MiPrimerToken = await hre.ethers.getContractFactory("MiPrimerToken");
    miPrimerToken = await MiPrimerToken.deploy(name, symbol);
  }

  async function publicarAirdropTwo() {
    // publicar AirdropTwo
    AirdropTwo = await hre.ethers.getContractFactory("AirdropTwo");
    airdropTwo = await AirdropTwo.deploy(miPrimerToken.address);

    // Set Up
    await airdropTwo.setTokenAddress(miPrimerToken.address);

    // Set up Roles Token => Airdrop
    await miPrimerToken.grantRole(MINTER_ROLE, airdropTwo.address);
    await miPrimerToken.grantRole(BURNER_ROLE, airdropTwo.address);

    // Entrega tokens al smart contract
    await miPrimerToken.mint(
      airdropTwo.address,
      ethers.utils.parseEther("100000")
    );
  }

  before(async () => {
    await publicarMiPrimerToken();
  });

  describe("MiPrimerToken", () => {
    it("mint protegido por MITNER_ROLE", async () => {
      const mint = miPrimerToken.connect(alice).mint;
      await expect(
        mint(alice.address, ethers.utils.parseEther("1000"))
      ).to.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("burn protegido por BURNER_ROLE", async () => {
      const burn =
        miPrimerToken.connect(alice).functions["burn(address,uint256)"];
      await expect(
        burn(bob.address, ethers.utils.parseEther("1000"))
      ).to.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${BURNER_ROLE}`
      );
    });
  });

  describe("AidropTwo", () => {
    beforeEach(async () => {
      await publicarMiPrimerToken();
      await publicarAirdropTwo();
    });

    describe("Airdrop BALANCE", () => {
      it("Tokens insuficientes", async () => {
        // extrae todos los tokens
        await airdropTwo.transferTokensFromSmartContract();

        // intenta participar sin fondos
        const participateInAirdrop =
          airdropTwo.connect(bob).functions["participateInAirdrop()"];
        await expect(participateInAirdrop()).to.revertedWith(
          "El contrato Airdrop no tiene tokens suficientes"
        );
      });
    });

    describe("AirdropTwo SIN REFERIDO", () => {
      it("No participa dentro del mismo día", async () => {
        const participateInAirdrop =
          airdropTwo.connect(bob).functions["participateInAirdrop()"];

        // primera participación
        await participateInAirdrop();

        // segunda participación
        await expect(participateInAirdrop()).to.revertedWith(
          "Ya participaste en el ultimo dia"
        );
      });

      it("Participa hasta 10 veces", async () => {
        // un día en segundos
        const ONE_DAY = 60 * 60 * 24;

        // abstrae el método 'participateInAirdrop'
        const participateInAirdrop =
          airdropTwo.connect(bob).functions["participateInAirdrop()"];

        // loop para que se llame a sí mismo hasta 10 veces
        const LIMIT = 10;
        let COUNTER = 1;
        async function participateAndAdvance() {
          if (COUNTER > LIMIT) return;
          COUNTER++;
          await participateInAirdrop();
          await advanceTime(ONE_DAY);
          await participateAndAdvance();
        }
        await participateAndAdvance();

        // vez número 11 arroja error
        await expect(participateInAirdrop()).to.revertedWith(
          "Llegaste limite de participaciones"
        );
      });

      it("Participante recibió tokens", async () => {
        // abstrae el método 'participateInAirdrop'
        const participateInAirdrop =
          airdropTwo.connect(bob).functions["participateInAirdrop()"];

        // participa en airdrop
        await participateInAirdrop();

        var bobBal = await miPrimerToken.balanceOf(bob.address);
        expect(
          bobBal.gte(ethers.utils.parseEther("1000")) &&
            bobBal.lte(ethers.utils.parseEther("5000"))
        );
      });

      it("Se descuentan tokens del Smart Contract", async () => {
        // abstrae el método 'participateInAirdrop'
        const participateInAirdrop =
          airdropTwo.connect(bob).functions["participateInAirdrop()"];

        // balance previo al airdrop
        var balPrevSC = await miPrimerToken.balanceOf(airdropTwo.address);

        // participa en airdrop
        await participateInAirdrop();
        var bobBal = await miPrimerToken.balanceOf(bob.address);

        // balance posterior al airdrop
        var balAfterSC = await miPrimerToken.balanceOf(airdropTwo.address);

        expect(balPrevSC.sub(balAfterSC)).to.be.equal(bobBal);
      });
    });

    describe("AirdropTwo CON REFERIDO", () => {
      it("El que refirió (existente) recibe premio", async () => {
        // alice participa
        // bob participa
        // alice es la que refirió
        await airdropTwo.connect(alice).functions["participateInAirdrop()"]();

        // Limite de participaciones previo
        var [
          cuentaParticipante,
          participaciones,
          limiteParticipaciones,
          ultimaVezParticipado,
        ] = await airdropTwo.participantes(alice.address);
        var prevLimiteParticipaciones = limiteParticipaciones;

        // abstrae el método 'participateInAirdrop'
        const participateInAirdrop =
          airdropTwo.connect(bob).functions["participateInAirdrop(address)"];

        // bob participa en airdrop y refiere a Alice
        await participateInAirdrop(alice.address);

        // Limite de participaciones posterior
        var [
          cuentaParticipante,
          participaciones,
          limiteParticipaciones,
          ultimaVezParticipado,
        ] = await airdropTwo.participantes(alice.address);
        var postLimiteParticipaciones = limiteParticipaciones;

        expect(
          postLimiteParticipaciones.sub(prevLimiteParticipaciones)
        ).to.be.equal(3);
      });

      it("No se puede referir a sí mismo", async () => {
        // abstrae el método 'participateInAirdrop'
        const participateInAirdrop =
          airdropTwo.connect(bob).functions["participateInAirdrop(address)"];

        // bob participa en airdrop y refiere a Alice
        await expect(participateInAirdrop(bob.address)).to.revertedWith(
          "No puede autoreferirse"
        );
      });

      it("El que refirió (no existente) recibe premio", async () => {
        // abstrae el método 'participateInAirdrop'
        const participateInAirdrop =
          airdropTwo.connect(bob).functions["participateInAirdrop(address)"];

        // bob participa en airdrop y refiere a Carl (no existente)
        await participateInAirdrop(carl.address);

        // Limite de participaciones Carl
        var [
          cuentaParticipante,
          participaciones,
          limiteParticipaciones,
          ultimaVezParticipado,
        ] = await airdropTwo.participantes(carl.address);
        expect(limiteParticipaciones).to.be.equal(13);
      });
    });
  });
});

/**
 * Escenarios para testing
 *
 * MiPrimerToken
 *
 * 1. validar que mint está protegido por el rol MINTER_ROLE
 * 2. validar que burn está protegido por el rol BURNER_ROLE
 *
 * AirdropTwo
 *
 * 1. Participa en airdrop - sin referido
 *  1.1 Valida que el contrato tenga suficientes tokens
 *  1.2 Valida que no participo dentro del mismo día
 *  1.3 Valida que solo puede participar hasta 10 veces
 *  1.4 Valida que el participante recibió tokens
 *
 * 2. Participa en airdrop - con referido
 *  2.1 El referido existente recibo tres participaciones adicionales
 *  2.2 No puede ser referido por sí mismo
 *  2.3 El referido no existente recibo tres participaciones adicionales
 */
