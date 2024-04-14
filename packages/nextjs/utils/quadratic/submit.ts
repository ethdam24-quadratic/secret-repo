import {
  base64_to_bytes,
  bytes,
  bytes_to_base64,
  concat,
  json_to_bytes,
  sha256,
  text_to_bytes,
} from "@blake.regalia/belt";
import { chacha20_poly1305_seal, ecdh } from "@solar-republic/neutrino";
import { ethers } from "ethers";
import { SigningKey, arrayify, computeAddress, hexlify, keccak256, recoverPublicKey } from "ethers/lib/utils";
import contractAbi from "../../abi/Funding.json";

// the function name of the function that is called on the private contract

const contractAddress = "0x9842b0B380eF026FAF3edC88C27e214fc752484B";
const routing_contract = "secret1xve06qf3wha2m3e0kv53e4uh5pqnktqzl50yuv"; //the contract you want to call in secret
const routing_code_hash = "54678d9f33ca9a3ae379951756fbef43edfcb347dd34b7a5204053a01ab270ec"; //its codehash
const admin_address = "0x50FcF0c327Ee4341313Dd5Cb987f0Cd289Be6D4D"

const submitOpenFundingRound = async (
  address: string,
  provider: ethers.providers.Web3Provider,
  functionArguments: any,
) => {

  let functionName = "create_voting";

  let callbackFunctionName = "createdFundingRound"
  let callbackGasLimit = Number(1000000)

  const publicClientAddress = contractAddress;
  const iface = new ethers.utils.Interface(contractAbi.abi);

  // Generating ephemeral keys
  const wallet = ethers.Wallet.createRandom();
  const userPrivateKeyBytes = arrayify(wallet.privateKey);
  const userPublicKey: string = new SigningKey(wallet.privateKey).compressedPublicKey;
  const userPublicKeyBytes = arrayify(userPublicKey);

  // Gateway Encryption key for ChaCha20-Poly1305 Payload encryption
  const gatewayPublicKey = "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3";
  const gatewayPublicKeyBytes = base64_to_bytes(gatewayPublicKey);

  // create the sharedKey via ECDH
  const sharedKey = await sha256(ecdh(userPrivateKeyBytes, gatewayPublicKeyBytes));

//   {
//     id: roundId,
//     name: roundTitle,
//     description: roundDescription,
//     funding_curve: "x^2",
//     projectIds: chosenProjects.map(project => project.id),
//     projectNames: chosenProjects.map(project => project.name),
//     projectDescriptions: chosenProjects.map(project => project.description),
//   };
//   #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
// pub struct OpenFundingRoundMsg {
//     // Name of the funding round
//     pub name: String,
//     // Unique identifier for the funding round
//     pub id: String,
//     // Description of the funding round
//     pub description: String,
//     // Definition of the funding curve used in the round
//     pub funding_curve: String,
//     // List of projects participating in the funding round
//     pub projects: Vec<ProjectItem>,
//     // List of addresses allowed to participate in the funding round
//     pub allowlist: Vec<String>,
//     // Bool that contains if the funding round is still running
//     pub is_running: bool,
//     //Admin Address
//     pub admin_address: String
// }
// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
// pub struct ProjectItem {
//     // Name of the project
//     pub name: String,
//     // Unique identifier for the project
//     pub id: String,
//     // Description of the project
//     pub description: String,

  const parameters = {
    name: functionArguments.name,
    id: functionArguments.id,
    description: functionArguments.description,
    funding_curve: functionArguments.funding_curve,
    projects: functionArguments.projects,
    allowlist: [],
    admin_address: address
  }

  const data = JSON.stringify(parameters);

  const callbackAddress = publicClientAddress.toLowerCase();
  // This is an empty callback for the sake of having a callback in the sample code.
  // Here, you would put your callback selector for you contract in.
  const callbackSelector = iface.getSighash(iface.getFunction(callbackFunctionName));

  // payload data that are going to be encrypted
  const payload = {
    data: data,
    routing_info: routing_contract,
    routing_code_hash: routing_code_hash,
    user_address: address,
    user_key: bytes_to_base64(userPublicKeyBytes),
    callback_address: bytes_to_base64(arrayify(callbackAddress)),
    callback_selector: bytes_to_base64(arrayify(callbackSelector)),
    callback_gas_limit: callbackGasLimit,
  };

  // build a Json of the payload
  const payloadJson = JSON.stringify(payload);
  console.log("payloadJson", payloadJson);
  const plaintext = json_to_bytes(payload);

  // generate a nonce for ChaCha20-Poly1305 encryption
  // DO NOT skip this, stream cipher encryptions are only secure with a random nonce!
  const nonce = crypto.getRandomValues(bytes(12));

  // Encrypt the payload using ChachaPoly1305 and concat the ciphertext+tag to fit the Rust ChaChaPoly1305 requirements
  const [ciphertextClient, tagClient] = chacha20_poly1305_seal(sharedKey, nonce, plaintext);
  const ciphertext = concat([ciphertextClient, tagClient]);

  // get Metamask to sign the payloadhash with personal_sign
  const ciphertextHash = keccak256(ciphertext);

  // this is what metamask really signs with personal_sign, it prepends the ethereum signed message here
  const payloadHash = keccak256(concat([text_to_bytes("\x19Ethereum Signed Message:\n32"), arrayify(ciphertextHash)]));

  // this is what we provide to metamask
  const msgParams = ciphertextHash;
  const from = address;
  const params = [msgParams, from];
  const method = "personal_sign";
  console.log(`Payload Hash: ${payloadHash}`);

  const payloadSignature = await provider.send(method, params);
  console.log(payloadSignature.result);
  console.log(`Payload Signature: ${payloadSignature.result}`);

  const user_pubkey = recoverPublicKey(payloadHash, payloadSignature.result);
  console.log(`Recovered public key: ${user_pubkey}`);
  console.log(`Verify this matches the user address: ${computeAddress(user_pubkey)}`);

  // function data to be abi encoded
  const _userAddress = address;
  const _routingInfo = routing_contract;
  const _payloadHash = payloadHash;
  const _info = {
    user_key: hexlify(userPublicKeyBytes),
    user_pubkey: user_pubkey,
    routing_code_hash: routing_code_hash,
    task_destination_network: "pulsar-3", //Destination for the task, here: pulsar-3 testnet
    handle: functionName,
    nonce: hexlify(nonce),
    callback_gas_limit: Number(callbackGasLimit),
    payload: hexlify(ciphertext),
    payload_signature: payloadSignature.result,
  };

  console.log(`_userAddress: ${_userAddress}
        _routingInfo: ${_routingInfo} 
        _payloadHash: ${_payloadHash} 
        _info: ${JSON.stringify(_info)}
        _callbackAddress: ${callbackAddress},
        _callbackSelector: ${callbackSelector} ,
        _callbackGasLimit: ${callbackGasLimit}`);

        console.log(_userAddress)
  const functionData = iface.encodeFunctionData("createFundingRound", [functionArguments.id, functionArguments.name, functionArguments.description,
    functionArguments.funding_curve, functionArguments.projectIds, functionArguments.projectNames, 
    functionArguments.projectDescriptions, functionArguments.projectAddresses, _userAddress, true, 
   _payloadHash, _routingInfo, _info]);


  // Then calculate how much gas you have to pay for the callback
  // Forumla: callbackGasLimit*block.basefee.
  // Use an appropriate overhead for the transaction, 1,5x = 3/2 is recommended since gasPrice fluctuates.
  //@ts-ignore
  const provider2 = new ethers.providers.Web3Provider(window?.ethereum);
  const gasFee = await provider2.getGasPrice();
  const amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);

  const tx_params = [
    {
      gas: hexlify(1000000),
      to: publicClientAddress,
      from: address,
      value: hexlify(amountOfGas), // send that extra amount of gas in to pay for the Callback Gas Limit that you set
      data: functionData,
    },
  ];

  const txHash = await provider.send("eth_sendTransaction", tx_params);

  console.log(txHash);

  return txHash;
};

