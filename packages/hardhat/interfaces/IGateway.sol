// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IGateway {
	struct ExecutionInfo {
		bytes user_key;
		bytes user_pubkey;
		string routing_code_hash;
		string task_destination_network;
		string handle;
		bytes12 nonce;
		uint32 callback_gas_limit;
		bytes payload;
		bytes payload_signature;
	}

	function send(
		bytes32 _payloadHash,
		address _userAddress,
		string calldata _routingInfo,
		ExecutionInfo calldata _info
	) external payable;
}
