import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployFundingContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  console.log("network")
  console.log(hre.network.name)
  
    // Define contract constructor arguments based on the network
  let constructorArgs: string[];
  switch (hre.network.name) {
    case "sepolia":
      constructorArgs = ["0x3879E146140b627a5C858a08e507B171D9E43139"];
      break;
    case "scrollSepolia":
      constructorArgs = ["0x4c14a6A0CD2DA2848D3C31285B828F6364087735"];
      break;
    case "polygonMumbai":
      constructorArgs = ["0x5e16dbD2728d66B4189b2e3AAB71837683Dfd2d7"];
      break;
    case "optimismSepolia":
      constructorArgs = ["0xf50c73581d6def7f911aC1D6d0d5e928691AAa9E"];
      break;
    case "baseSepolia":
      constructorArgs = ["0xfaFCfceC4e29e9b4ECc8C0a3f7df1011580EEEf2"];
      break;
    case "testnet_aurora":
      constructorArgs = ["0x5e16dbD2728d66B4189b2e3AAB71837683Dfd2d7"];
      break;
    default:
      constructorArgs = [""];  // Default or fallback argument
  }
  console.log("depolying on " + hre.network.name + " with relayer addres " + constructorArgs[0])

  await deploy("Funding", {
    from: deployer,
    // Contract constructor arguments
    args: constructorArgs,
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const funding = await hre.ethers.getContract<Contract>("Funding", deployer);
  const contractAddress = await funding.getAddress();
  console.log(`yarn hardhat verify ` + contractAddress +  ` "` + constructorArgs[0]+ `" --network ` + hre.network.name);
  // console.log("👋 Initial greeting:", await yourContract.greeting());
};

export default deployFundingContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployFundingContract.tags = ["Funding"];