const submitVote = async (
  address: string,
  provider: ethers.providers.Web3Provider,
  functionArguments: any,
) => {

  let functionName = "vote";

  let callbackFunctionName = "contributed"
  let callbackGasLimit = Number(1000000)

  const publicClientAddress = contractAddress;
  const iface = new ethers.utils.Interface(contractAbi.abi);

  // Generating ephemeral keys
  const wallet = ethers.Wallet.createRandom();
  const userPrivateKeyBytes = arrayify(wallet.privateKey);
  const userPublicKey: string = new SigningKey(wallet.privateKey).compressedPublicKey;
  const userPublicKeyBytes = arrayify(userPublicKey);

  // Gateway Encryption key for ChaCha20-Poly1305 Payload encryption
  const gatewayPublicKey = "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3";
  const gatewayPublicKeyBytes = base64_to_bytes(gatewayPublicKey);

  // create the sharedKey via ECDH
  const sharedKey = await sha256(ecdh(userPrivateKeyBytes, gatewayPublicKeyBytes));

//   #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
//   pub struct VotesMsg {
//       // Identifier of the associated funding round
//       pub funding_round_id: String,
//       // Address of the voter
//       pub voter_address: String,
//       // Details of the vote cast
//       pub votes: Vec<VoteItem>,
//   }

//   #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
// pub struct VoteItem {
//     // Identifier of the project voted on
//     pub project_id: String,
//     // Description of the voting choice or reason
//     pub vote_amount: u128,
// }
  const parameters = {
    funding_round_id: functionArguments.funding_round_id,
    voter_address: functionArguments.voter_address,
    votes: functionArguments.votes
  }

  const data = JSON.stringify(parameters);

  const callbackAddress = publicClientAddress.toLowerCase();
  // This is an empty callback for the sake of having a callback in the sample code.
  // Here, you would put your callback selector for you contract in.
  const callbackSelector = iface.getSighash(iface.getFunction(callbackFunctionName));

  // payload data that are going to be encrypted
  const payload = {
    data: data,
    routing_info: routing_contract,
    routing_code_hash: routing_code_hash,
    user_address: address,
    user_key: bytes_to_base64(userPublicKeyBytes),
    callback_address: bytes_to_base64(arrayify(callbackAddress)),
    callback_selector: bytes_to_base64(arrayify(callbackSelector)),
    callback_gas_limit: callbackGasLimit,
  };

  // build a Json of the payload
  const payloadJson = JSON.stringify(payload);
  console.log("payloadJson", payloadJson);
  const plaintext = json_to_bytes(payload);

  // generate a nonce for ChaCha20-Poly1305 encryption
  // DO NOT skip this, stream cipher encryptions are only secure with a random nonce!
  const nonce = crypto.getRandomValues(bytes(12));

  // Encrypt the payload using ChachaPoly1305 and concat the ciphertext+tag to fit the Rust ChaChaPoly1305 requirements
  const [ciphertextClient, tagClient] = chacha20_poly1305_seal(sharedKey, nonce, plaintext);
  const ciphertext = concat([ciphertextClient, tagClient]);

  // get Metamask to sign the payloadhash with personal_sign
  const ciphertextHash = keccak256(ciphertext);

  // this is what metamask really signs with personal_sign, it prepends the ethereum signed message here
  const payloadHash = keccak256(concat([text_to_bytes("\x19Ethereum Signed Message:\n32"), arrayify(ciphertextHash)]));

  // this is what we provide to metamask
  const msgParams = ciphertextHash;
  const from = address;
  const params = [msgParams, from];
  const method = "personal_sign";
  console.log(`Payload Hash: ${payloadHash}`);

  const payloadSignature = await provider.send(method, params);
  console.log(payloadSignature.result);
  console.log(`Payload Signature: ${payloadSignature.result}`);

  const user_pubkey = recoverPublicKey(payloadHash, payloadSignature.result);
  console.log(`Recovered public key: ${user_pubkey}`);
  console.log(`Verify this matches the user address: ${computeAddress(user_pubkey)}`);

  // function data to be abi encoded
  const _userAddress = address;
  const _routingInfo = routing_contract;
  const _payloadHash = payloadHash;
  const _info = {
    user_key: hexlify(userPublicKeyBytes),
    user_pubkey: user_pubkey,
    routing_code_hash: routing_code_hash,
    task_destination_network: "pulsar-3", //Destination for the task, here: pulsar-3 testnet
    handle: functionName,
    nonce: hexlify(nonce),
    payload: hexlify(ciphertext),
    payload_signature: payloadSignature.result,
    callback_gas_limit: Number(callbackGasLimit),
  };

  console.log(`_userAddress: ${_userAddress}
        _routingInfo: ${_routingInfo} 
        _payloadHash: ${_payloadHash} 
        _info: ${JSON.stringify(_info)}
        _callbackAddress: ${callbackAddress},
        _callbackSelector: ${callbackSelector} ,
        _callbackGasLimit: ${callbackGasLimit}`);

  
  const functionData = iface.encodeFunctionData("contribute", [_userAddress, _payloadHash, _routingInfo, _info]);

  // Then calculate how much gas you have to pay for the callback
  // Forumla: callbackGasLimit*block.basefee.
  // Use an appropriate overhead for the transaction, 1,5x = 3/2 is recommended since gasPrice fluctuates.
    //@ts-ignore
    const provider2 = new ethers.providers.Web3Provider(window?.ethereum);
    const gasFee = await provider2.getGasPrice();
    const amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);
    console.log(amountOfGas)
    console.log(functionArguments.totalAmount)
    console.log(amountOfGas.add(functionArguments.totalAmount))

  const tx_params = [
    {
      gas: hexlify(150000),
      to: publicClientAddress,
      from: address,
      value: hexlify(amountOfGas.add(functionArguments.totalAmount)), // send that extra amount of gas in to pay for the Callback Gas Limit that you set
      data: functionData,
    },
  ];

  const txHash = await provider.send("eth_sendTransaction", tx_params);

  console.log(txHash);

  return txHash;
};

