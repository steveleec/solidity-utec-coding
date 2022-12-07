const { expect } = require("chai");
const { ethers } = require("hardhat");

const getRole = (role) =>
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

describe("MI PRIMER TOKEN TESTING", function () {
  var TokenUpgradeableAirdrop, AirdropONEUpgradeable;
  var tokenUpgradeableAirdrop, airdropONEUpgradeable;
  var owner, alice, bob, carl, deysi, estefan;

  before(async () => {
    [owner, alice, bob, carl, deysi, estefan] = await ethers.getSigners();
  });

  describe("Set Up", () => {
    it("Publicar los contratos", async () => {
      var name = "Mi Primer Token Upgradeable";
      var symbol = "MPRTKNUPGRD";

      // publicar TokenUpgradeableAirdrop
      TokenUpgradeableAirdrop = await hre.ethers.getContractFactory(
        "TokenUpgradeableAirdrop"
      );
      tokenUpgradeableAirdrop = await hre.upgrades.deployProxy(
        TokenUpgradeableAirdrop,
        [name, symbol],
        {
          kind: "uups",
        }
      );

      // publicar AirdropONEUpgradeable
      AirdropONEUpgradeable = await hre.ethers.getContractFactory(
        "AirdropONEUpgradeable"
      );
      airdropONEUpgradeable = await hre.upgrades.deployProxy(
        AirdropONEUpgradeable,
        [tokenUpgradeableAirdrop.address],
        { kind: "uups" }
      );

      // Set Up
      await airdropONEUpgradeable.setTokenAddress(
        tokenUpgradeableAirdrop.address
      );

      // Set up Roles Token => Airdrop
      await tokenUpgradeableAirdrop.grantRole(
        MINTER_ROLE,
        airdropONEUpgradeable.address
      );
      await tokenUpgradeableAirdrop.grantRole(
        BURNER_ROLE,
        airdropONEUpgradeable.address
      );
    });
  });

  describe("TokenUpgradeableAirdrop", () => {
    it("mint protegido por MITNER_ROLE", async () => {
      const mint = tokenUpgradeableAirdrop.connect(alice).mint;
      await expect(
        mint(alice.address, ethers.utils.parseEther("1000"))
      ).to.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("burn protegido por BURNER_ROLE", async () => {
      const burn =
        tokenUpgradeableAirdrop.connect(alice).functions[
          "burn(address,uint256)"
        ];
      await expect(
        burn(bob.address, ethers.utils.parseEther("1000"))
      ).to.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${BURNER_ROLE}`
      );
    });
  });

  describe("AidropOne", () => {
    it("Address correcto del token TokenUpgradeableAirdrop", async () => {
      var tokenAdd = await airdropONEUpgradeable.miPrimerTokenAdd();
      expect(tokenAdd).to.be.equal(tokenUpgradeableAirdrop.address);
    });

    describe("Participa en Aidrop", () => {
      it("Participante debe estar en lista blanca", async () => {
        // bob => no está en lista blanca
        await expect(
          airdropONEUpgradeable.connect(bob).participateInAirdrop()
        ).to.revertedWith("No esta en lista blanca");

        // agreguemos a bob a la lista blanca
        await airdropONEUpgradeable.connect(owner).addToWhiteList(bob.address);

        // bob puede participar
        await airdropONEUpgradeable.connect(bob).participateInAirdrop();
      });

      it("Participante ya participó", async () => {
        await expect(
          airdropONEUpgradeable.connect(bob).participateInAirdrop()
        ).to.revertedWith("Ya ha participado");
      });

      it("Participante recibió tokens", async () => {
        var balBobMiPrimerTkn = await tokenUpgradeableAirdrop.balanceOf(
          bob.address
        );
        // balBobMiPrimerTkn >= 1 && balBobMiPrimerTkn <= 1000
        // balBobMiPrimerTkn es un big number que tiene propiedades
        // BigNumber.gte: mayor e igual
        // BigNumber.lte: menor e igual
        // console.log(ethers.utils.formatEther(balBobMiPrimerTkn));
        expect(
          balBobMiPrimerTkn.gte(ethers.utils.parseEther("1")) &&
            balBobMiPrimerTkn.lte(ethers.utils.parseEther("1000"))
        ).to.be.true;
      });
    });

    describe("Quema de tokens", () => {
      it("Usuario no ha participado", async () => {
        // carl no ha participado
        await expect(
          airdropONEUpgradeable.connect(carl).quemarMisTokensParaParticipar()
        ).to.revertedWith("Usted aun no ha participado");
      });

      it("Usuario no tiene balance", async () => {
        // carl se añade a la lista blanca
        await airdropONEUpgradeable.addToWhiteList(carl.address);
        // carl solicita tokens - ha participado
        await airdropONEUpgradeable.connect(carl).participateInAirdrop();
        // disminuye su balance por debajo de lo requerido
        var balCarl = await tokenUpgradeableAirdrop.balanceOf(carl.address);
        await tokenUpgradeableAirdrop
          .connect(carl)
          .transfer(alice.address, balCarl.sub(ethers.utils.parseEther("5")));

        await expect(
          airdropONEUpgradeable.connect(carl).quemarMisTokensParaParticipar()
        ).to.revertedWith("No tiene suficientes tokens para quemar");
      });

      it("Tokens quemados correctamente", async () => {
        // tokens a quemar
        const tokensAQuemar = ethers.utils.parseEther("10");
        // alice se añade a la lista blanca
        await airdropONEUpgradeable.addToWhiteList(alice.address);
        // alice solicita tokens - ha participado
        await airdropONEUpgradeable.connect(alice).participateInAirdrop();
        // balance antes de quemar
        var balPrev = await tokenUpgradeableAirdrop.balanceOf(alice.address);
        // alice quema sus tokens
        await airdropONEUpgradeable
          .connect(alice)
          .quemarMisTokensParaParticipar();
        // balance después de quemar
        var balAfter = await tokenUpgradeableAirdrop.balanceOf(alice.address);
        expect(balPrev.sub(balAfter)).to.be.equal(tokensAQuemar);
      });

      it("Habilitado de participar", async () => {
        const puedeParticipar = await airdropONEUpgradeable.haSolicitado(
          alice.address
        );
        expect(puedeParticipar).to.be.false;
      });
    });

    it("Lista blanca - añadido correctamente", async () => {
      // antes de participar
      var enLista = await airdropONEUpgradeable.whiteList(deysi.address);
      expect(enLista).to.be.false;

      // se añade a la lista blanca
      await airdropONEUpgradeable.addToWhiteList(deysi.address);

      // después de participar
      var enLista = await airdropONEUpgradeable.whiteList(deysi.address);
      expect(enLista).to.be.true;
    });

    it("Lista blanca - removido correctamente", async () => {
      // se añade a la lista blanca
      await airdropONEUpgradeable.addToWhiteList(estefan.address);
      var enLista = await airdropONEUpgradeable.whiteList(estefan.address);
      expect(enLista).to.be.true;

      /// se le quita de la lista blanca
      await airdropONEUpgradeable.removeFromWhitelist(estefan.address);
      var enLista = await airdropONEUpgradeable.whiteList(estefan.address);
      expect(enLista).to.be.false;
    });
  });
});

/**
 * Escenarios para testing
 *
 * TokenUpgradeableAirdrop
 *
 * 1. validar que mint está protegido por el rol MINTER_ROLE
 * 2. validar que burn está protegido por el rol BURNER_ROLE
 *
 * AIrdropONE
 *
 * 1. Validar que el address del token sea el correcto
 *
 * 2. Participar en airdrop
 *  2.1 Validar que esté en lista blanca
 *  2.2 Validar que ya haya participado
 *  2.3 Validar que haya recibido una cantidad de tokens apropiada
 *
 * 3. Quemar tokens para participar
 *  3.1 Validar que ha participado
 *  3.2 Validar que tiene el balance suficiente para quemar
 *  3.3 Verificar que sus tokens fueron quemados
 *  3.4 Verificar que puede volver a participar
 *
 * 4. Añadir a lista blanca
 *  4.1 Verificar se añade correctamente a la lista blanca
 *
 * 5. Remover de lista blanca
 *  5.1 Verificar se remueve correctamente de la lista blanca
 */
