// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "abdk-libraries-solidity/ABDKMath64x64.sol";
import "../interfaces/IGateway.sol";
import "./JsmnSolLib.sol";

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

	event RoundCreatedInSecret(
		uint256 indexed roundId,
		string name,
		uint256[] projectIds
	);

	event ContributionReceived(address indexed contributor);

	event ContributionReceivedInSecret(
		address indexed contributor,
		uint256 indexed roundId
	);

	event RoundClosed(uint256 indexed roundId);

	event RoundClosedInSecret(uint256 indexed roundId);

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

	// callback function for secret
	function createdFundingRound(
		uint256 id,
		string memory name,
		uint256[] memory projectIds
	) public {
		emit RoundCreatedInSecret(id, name, projectIds);
	}

	function contribute(
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		gatewayContract.send{ value: msg.value }( // todo change this value
			payloadHash,
			msg.sender,
			routingInfo,
			info
		);
		emit ContributionReceived(msg.sender);
	}

	// callback function for secret
	function contribute(uint256 roundId) public {
		emit ContributionReceivedInSecret(msg.sender, roundId);
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

		string memory json = ""; // todo update this from secret
		if (sendToSecret) {
			gatewayContract.send{ value: msg.value }(
				payloadHash,
				msg.sender,
				routingInfo,
				info
			);
		} else {
			// Different function to retrieve results
		}
		distributeFunds(json, roundId);
		emit RoundClosed(roundId);
	}

	// callback function for secret
	function closedFundingRound(uint256 roundId) public {
		emit RoundClosedInSecret(roundId);
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
	) private view returns (uint256 totalContributed) {
		for (uint256 i = 0; i < amounts.length; i++) {
			Project storage project = fundingRounds[roundId].projects[
				projectIds[i]
			];
			require(project.id != 0, "Project not found");
			totalContributed += amounts[i];
		}
	}

	function distributeFunds(string memory json, uint256 roundId) public {
		// Parse the JSON input
		uint256 numTokens;
		JsmnSolLib.Token[] memory tokens;
		(, tokens, numTokens) = JsmnSolLib.parse(json, 20);

		// Ensure JSON parsing succeeded
		require(numTokens > 0, "JSON parsing failed or no data found");

		uint256 totalFunds = fundingRounds[roundId].totalContributions;

		// Iterate over each project in the round
		for (uint256 i = 0; i < fundingRounds[roundId].projectIds.length; i++) {
			Project storage project = fundingRounds[roundId].projects[
				fundingRounds[roundId].projectIds[i]
			];

			// Find matching project ID in JSON and calculate the payout
			uint256 payout = 0;
			for (uint256 j = 1; j < numTokens - 1; j += 3) {
				// Using getBytes to extract the project id from json
				string memory projectId = JsmnSolLib.getBytes(
					json,
					tokens[j].start,
					tokens[j].end
				);
				if (
					keccak256(bytes(projectId)) ==
					keccak256(bytes(project.name))
				) {
					// Calculate payout based on the funding percentage extracted using getBytes
					string memory fundingStr = JsmnSolLib.getBytes(
						json,
						tokens[j + 1].start,
						tokens[j + 1].end
					);
					uint256 fundingPercentage = uint256(
						JsmnSolLib.parseInt(fundingStr)
					);
					payout =
						(project.totalContributions * fundingPercentage) /
						100;
					break;
				}
			}

			// Transfer payout to project address and decrement total funds
			project.projectAddress.transfer(payout);
			totalFunds -= payout;
		}
	}
}