const submitCloseFundingRound = async (
  address: string,
  provider: ethers.providers.Web3Provider,
  functionArguments: any,
) => {

  let functionName = "close_voting";

  let callbackFunctionName = "closedFundingRound"
  let callbackGasLimit = Number(1000000)

  const publicClientAddress = contractAddress;
  const iface = new ethers.utils.Interface(contractAbi.abi);

  // Generating ephemeral keys
  const wallet = ethers.Wallet.createRandom();
  const userPrivateKeyBytes = arrayify(wallet.privateKey);
  const userPublicKey: string = new SigningKey(wallet.privateKey).compressedPublicKey;
  const userPublicKeyBytes = arrayify(userPublicKey);

  // Gateway Encryption key for ChaCha20-Poly1305 Payload encryption
  const gatewayPublicKey = "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3";
  const gatewayPublicKeyBytes = base64_to_bytes(gatewayPublicKey);

  // create the sharedKey via ECDH
  const sharedKey = await sha256(ecdh(userPrivateKeyBytes, gatewayPublicKeyBytes));

  // #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
  // pub struct CloseFundingRoundMsg {
  //     // Unique identifier for the funding round
  //     pub id: String,
  //     //Admin Address
  //     pub admin_address: String
  // }
  const parameters = {
    id: functionArguments.id,
    admin_address: address
  }

  const data = JSON.stringify(parameters);

  const callbackAddress = publicClientAddress.toLowerCase();
  // This is an empty callback for the sake of having a callback in the sample code.
  // Here, you would put your callback selector for you contract in.
  const callbackSelector = iface.getSighash(iface.getFunction(callbackFunctionName));

  // payload data that are going to be encrypted
  const payload = {
    data: data,
    routing_info: routing_contract,
    routing_code_hash: routing_code_hash,
    user_address: address,
    user_key: bytes_to_base64(userPublicKeyBytes),
    callback_address: bytes_to_base64(arrayify(callbackAddress)),
    callback_selector: bytes_to_base64(arrayify(callbackSelector)),
    callback_gas_limit: callbackGasLimit,
  };

  // build a Json of the payload
  const payloadJson = JSON.stringify(payload);
  console.log("payloadJson", payloadJson);
  const plaintext = json_to_bytes(payload);

  // generate a nonce for ChaCha20-Poly1305 encryption
  // DO NOT skip this, stream cipher encryptions are only secure with a random nonce!
  const nonce = crypto.getRandomValues(bytes(12));

  // Encrypt the payload using ChachaPoly1305 and concat the ciphertext+tag to fit the Rust ChaChaPoly1305 requirements
  const [ciphertextClient, tagClient] = chacha20_poly1305_seal(sharedKey, nonce, plaintext);
  const ciphertext = concat([ciphertextClient, tagClient]);

  // get Metamask to sign the payloadhash with personal_sign
  const ciphertextHash = keccak256(ciphertext);

  // this is what metamask really signs with personal_sign, it prepends the ethereum signed message here
  const payloadHash = keccak256(concat([text_to_bytes("\x19Ethereum Signed Message:\n32"), arrayify(ciphertextHash)]));

  // this is what we provide to metamask
  const msgParams = ciphertextHash;
  const from = address;
  const params = [msgParams, from];
  const method = "personal_sign";
  console.log(`Payload Hash: ${payloadHash}`);

  const payloadSignature = await provider.send(method, params);
  console.log(payloadSignature.result);
  console.log(`Payload Signature: ${payloadSignature.result}`);

  const user_pubkey = recoverPublicKey(payloadHash, payloadSignature.result);
  console.log(`Recovered public key: ${user_pubkey}`);
  console.log(`Verify this matches the user address: ${computeAddress(user_pubkey)}`);

  // function data to be abi encoded
  const _userAddress = address;
  const _routingInfo = routing_contract;
  const _payloadHash = payloadHash;
  const _info = {
    user_key: hexlify(userPublicKeyBytes),
    user_pubkey: user_pubkey,
    routing_code_hash: routing_code_hash,
    task_destination_network: "pulsar-3", //Destination for the task, here: pulsar-3 testnet
    handle: functionName,
    nonce: hexlify(nonce),
    payload: hexlify(ciphertext),
    payload_signature: payloadSignature.result,
    callback_gas_limit: Number(callbackGasLimit),
  };

  console.log(`_userAddress: ${_userAddress}
        _routingInfo: ${_routingInfo} 
        _payloadHash: ${_payloadHash} 
        _info: ${JSON.stringify(_info)}
        _callbackAddress: ${callbackAddress},
        _callbackSelector: ${callbackSelector} ,
        _callbackGasLimit: ${callbackGasLimit}`);
  
  const functionData = iface.encodeFunctionData("closeFundingRound", [ functionArguments.id,true ,_userAddress ,_payloadHash, _routingInfo, _info]);

  // Then calculate how much gas you have to pay for the callback
  // Forumla: callbackGasLimit*block.basefee.
  // Use an appropriate overhead for the transaction, 1,5x = 3/2 is recommended since gasPrice fluctuates.
    //@ts-ignore
    const provider2 = new ethers.providers.Web3Provider(window?.ethereum);
    const gasFee = await provider2.getGasPrice();
  const amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);

  const tx_params = [
    {
      gas: hexlify(150000),
      to: publicClientAddress,
      from: address,
      value: hexlify(amountOfGas), // send that extra amount of gas in to pay for the Callback Gas Limit that you set
      data: functionData,
    },
  ];

  const txHash = await provider.send("eth_sendTransaction", tx_params);

  console.log(txHash);

  return txHash;
};

