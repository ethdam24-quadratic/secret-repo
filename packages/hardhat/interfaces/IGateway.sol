// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IGateway {
	function send(uint256 roundId, string calldata encryptedPayload) external;
}
