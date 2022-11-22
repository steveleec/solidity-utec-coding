const { expect } = require("chai");

describe("MI PRIMER TOKEN TESTING", function () {
  var MiPrimerToken, AirdropOne;
  var miPrimerToken, airdropOne;

  describe("Set Up", () => {
    it("Publicar los contratos", async () => {
      var name = "Mi Primer Token";
      var symbol = "MPRTKN";

      // publicar MiPrimerToken
      MiPrimerToken = await hre.ethers.getContractFactory("MiPrimerToken");
      miPrimerToken = await MiPrimerToken.deploy(name, symbol);

      // publicar AirdropOne
      AirdropOne = await hre.ethers.getContractFactory("AirdropONE");
      airdropOne = await AirdropOne.deploy(miPrimerToken.address);

      // Set Up
      await airdropOne.setTokenAddress(miPrimerToken.address);

      // Set up Roles Token => Airdrop
      await miPrimerToken.grantRole(MINTER_ROLE, airdropOne.address);
      await miPrimerToken.grantRole(BURNER_ROLE, airdropOne.address);
    });
  });
});
