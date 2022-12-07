import { BigNumber, Contract, providers, ethers, utils } from "ethers";
import {
  init,
  approve,
  participateInAirdrop,
  quemarMisTokensParaParticipar,
  addToWhiteList,
  removeFromWhitelist,
  connectToMumbai,
} from "utec-smart-contracts";
import tokenAbi from "../artifacts/contracts/TokenUpgradeableAirdrop.sol/TokenUpgradeableAirdrop.json";
import airdropAbi from "../artifacts/contracts/AirdropONEUpgradeable.sol/AirdropONEUpgradeable.json";

window.ethers = ethers;

var provider, signer, account;
var tokenContract;
var airdropContract;

function initSmartContracts() {
  // Token contract
  var tokenAddress = "0x5036aA408db59397aB17dbd6521eB9d4d00658B5";
  // Airdrop contract
  var airdropAddress = "0xD8415F64d6DCa99a282b6433A29A060230820C86";

  provider = new providers.Web3Provider(window.ethereum);
  tokenContract = new Contract(tokenAddress, tokenAbi.abi, provider);
  airdropContract = new Contract(airdropAddress, airdropAbi.abi, provider);
}

function setUpEventsContracts() {
  tokenContract.on("Approval", (owner, spender, value) => {
    console.log("owner", owner);
    console.log("spender", spender);
    console.log("value", value);
  });
}

function setUpListeners() {
  var bttn = document.getElementById("connect");
  bttn.addEventListener("click", async function () {
    if (window.ethereum) {
      [account] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Billetera metamask", account);

      provider = new providers.Web3Provider(window.ethereum);
      signer = provider.getSigner(account);
      window.signer = signer;
    }
  });

  var bttn = document.getElementById("switch");
  bttn.addEventListener("click", async function () {
    await connectToMumbai();
  });

  // APROVAR TOKENS
  var bttn = document.getElementById("approveButton");
  bttn.addEventListener("click", async function () {
    var valorCajaTexto = document.getElementById("approveAmount").value;
    var value = BigNumber.from(`${valorCajaTexto}000000000000000000`);
    console.log(value);
    // var tx = await tokenContract
    //   .connect(signer)
    //   .approve(airdropContract.address, value);
    var tx = await approve(value, signer);
    var response = await tx.wait();
    console.log(response);
    return response;
  });

  // PARTICIPAR EN EL AIRDROP
  var bttn = document.getElementById("participateAirdrop");
  bttn.addEventListener("click", async function () {
    var txt = document.getElementById("errorAirdrop");
    txt.innerHTML = "";
    try {
      // var tx = await airdropContract.connect(signer).participateInAirdrop();
      var tx = await participateInAirdrop(signer);
      var response = await tx.wait();
      console.log(response);
      return response;
    } catch (error) {
      console.log(error.reason);
      txt.innerHTML = error.reason;
    }
  });

  // QUEMAR MIS TOKENS
  var bttn = document.getElementById("quemarTokens");
  bttn.addEventListener("click", async function () {
    var txt = document.getElementById("errorQuemar");
    txt.innerHTML = "";
    try {
      // var tx = await airdropContract
      //   .connect(signer)
      //   .quemarMisTokensParaParticipar();
      var tx = await quemarMisTokensParaParticipar(signer);
      var response = await tx.wait();
      console.log(response);
      return response;
    } catch (error) {
      console.log(error.reason);
      txt.innerHTML = error.reason;
    }
  });

  // AGREGAR A LA LISTA BLANCA
  var bttn = document.getElementById("addButton");
  bttn.addEventListener("click", async function () {
    var txt = document.getElementById("errorWhitelist");
    var address = document.getElementById("addWhiteList").value;
    txt.innerHTML = "";
    try {
      // var tx = await airdropContract.connect(signer).addToWhiteList(address);
      var tx = await addToWhiteList(signer, address);
      var response = await tx.wait();
      console.log(response);
      return response;
    } catch (error) {
      console.log(error.reason);
      txt.innerHTML = error.reason;
    }
  });

  // REMOVER DE LISTA BLANCA
  var bttn = document.getElementById("removeButton");
  bttn.addEventListener("click", async function () {
    var txt = document.getElementById("errorQuitarWhitelist");
    var address = document.getElementById("removeWhitelist").value;
    txt.innerHTML = "";
    try {
      // var tx = await airdropContract
      //   .connect(signer)
      //   .removeFromWhitelist(address);
      var tx = await removeFromWhitelist(signer, address);
      var response = await tx.wait();
      console.log(response);
      return response;
    } catch (error) {
      console.log(error.reason);
      txt.innerHTML = error.reason;
    }
  });
}

async function setUp() {
  init(window.ethereum);
  initSmartContracts();
  setUpEventsContracts();
  await setUpListeners();
}

setUp()
  .then()
  .catch((e) => console.log(e));
