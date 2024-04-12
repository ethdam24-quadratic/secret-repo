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
	// address gatewayAddressAurora = address();

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

	event RoundCreated(uint256 roundId, string name, uint256[] projects);

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
		string memory description,
		uint256[] memory projectIds,
		string[] memory projectNames,
		string[] memory projectDescriptions,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		gatewayContract.send{ value: msg.value }(
			payloadHash,
			msg.sender,
			routingInfo,
			info
		);

		FundingRound storage round = fundingRounds[id];
		round.id = id;
		round.name = name;
		round.description = description;
		round.isOpen = true;

		for (uint256 i = 0; i < projectIds.length; i++) {
			uint256 projectId = projectIds[i];
			round.projects[projectId] = Project({
				id: projectId,
				name: projectNames[i],
				description: projectDescriptions[i],
				totalContributions: 0,
				totalSquareRoots: 0
			});
			round.projectIds.push(projectId);
		}

		roundIds.push(id);

		emit RoundCreated(id, name, projectIds);
	}

	function contribute(
		uint256 roundId,
		uint256 projectId,
		uint256 amount,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		require(
			fundingRounds[roundId].isOpen,
			"This funding round is already closed"
		);

		uint256 gateway_payable = msg.value - amount;
		gatewayContract.send{ value: gateway_payable }(
			payloadHash,
			msg.sender,
			routingInfo,
			info
		);

		emit ContributionReceived(roundId, projectId, msg.sender, amount);
	}

	function closeFundingRound(uint256 roundId) public {
		require(
			fundingRounds[roundId].isOpen,
			"This funding round is already closed"
		);
		fundingRounds[roundId].isOpen = false;

		// todo add logic

		emit RoundClosed(roundId);
	}
}
