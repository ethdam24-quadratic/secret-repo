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

	constructor(address _gatewayAddress) {
		gatewayContract = IGateway(_gatewayAddress);
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
		// uint256 _id,
		// string memory _name,
		// string memory _description,
		// uint256[] memory _projectIds,
		// string[] memory _projectNames,
		// string[] memory _projectDescriptions
		bytes32 payloadHash,
		address userAddress,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public {
		gatewayContract.send(payloadHash, userAddress, routingInfo, info);
	}

	function contribute(
		uint256 _roundId,
		uint256 _projectId,
		uint256 _amount
	) public payable {}

	function closeFundingRound(uint256 _roundId) public {}
}
