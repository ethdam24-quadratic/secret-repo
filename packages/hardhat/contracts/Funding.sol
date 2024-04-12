//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "../interfaces/IGateway.sol";

/**
 * A smart contract for cross-chain quadratic voting.
 * Built during EthDam 24
 * @author arjanjohan
 */

contract Funding {
	// ========================================
	//     CONSTRUCTOR AND VALUES
	// ========================================

	IGateway public gatewayContract;
	address gatewayAddressSepolia =
		address(0x3879E146140b627a5C858a08e507B171D9E43139);

	constructor() {
		gatewayContract = IGateway(gatewayAddressSepolia);
	}

	// ========================================
	//     STRUCTS AND MAPPIGNS
	// ========================================

	struct Project {
		uint256 id;
		string name;
		string description;
		uint256 totalContributions;
		uint256 totalSquareRoots;
	}

	struct FundingRound {
		uint256 id;
		string name;
		string description;
		mapping(uint256 => Project) projects;
		uint256[] projectIds;
		bool isOpen;
	}

	mapping(uint256 => FundingRound) public fundingRounds;
	uint256[] public roundIds;

	// ========================================
	//     EVENTS
	// ========================================

	event RoundCreated(uint256 roundId, string name);

	event ContributionReceived(
		uint256 roundId,
		uint256 projectId,
		address contributor,
		uint256 amount
	);

	event RoundClosed(uint256 roundId);

	// ========================================
	//     FUNCTIONS
	// ========================================

	function createFundingRound(
		uint256 id,
		string memory name,
		// string memory _description,
		// uint256[] memory _projectIds,
		// string[] memory _projectNames,
		// string[] memory _projectDescriptions
		bytes32 payloadHash,
		address userAddress,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		gatewayContract.send{value: msg.value}(payloadHash, userAddress, routingInfo, info);
		emit RoundCreated(id, name);
	}

	function contribute(
		uint256 roundId,
		uint256 projectId,
		uint256 amount
	) public payable {
		emit ContributionReceived(roundId, projectId, msg.sender, amount);
	}

	function closeFundingRound(uint256 roundId) public {
		emit RoundClosed(roundId);
	}
}
