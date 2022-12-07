require("dotenv").config();

const {
  getRole,
  verify,
  executeSet,
  printAddress,
  deploySC,
} = require("./utils");

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

async function main() {
  var name = "Mi Primer Token Upgradeable";
  var symbol = "MPRTKNUPGRD";

  // publicar TokenUpgradeableAirdrop
  var token = await deploySC("TokenUpgradeableAirdrop", [name, symbol]);

  // getting addresses
  var tokenImp = await printAddress("Token", token.address);

  // publicar AirdropONEUpgradeable
  var airdrop = await deploySC("AirdropONEUpgradeable", [token.address]);

  // getting addresses
  var airdropImp = await printAddress("Airdrop", airdrop.address);

  // Set Up
  await airdrop.setTokenAddress(token.address);

  // Set up Roles Token => Airdrop
  await token.grantRole(MINTER_ROLE, airdrop.address);
  await token.grantRole(BURNER_ROLE, airdrop.address);

  // script para verificacion del contrato
  await verify(tokenImp, "Token", []);
  await verify(airdropImp, "Airdop", []);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
