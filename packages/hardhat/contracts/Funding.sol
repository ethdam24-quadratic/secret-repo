//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "abdk-libraries-solidity/ABDKMath64x64.sol";
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
	//     ENUM, STRUCTS AND MAPPIGNS
	// ========================================

	enum FundingCurveType {
		Quadratic,
		Linear,
		Exponential
	}

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
		FundingCurveType curveType;
		mapping(uint256 => Project) projects;
		uint256[] projectIds;
		uint256 totalContributions;
		bool isOpen;
	}

	mapping(uint256 => FundingRound) public fundingRounds;
	uint256[] public roundIds;

	// ========================================
	//     EVENTS
	// ========================================

	event RoundCreated(uint256 roundId, string name, uint256[] projects);

	event ContributionReceived(
		address contributor,
		uint256 roundId,
		uint256 amount
	);

	event RoundClosed(uint256 roundId);

	// ========================================
	//     CORE FUNCTIONS
	// ========================================

	function createFundingRound(
		uint256 id,
		string memory name,
		string memory description,
		FundingCurveType curveType,
		uint256[] memory projectIds,
		string[] memory projectNames,
		string[] memory projectDescriptions,
		address payable[] memory projectAddresses,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		require(
			projectIds.length == projectNames.length &&
				projectNames.length == projectDescriptions.length,
			"Project arrays must have the same length"
		);
		require(
			fundingRounds[id].id == 0 && id != 0,
			"Funding round ID already exists"
		);

		gatewayContract.send{ value: msg.value }(
			payloadHash,
			msg.sender,
			routingInfo,
			info
		);

		// Add new round to storage
		FundingRound storage round = fundingRounds[id];
		round.id = id;
		round.name = name;
		round.description = description;
		round.curveType = curveType;
		round.isOpen = true;

		for (uint256 i = 0; i < projectIds.length; i++) {
			uint256 projectId = projectIds[i];

			require(
				round.projects[projectId].id == 0 && projectId != 0,
				"Project ID already exists"
			);

			round.projects[projectId] = Project({
				id: projectId,
				name: projectNames[i],
				description: projectDescriptions[i],
				projectAddress: projectAddresses[i],
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
		uint256[] memory projectIds,
		uint256[] memory amounts,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		require(
			fundingRounds[roundId].id != 0 && roundId != 0,
			"Funding round does not exist"
		);
		require(
			fundingRounds[roundId].isOpen,
			"This funding round is already closed"
		);

		uint256 gateway_payable = msg.value;

		for (uint256 i = 0; i < amounts.length; i++) {
			Project storage project = fundingRounds[roundId].projects[
				projectIds[i]
			];
			require(
				project.id != 0 && projectIds[i] != 0,
				"Project does not exist"
			);
			require(
				gateway_payable >= amounts[i],
				"Insufficient funds for contributions"
			);

			if (
				fundingRounds[roundId].curveType == FundingCurveType.Quadratic
			) {
				project.totalSquareRoots += sqrt(amounts[i]);
			} else if (
				fundingRounds[roundId].curveType == FundingCurveType.Linear
			) {
				project.totalContributions += amounts[i];
			} else if (
				fundingRounds[roundId].curveType == FundingCurveType.Exponential
			) {
				project.totalSquareRoots += exp(amounts[i]);
			}
			fundingRounds[roundId].totalContributions += amounts[i];

			gateway_payable -= amounts[i];
		}
		gatewayContract.send{ value: gateway_payable }(
			payloadHash,
			msg.sender,
			routingInfo,
			info
		);

		emit ContributionReceived(
			msg.sender,
			roundId,
			msg.value - gateway_payable
		);
	}

	function closeFundingRound(uint256 roundId) public {
		FundingRound storage round = fundingRounds[roundId];
		require(round.isOpen, "This funding round is already closed");
		fundingRounds[roundId].isOpen = false;

		uint256 totalFunds = fundingRounds[roundId].totalContributions;

		for (uint256 i = 0; i < round.projectIds.length; i++) {
			Project storage project = round.projects[round.projectIds[i]];

			uint256 payout = calculatePayout(round.curveType, project);
			totalFunds -= payout;

			project.projectAddress.transfer(payout);
			// payable(address(project)).transfer(payout); // Make sure each project has a valid withdrawal address
		}

		// require(
		// 	totalFunds < 1,
		// 	"Calculation error, sum of payouts does not match totalContributions"
		// );

		emit RoundClosed(roundId);
	}

	// ========================================
	//     HELPER FUNCTIONS
	// ========================================

	function calculatePayout(
		FundingCurveType curveType,
		Project memory project
	) private pure returns (uint256) {
		uint256 payout = 0;

		if (curveType == FundingCurveType.Quadratic) {
			payout = project.totalSquareRoots * project.totalSquareRoots;
		} else if (curveType == FundingCurveType.Linear) {
			payout = project.totalContributions; // Directly use the contributed amount
		} else if (curveType == FundingCurveType.Exponential) {
			payout = (exp(project.totalSquareRoots) - 1); // Example exponential calculation
		}
		return payout;
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
