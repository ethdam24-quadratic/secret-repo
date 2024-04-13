// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "abdk-libraries-solidity/ABDKMath64x64.sol";
import "../interfaces/IGateway.sol";

/**
 * A smart contract for cross-chain quadratic voting developed during EthDam 24.
 * This contract supports various types of funding curves and ensures privacy and security through integration with the Secret Network.
 * @author arjanjohan
 */
contract Funding {
	// ========================================
	//     ENUM, STRUCTS AND MAPPINGS
	// ========================================

	struct Project {
		uint256 id;
		string name;
		string description;
		address payable projectAddress;
		uint256 totalContributions;
		uint256 totalSquareRoots;
	}

	struct FundingRound {
		uint256 id;
		string name;
		string description;
		string curveType;
		mapping(uint256 => Project) projects;
		uint256[] projectIds;
		uint256 totalContributions;
		bool isOpen;
	}

	mapping(uint256 => FundingRound) public fundingRounds;
	uint256[] public roundIds;

	// ========================================
	//     CONSTRUCTOR AND VALUES
	// ========================================

	IGateway public gatewayContract;
	address public gatewayAddressSepolia =
		address(0x3879E146140b627a5C858a08e507B171D9E43139);

	constructor() {
		gatewayContract = IGateway(gatewayAddressSepolia);
	}

	// ========================================
	//     EVENTS
	// ========================================
	event RoundCreated(
		uint256 indexed roundId,
		string name,
		uint256[] projectIds
	);
	event ContributionReceived(
		address indexed contributor,
		uint256 indexed roundId,
		uint256 amount
	);
	event RoundClosed(uint256 indexed roundId);

	// ========================================
	//     CORE FUNCTIONS
	// ========================================

	function createFundingRound(
		uint256 id,
		string memory name,
		string memory description,
		string memory curveType,
		uint256[] memory projectIds,
		string[] memory projectNames,
		string[] memory projectDescriptions,
		address payable[] memory projectAddresses,
		bool sendToSecret,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		validateProjectParameters(
			projectIds,
			projectNames,
			projectDescriptions,
			projectAddresses
		);
		require(fundingRounds[id].id == 0, "Round ID exists");

		if (sendToSecret) {
			gatewayContract.send{ value: msg.value }(
				payloadHash,
				msg.sender,
				routingInfo,
				info
			);
		}

		FundingRound storage round = fundingRounds[id];
		setupFundingRound(
			round,
			id,
			name,
			description,
			curveType,
			projectIds,
			projectNames,
			projectDescriptions,
			projectAddresses
		);
		roundIds.push(id);
		emit RoundCreated(id, name, projectIds);
	}

	function contribute(
		uint256 roundId,
		uint256[] memory projectIds,
		uint256[] memory amounts,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		require(validRound(roundId), "Invalid round");
		uint256 totalContributed = processContributions(
			roundId,
			projectIds,
			amounts
		);
		require(msg.value >= totalContributed, "Insufficient funds");
		finalizeContribution(
			roundId,
			msg.value - totalContributed,
			payloadHash,
			routingInfo,
			info
		);
	}

	function closeFundingRound(
		uint256 roundId,
		bool sendToSecret,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		require(fundingRounds[roundId].isOpen, "Round closed");
		fundingRounds[roundId].isOpen = false;
		if (sendToSecret) {
			gatewayContract.send{ value: msg.value }(
				payloadHash,
				msg.sender,
				routingInfo,
				info
			);
		}
		distributeFunds(roundId);
		emit RoundClosed(roundId);
	}

	// ========================================
	//     HELPER FUNCTIONS
	// ========================================

	function validateProjectParameters(
		uint256[] memory projectIds,
		string[] memory projectNames,
		string[] memory projectDescriptions,
		address payable[] memory projectAddresses
	) private pure {
		require(
			projectIds.length == projectNames.length &&
				projectNames.length == projectDescriptions.length &&
				projectDescriptions.length == projectAddresses.length,
			"Mismatched input arrays"
		);
	}

	function setupFundingRound(
		FundingRound storage round,
		uint256 id,
		string memory name,
		string memory description,
		string memory curveType,
		uint256[] memory projectIds,
		string[] memory projectNames,
		string[] memory projectDescriptions,
		address payable[] memory projectAddresses
	) private {
		round.id = id;
		round.name = name;
		round.description = description;
		round.curveType = curveType;
		round.isOpen = true;

		for (uint256 i = 0; i < projectIds.length; i++) {
			require(round.projects[projectIds[i]].id == 0, "Project ID exists");
			round.projects[projectIds[i]] = Project({
				id: projectIds[i],
				name: projectNames[i],
				description: projectDescriptions[i],
				projectAddress: projectAddresses[i],
				totalContributions: 0,
				totalSquareRoots: 0
			});
			round.projectIds.push(projectIds[i]);
		}
	}

	function validRound(uint256 roundId) private view returns (bool) {
		return fundingRounds[roundId].isOpen && fundingRounds[roundId].id != 0;
	}

	function processContributions(
		uint256 roundId,
		uint256[] memory projectIds,
		uint256[] memory amounts
	) private returns (uint256 totalContributed) {
		for (uint256 i = 0; i < amounts.length; i++) {
			Project storage project = fundingRounds[roundId].projects[
				projectIds[i]
			];
			require(project.id != 0, "Project not found");

			if (
				keccak256(bytes(fundingRounds[roundId].curveType)) ==
				keccak256(bytes("Quadratic"))
			) {
				project.totalSquareRoots += sqrt(amounts[i]);
			} else if (
				keccak256(bytes(fundingRounds[roundId].curveType)) ==
				keccak256(bytes("Linear"))
			) {
				project.totalContributions += amounts[i];
			} else if (
				keccak256(bytes(fundingRounds[roundId].curveType)) ==
				keccak256(bytes("Exponential"))
			) {
				project.totalSquareRoots += exp(amounts[i]);
			}
			totalContributed += amounts[i];
		}
	}

	function finalizeContribution(
		uint256 roundId,
		uint256 remainingFunds,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) private {
		gatewayContract.send{ value: remainingFunds }(
			payloadHash,
			msg.sender,
			routingInfo,
			info
		);
		emit ContributionReceived(msg.sender, roundId, remainingFunds);
	}

	function distributeFunds(uint256 roundId) private {
		uint256 totalFunds = fundingRounds[roundId].totalContributions;
		for (uint256 i = 0; i < fundingRounds[roundId].projectIds.length; i++) {
			Project storage project = fundingRounds[roundId].projects[
				fundingRounds[roundId].projectIds[i]
			];
			uint256 payout = calculatePayout(
				fundingRounds[roundId].curveType,
				project
			);
			project.projectAddress.transfer(payout);
			totalFunds -= payout;
		}
	}

	function calculatePayout(
		string memory curveType,
		Project memory project
	) private pure returns (uint256) {
		if (keccak256(bytes(curveType)) == keccak256(bytes("Quadratic"))) {
			return project.totalSquareRoots * project.totalSquareRoots;
		} else if (keccak256(bytes(curveType)) == keccak256(bytes("Linear"))) {
			return project.totalContributions;
		} else if (
			keccak256(bytes(curveType)) == keccak256(bytes("Exponential"))
		) {
			return (exp(project.totalSquareRoots) - 1);
		}
	}

	function sqrt(uint256 x) private pure returns (uint256 y) {
		uint256 z = (x + 1) / 2;
		y = x;
		while (z < y) {
			y = z;
			z = (x / z + z) / 2;
		}
	}

	function exp(uint x) public pure returns (uint) {
		int128 x_fixed = ABDKMath64x64.fromUInt(x);
		int128 result_fixed = ABDKMath64x64.exp(x_fixed);
		return ABDKMath64x64.toUInt(result_fixed);
	}
}
