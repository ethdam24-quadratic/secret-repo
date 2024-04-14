// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
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
		bool isDistributed;
	}

	struct ProjectFundingData {
		string projectId;
		uint256 fundingPercentage;
	}

	mapping(uint256 => FundingRound) public fundingRounds;
	uint256[] public roundIds;

	// ========================================
	//     CONSTRUCTOR AND VALUES
	// ========================================

	IGateway public gatewayContract;
	// address public constant gatewayAddressSepolia =
	// 	address(0x3879E146140b627a5C858a08e507B171D9E43139);

	constructor(address gatewayAddress) {
		gatewayContract = IGateway(gatewayAddress);
	}

	// ========================================
	//     EVENTS
	// ========================================
	event RoundCreated(
		uint256 indexed roundId,
		string name,
		uint256[] projectIds
	);
	event ProjectCreated(uint256 indexed projectId, string name);

	event RoundCreatedInSecret(uint256 indexed roundId);

	event ContributionReceived(address indexed contributor);

	event ContributionReceivedInSecret(uint256 indexed roundId);

	event RoundClosed(uint256 indexed roundId);

	event RoundClosedInSecret(uint256 indexed roundId);

	event DistributedTokens(uint256 indexed roundId);

	event DistributedTokensInSecret(uint256 indexed roundId);

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
		address userAddress,
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
		// require(fundingRounds[id].id == 0, "Round ID exists");

		if (sendToSecret) {
			gatewayContract.send{ value: msg.value }(
				payloadHash,
				userAddress,
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
	function createdFundingRound(uint256 roundId, bytes memory json) public {
		emit RoundCreatedInSecret(roundId);
	}

	function contribute(
		address userAddress,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		gatewayContract.send{
			value: estimateRequestPrice((info.callback_gas_limit * 3) / 2)
		}(payloadHash, userAddress, routingInfo, info);
		emit ContributionReceived(userAddress);
	}

	// callback function for secret
	function contributed(uint256 roundId, bytes memory json) public {
		emit ContributionReceivedInSecret(roundId);
	}

	function closeFundingRound(
		uint256 roundId,
		bool sendToSecret,
		address userAddress,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		// require(fundingRounds[roundId].isOpen, "Round closed");
		fundingRounds[roundId].isOpen = false;

		if (sendToSecret) {
			gatewayContract.send{ value: msg.value }(
				payloadHash,
				userAddress,
				routingInfo,
				info
			);
		}

		emit RoundClosed(roundId);
	}

	// callback function for secret
	function closedFundingRound(uint256 roundId, bytes memory json) public {
		emit RoundClosedInSecret(roundId);
	}

	function distributeFunding(
		uint256 roundId,
		address userAddress,
		bytes32 payloadHash,
		string calldata routingInfo,
		IGateway.ExecutionInfo calldata info
	) public payable {
		// require(!fundingRounds[roundId].isOpen, "Round is not closed");
		// require(!fundingRounds[roundId].isDistributed, "Already distributed");
		gatewayContract.send{ value: msg.value }(
			payloadHash,
			userAddress,
			routingInfo,
			info
		);
		fundingRounds[roundId].isDistributed = true;
		emit DistributedTokens(roundId);
	}

	// callback function for secret
	function distributedFunding(uint256 roundId, bytes memory json) public {
		// ProjectFundingData[] memory fundingData = parseFundingData(
		// 	string(json)
		// );
		ProjectFundingData[] memory fundingData = parseFundingDataCsv(
			string(json)
		);
		processFundingRound(fundingData, roundId);
		emit DistributedTokensInSecret(roundId);
	}

	// ========================================
	//     HELPER FUNCTIONS
	// ========================================

	function getAllRoundIds() public view returns (uint256[] memory) {
		return roundIds;
	}

	function validateProjectParameters(
		uint256[] memory projectIds,
		string[] memory projectNames,
		string[] memory projectDescriptions,
		address payable[] memory projectAddresses
	) private pure {
		// require(
		// 	projectIds.length == projectNames.length &&
		// 		projectNames.length == projectDescriptions.length &&
		// 		projectDescriptions.length == projectAddresses.length,
		// 	"Mismatched input arrays"
		// );
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
			// require(round.projects[projectIds[i]].id == 0, "Project ID exists");
			round.projects[projectIds[i]] = Project({
				id: projectIds[i],
				name: projectNames[i],
				description: projectDescriptions[i],
				projectAddress: projectAddresses[i],
				totalContributions: 0,
				totalSquareRoots: 0
			});
			round.projectIds.push(projectIds[i]);
			emit ProjectCreated(
				round.projects[projectIds[i]].id,
				round.projects[projectIds[i]].name
			);
		}
	}

	function validRound(uint256 roundId) private view returns (bool) {
		return fundingRounds[roundId].isOpen && fundingRounds[roundId].id != 0;
	}

	// Parses the JSON and extracts funding data
	function parseFundingDataCsv(
		string memory csvString
	) internal pure returns (ProjectFundingData[] memory) {
		string[] memory rows = split(string(csvString), ";");

		ProjectFundingData[] memory results = new ProjectFundingData[](
			rows.length
		);
		for (uint i = 0; i < rows.length; i++) {
			string[] memory item = split(rows[i], ",");
			results[i] = ProjectFundingData(
				item[0],
				uint256(stringToUint(item[1]))
			);
		}

		return results;
	}

	// Processes each project's funding based on parsed data
	function processFundingRound(
		ProjectFundingData[] memory fundingData,
		uint256 roundId
	) internal {
		// uint256 totalFunds = fundingRounds[roundId].totalContributions;
		for (uint256 i = 0; i < fundingData.length; i++) {
			Project storage project = fundingRounds[roundId].projects[
				fundingRounds[roundId].projectIds[i]
			];
			// uint256 payout = 100;
			// uint256 payout = (project.totalContributions *
			// 	fundingData[i].fundingPercentage) / 100;
			uint256 payout = calculatePayout(project, fundingData);

			project.projectAddress.transfer(payout);
			// totalFunds -= payout;
		}
	}

	// Calculates the payout for a given project
	function calculatePayout(
		Project storage project,
		ProjectFundingData[] memory fundingData
	) internal view returns (uint256) {
		for (uint256 i = 0; i < fundingData.length; i++) {
			if (
				keccak256(bytes(fundingData[i].projectId)) ==
				keccak256(bytes(uint2str(project.id)))
			) {
				return
					(project.totalContributions *
						fundingData[i].fundingPercentage) / 100;
			}
		}
		return 0;
	}

	//helper for SecretPath Gateway

	function estimateRequestPrice(
		uint32 _callbackGasLimit
	) private view returns (uint256) {
		uint256 baseFee = _callbackGasLimit * block.basefee;
		return baseFee;
	}

	function uint2str(uint i) internal pure returns (string memory) {
		if (i == 0) return "0";
		uint j = i;
		uint len;
		while (j != 0) {
			len++;
			j /= 10;
		}
		bytes memory bstr = new bytes(len);
		uint k = len - 1;
		while (i != 0) {
			bstr[k--] = bytes1(uint8(48 + (i % 10)));
			i /= 10;
		}
		return string(bstr);
	}

	function split(
		string memory str,
		string memory delimiter
	) internal pure returns (string[] memory) {
		bytes memory strBytes = bytes(str);
		bytes memory delimiterBytes = bytes(delimiter);

		uint count = 1; // Start with 1 to include the last element
		for (uint i = 0; i < strBytes.length; i++) {
			if (strBytes[i] == delimiterBytes[0]) count++;
		}

		string[] memory parts = new string[](count);
		uint index = 0;
		uint lastIndex = 0;

		for (uint i = 0; i < strBytes.length; i++) {
			if (strBytes[i] == delimiterBytes[0]) {
				parts[index] = new string(i - lastIndex);
				bytes memory partBytes = bytes(parts[index]);

				for (uint j = 0; j < partBytes.length; j++) {
					partBytes[j] = strBytes[lastIndex + j];
				}

				index++;
				lastIndex = i + 1;
			}
		}

		// Push the last part
		parts[index] = new string(strBytes.length - lastIndex);
		bytes memory partBytes = bytes(parts[index]);
		for (uint i = 0; i < partBytes.length; i++) {
			partBytes[i] = strBytes[lastIndex + i];
		}

		return parts;
	}

	function stringToUint(string memory s) public pure returns (uint) {
		bytes memory b = bytes(s);
		uint result = 0;
		for (uint i = 0; i < b.length; i++) {
			// c must be a number from '0' to '9'
			if (b[i] >= 0x30 && b[i] <= 0x39) {
				result = result * 10 + (uint8(b[i]) - 48); // ASCII '0' is 48
			} else {
				// Handle non-numeric characters; revert the transaction
				revert("Non-numeric character encountered.");
			}
		}
		// Optional: Add a check to ensure the number is within the expected range
		require(result <= 100, "Number out of expected range.");
		return result;
	}
}
