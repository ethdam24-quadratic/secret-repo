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

const submit = async (address: string, provider: ethers.providers.Web3Provider) => {
  const publicClientAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

  const abi = [{ inputs: [], name: "upgradeHandler", outputs: [], stateMutability: "nonpayable", type: "function" }];
  const iface = new ethers.utils.Interface(abi);

  const routing_contract = "secret1pfg825wflcl40dqpd3yj96zhevnlxkh35hedks"; //the contract you want to call in secret
  const routing_code_hash = "fc5007efb0580334be20142a3011f34101be681eaa2fe277ee429f4d76107876"; //its codehash

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

  const key = document.querySelector<HTMLFormElement>("#input1")?.value;
  const value = document.querySelector<HTMLFormElement>("#input2")?.value;
  const viewing_key = document.querySelector<HTMLFormElement>("#input3")?.value;
  const callback_gas_limit = document.querySelector<HTMLFormElement>("#input4")?.value;

  // the function name of the function that is called on the private contract
  const handle = "store_value";

  const data = JSON.stringify({
    key: key,
    value: value,
    viewing_key: viewing_key,
    addresses: [address],
  });

  const callbackAddress = publicClientAddress.toLowerCase();
  // This is an empty callback for the sake of having a callback in the sample code.
  // Here, you would put your callback selector for you contract in.
  const callbackSelector = iface.getSighash(iface.getFunction("upgradeHandler"));
  const callbackGasLimit = Number(callback_gas_limit);

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
  const params = [from, msgParams];
  const method = "personal_sign";
  console.log(`Payload Hash: ${payloadHash}`);

  const payloadSignature = await provider.send(method, params);
  console.log(`Payload Signature: ${payloadSignature}`);

  const user_pubkey = recoverPublicKey(payloadHash, payloadSignature);
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
    handle: handle,
    nonce: hexlify(nonce),
    payload: hexlify(ciphertext),
    payload_signature: payloadSignature,
    callback_gas_limit: Number(callbackGasLimit),
  };

  console.log(`_userAddress: ${_userAddress}
        _routingInfo: ${_routingInfo} 
        _payloadHash: ${_payloadHash} 
        _info: ${JSON.stringify(_info)}
        _callbackAddress: ${callbackAddress},
        _callbackSelector: ${callbackSelector} ,
        _callbackGasLimit: ${callbackGasLimit}`);

  const functionData = iface.encodeFunctionData("send", [_payloadHash, _userAddress, _routingInfo, _info]);

  // Then calculate how much gas you have to pay for the callback
  // Forumla: callbackGasLimit*block.basefee.
  // Use an appropriate overhead for the transaction, 1,5x = 3/2 is recommended since gasPrice fluctuates.
  const gasFee = await provider.getGasPrice();
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
};

export { submit };