const submitTriggerPayout = async (
    address: string,
    provider: ethers.providers.Web3Provider,
    functionArguments: any,
  ) => {
  
    let functionName = "trigger_payout";
  
    let callbackFunctionName = "distributedFunding"
    let callbackGasLimit = Number(1000000)
  
    const publicClientAddress = contractAddress;
    const iface = new ethers.utils.Interface(contractAbi.abi);
  
    // Generating ephemeral keys
    const wallet = ethers.Wallet.createRandom();
    const userPrivateKeyBytes = arrayify(wallet.privateKey);
    const userPublicKey: string = new SigningKey(wallet.privateKey).compressedPublicKey;
    const userPublicKeyBytes = arrayify(userPublicKey);
  
    // Gateway Encryption key for ChaCha20-Poly1305 Payload encryption
    const gatewayPublicKey = "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3";
    const gatewayPublicKeyBytes = base64_to_bytes(gatewayPublicKey);
  
    // create the sharedKey via ECDH
    const sharedKey = await sha256(ecdh(userPrivateKeyBytes, gatewayPublicKeyBytes));
  
    // #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
    // pub struct CloseFundingRoundMsg {
    //     // Unique identifier for the funding round
    //     pub id: String,
    //     //Admin Address
    //     pub admin_address: String
    // }
    console.log(functionArguments.funding_round_id)
    const parameters = {
      funding_round_id: functionArguments.funding_round_id.toString(),
      admin_address: admin_address
    }
  
    const data = JSON.stringify(parameters);
  
    const callbackAddress = publicClientAddress.toLowerCase();
    // This is an empty callback for the sake of having a callback in the sample code.
    // Here, you would put your callback selector for you contract in.
    const callbackSelector = iface.getSighash(iface.getFunction(callbackFunctionName));
  
    // payload data that are going to be encrypted
    const payload = {
      data: data,
      routing_info: routing_contract,
      routing_code_hash: routing_code_hash,
      user_address: address,
      user_key: bytes_to_base64(userPublicKeyBytes),
      callback_address: bytes_to_base64(arrayify(callbackAddress)),
      callback_selector: bytes_to_base64(arrayify(callbackSelector)),
      callback_gas_limit: callbackGasLimit,
    };
  
    // build a Json of the payload
    const payloadJson = JSON.stringify(payload);
    console.log("payloadJson", payloadJson);
    const plaintext = json_to_bytes(payload);
  
    // generate a nonce for ChaCha20-Poly1305 encryption
    // DO NOT skip this, stream cipher encryptions are only secure with a random nonce!
    const nonce = crypto.getRandomValues(bytes(12));
  
    // Encrypt the payload using ChachaPoly1305 and concat the ciphertext+tag to fit the Rust ChaChaPoly1305 requirements
    const [ciphertextClient, tagClient] = chacha20_poly1305_seal(sharedKey, nonce, plaintext);
    const ciphertext = concat([ciphertextClient, tagClient]);
  
    // get Metamask to sign the payloadhash with personal_sign
    const ciphertextHash = keccak256(ciphertext);
  
    // this is what metamask really signs with personal_sign, it prepends the ethereum signed message here
    const payloadHash = keccak256(concat([text_to_bytes("\x19Ethereum Signed Message:\n32"), arrayify(ciphertextHash)]));
  
    // this is what we provide to metamask
    const msgParams = ciphertextHash;
    const from = address;
    const params = [msgParams, from];
    const method = "personal_sign";
    console.log(`Payload Hash: ${payloadHash}`);
  
    const payloadSignature = await provider.send(method, params);
    console.log(payloadSignature.result);
    console.log(`Payload Signature: ${payloadSignature.result}`);
  
    const user_pubkey = recoverPublicKey(payloadHash, payloadSignature.result);
    console.log(`Recovered public key: ${user_pubkey}`);
    console.log(`Verify this matches the user address: ${computeAddress(user_pubkey)}`);
  
    // function data to be abi encoded
    console.log(address)
    const _userAddress = address;
    const _routingInfo = routing_contract;
    const _payloadHash = payloadHash;
    const _info = {
      user_key: hexlify(userPublicKeyBytes),
      user_pubkey: user_pubkey,
      routing_code_hash: routing_code_hash,
      task_destination_network: "pulsar-3", //Destination for the task, here: pulsar-3 testnet
      handle: functionName,
      nonce: hexlify(nonce),
      payload: hexlify(ciphertext),
      payload_signature: payloadSignature.result,
      callback_gas_limit: Number(callbackGasLimit),
    };
  
    console.log(`_userAddress: ${_userAddress}
          _routingInfo: ${_routingInfo} 
          _payloadHash: ${_payloadHash} 
          _info: ${JSON.stringify(_info)}
          _callbackAddress: ${callbackAddress},
          _callbackSelector: ${callbackSelector} ,
          _callbackGasLimit: ${callbackGasLimit}`);
  
    const functionData = iface.encodeFunctionData("distributeFunding", [functionArguments.funding_round_id, _userAddress ,_payloadHash, _routingInfo, _info]);
  
    // Then calculate how much gas you have to pay for the callback
    // Forumla: callbackGasLimit*block.basefee.
    // Use an appropriate overhead for the transaction, 1,5x = 3/2 is recommended since gasPrice fluctuates.
    //@ts-ignore
    const provider2 = new ethers.providers.Web3Provider(window?.ethereum);
    const gasFee = await provider2.getGasPrice();
    const amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);
  
    const tx_params = [
      {
        gas: hexlify(150000),
        to: publicClientAddress,
        from: address,
        value: hexlify(amountOfGas), // send that extra amount of gas in to pay for the Callback Gas Limit that you set
        data: functionData,
      },
    ];
  
    const txHash = await provider.send("eth_sendTransaction", tx_params);
  
    console.log(txHash);
  
    return txHash;
  };

export { submitCloseFundingRound, submitTriggerPayout, submitVote, submitOpenFundingRound };
