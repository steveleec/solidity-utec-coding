const { expect } = require("chai");
const { upgrades } = require("hardhat");

describe("MI PRIMER TOKEN TESTING", function () {
  var MiPrimerToken;
  var miPrimerToken;
  var name = "UpgradeableToken";
  var symbol = "UPGRTKN";
  var owner, alice;

  // contrato actualizado
  var MiPrimerToken2;
  var miPrimerToken2;

  before(async () => {
    [owner, alice] = await hre.ethers.getSigners();
  });

  describe("Set Up", () => {
    it("Publicar los contratos", async () => {
      MiPrimerToken = await hre.ethers.getContractFactory("UpgradeableToken");
      // miPrimerToken = await MiPrimerToken.deploy();
      miPrimerToken = await hre.upgrades.deployProxy(MiPrimerToken, {
        kind: "uups",
      });

      var implementationAddress =
        await upgrades.erc1967.getImplementationAddress(miPrimerToken.address);

      console.log("Proxy Address:", miPrimerToken.address);
      console.log("Implementation Address:", implementationAddress);
    });
  });

  describe("Nombre y simbolo", () => {
    it("Verifica nombre del token", async () => {
      var nameToken = await miPrimerToken.name();
      expect(nameToken).to.be.equal(name);
    });

    it("Verifica symbolo del token del token", async () => {
      var symbolToken = await miPrimerToken.symbol();
      expect(symbolToken).to.be.equal(symbol);
    });
  });

  describe("Actualiza smart contract", () => {
    it("Publicando smart contract", async () => {
      MiPrimerToken2 = await hre.ethers.getContractFactory("UpgradeableToken2");

      miPrimerToken2 = await hre.upgrades.upgradeProxy(
        miPrimerToken,
        MiPrimerToken2
      );

      var implementationAddress =
        await upgrades.erc1967.getImplementationAddress(miPrimerToken2.address);

      console.log("Proxy Address:", miPrimerToken2.address);
      console.log("Implementation Address:", implementationAddress);
    });

    it("Mint", async () => {
      var MIL_TOKENS = await hre.ethers.utils.parseEther("1000");
      await miPrimerToken2.mint(alice.address, MIL_TOKENS);

      expect(await miPrimerToken2.balanceOf(alice.address)).to.be.equal(
        MIL_TOKENS
      );
    });
  });
});
