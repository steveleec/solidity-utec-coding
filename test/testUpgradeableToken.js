const { expect } = require("chai");

describe("UPGRADEABLE TOKEN", function () {
  var UpgradeableToken;
  var upgradeableToken;
  var UpgradeableToken2;
  var upgradeableToken2;
  var name = "UpgradeableToken";
  var symbol = "UPGRDTKN";

  var owner, alice;

  before(async () => {
    [owner, alice] = await hre.ethers.getSigners();
  });

  describe("Set Up", () => {
    it("Publicar los contratos", async () => {
      UpgradeableToken = await hre.ethers.getContractFactory(
        "UpgradeableToken"
      );
      // upgradeableToken = await UpgradeableToken.deploy();
      // upgradeableToken = await hre.upgrades.deployProxy(UpgradeableToken);
      upgradeableToken = await hre.upgrades.deployProxy(UpgradeableToken, {
        kind: "uups",
      });

      var implmntAddress = await upgrades.erc1967.getImplementationAddress(
        upgradeableToken.address
      );
      console.log("El Proxy address es (V2):", upgradeableToken.address);
      console.log("El Implementation address es (V2):", implmntAddress);
    });
  });

  describe("Nombre y simbolo", () => {
    it("Verifica nombre del token", async () => {
      var nameToken = await upgradeableToken.name();
      expect(nameToken).to.be.equal(name);
    });

    it("Verifica symbolo del token del token", async () => {
      var symbolToken = await upgradeableToken.symbol();
      expect(symbolToken).to.be.equal(symbol);
    });
  });

  describe("Actualiza Smart Contract", () => {
    it("Publica Smart Contract", async () => {
      UpgradeableToken2 = await hre.ethers.getContractFactory(
        "UpgradeableToken2"
      );

      upgradeableToken2 = await hre.upgrades.upgradeProxy(
        upgradeableToken,
        UpgradeableToken2
      );

      var implmntAddress = await upgrades.erc1967.getImplementationAddress(
        upgradeableToken.address
      );
      console.log("El Proxy address es (V2):", upgradeableToken2.address);
      console.log("El Implementation address es (V2):", implmntAddress);
    });

    it("Ejecuta el método mint de V2", async () => {
      var MIL_TOKENS = hre.ethers.utils.parseEther("1000");
      await upgradeableToken2.mint(alice.address, MIL_TOKENS);

      expect(await upgradeableToken2.balanceOf(alice.address)).to.be.equal(
        MIL_TOKENS
      );

      console.log(
        (await upgradeableToken2.balanceOf(owner.address)).toString()
      );
    });
  });
});
