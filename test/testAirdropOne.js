const { expect } = require("chai");

const getRole = (role) =>
  hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));

const MINTER_ROLE = getRole("MINTER_ROLE");
const BURNER_ROLE = getRole("BURNER_ROLE");

describe("MI PRIMER TOKEN TESTING", function () {
  var MiPrimerToken, AirdropONE;
  var miPrimerToken, airdropONE;
  var owner, alice, bob, carl, earl, deysi;

  before(async () => {
    // cuentas de prueba (10)
    [owner, alice, bob, carl, earl, deysi] = await hre.ethers.getSigners();
  });

  describe("Set Up", () => {
    it("Publicar los contratos", async () => {
      var name = "Mi Primer Token";
      var symbol = "MPRTKN";
      MiPrimerToken = await hre.ethers.getContractFactory("MiPrimerToken");
      miPrimerToken = await MiPrimerToken.deploy(name, symbol);

      AirdropONE = await hre.ethers.getContractFactory("AirdropONE");
      airdropONE = await AirdropONE.deploy(miPrimerToken.address);

      // set up
      await miPrimerToken.grantRole(MINTER_ROLE, airdropONE.address);
    });
  });

  describe("Mi Primer Token", () => {
    it("Método 'mint' está protegido", async () => {
      var MIL_TOKENS = hre.ethers.utils.parseEther("1000");
      // esta transacción fallará

      var mint = miPrimerToken.connect(alice).mint;
      var tx = mint(alice.address, MIL_TOKENS);
      await expect(tx).to.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Verificar que owner tiene MINTER_ROLE", async () => {
      // hasRole - valida que una cuenta tiene un rol
      var hasRole = await miPrimerToken.hasRole(MINTER_ROLE, owner.address);
      expect(hasRole).to.be.true;
    });

    it("Método 'burn' está protegido", async () => {
      var MIL_TOKENS = hre.ethers.utils.parseEther("1000");

      var burn =
        miPrimerToken.connect(alice).functions["burn(address,uint256)"];
      var tx = burn(bob.address, MIL_TOKENS);
      await expect(tx).to.revertedWith(
        `AccessControl: account ${alice.address.toLowerCase()} is missing role ${BURNER_ROLE}`
      );
    });
  });

  describe("Contrato Airdrop", () => {
    it("Address del token es correcto", async () => {
      var tokenAddEnAirdrop = await airdropONE.miPrimerTokenAdd();
      expect(tokenAddEnAirdrop).to.be.equal(miPrimerToken.address);
    });

    describe("Participar en airdrop", () => {
      it("Participante está en lista blanca", async () => {
        var tx = airdropONE.connect(bob).participateInAirdrop();
        await expect(tx).to.revertedWith("No esta en lista blanca");
      });

      it("Participante ya participó", async () => {
        // agregar bob a la lista blanca
        await airdropONE.connect(owner).addToWhiteList(bob.address);
        await airdropONE.connect(bob).participateInAirdrop();
        var tx = airdropONE.connect(bob).participateInAirdrop();
        await expect(tx).to.revertedWith("Ya ha participado");
      });

      it("Participant recibió tokens", async () => {
        // bob ha participado en airdrop
        var balanceBob = await miPrimerToken.balanceOf(bob.address);
        // balanceBob >= 1 && balanceBob <= 1000
        var ONE_TOKEN = hre.ethers.utils.parseEther("1");
        var MIL_TOKEN = hre.ethers.utils.parseEther("1000");
        // gte => greater and equal => mayor o igual
        // lte => lower and equal => menor o igual
        expect(balanceBob.gte(ONE_TOKEN) && balanceBob.lte(MIL_TOKEN)).to.be
          .true;
      });
    });
  });
});

/**
 * Escenarios para testing
 *
 * Mi Primer Token
 *
 * 1. Testear que el metodo 'mint' esté protegido
 * 2. Testear que el metodo 'burn' esté protegido
 *
 * Airdrop
 *
 * 1. Verificar address del token en Airdrop es correcto
 * 2. Participar en el Airdrop
 *  2.1 Validar si está en whitelist
 *  2.2 Validar si el usuario ha participado en airdrop
 *  2.3 Validar que no se exceda del total de tokens
 *  2.4 Validar que el usuario ha recibido tokens
 */
