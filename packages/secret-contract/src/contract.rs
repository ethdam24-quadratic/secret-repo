use crate::{
    msg::{
        ExecuteMsg, GatewayMsg, ResponseCreateVoteMsg, InstantiateMsg, QueryMsg,
        QueryResponse, ResponseVoteMsg, ResponseCloseVotingMsg, OpenFundingRoundMsg, 
        VotesMsg, CloseFundingRoundMsg, VoteItem,
        TriggerPayoutMsg
    },
    state::{State, CONFIG, FOUNDING_ROUND_MAP, VOTES_MAP, VOTERS_OF_FUNDING_ROUND_MAP, FundingRoundItem, VoteAssociation},
};
use std::collections::HashMap;
use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult,
};
use secret_toolkit::utils::{pad_handle_result, pad_query_result, HandleCallback};
use tnls::{
    msg::{PostExecutionMsg, PrivContractHandleMsg},
    state::Task,
};

/// pad handle responses and log attributes to blocks of 256 bytes to prevent leaking info based on
/// response size
pub const BLOCK_SIZE: usize = 256;

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let state = State {
        gateway_address: msg.gateway_address,
        gateway_hash: msg.gateway_hash,
        gateway_key: msg.gateway_key,
    };

    CONFIG.save(deps.storage, &state)?;

    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    let response = match msg {
        ExecuteMsg::Input { message } => try_handle(deps, env, info, message),
        ExecuteMsg::CloseVoting {input_values, task, input_hash} => close_voting(deps, env, input_values, task, input_hash),
        ExecuteMsg::CreateVoting {input_values, task, input_hash} => create_voting(deps, env, input_values, task, input_hash),
        ExecuteMsg::Vote {input_values, task, input_hash} => vote(deps, env, input_values, task, input_hash),
    };
    pad_handle_result(response, BLOCK_SIZE)
}

// acts like a gateway message handle filter
fn try_handle(
    deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    msg: PrivContractHandleMsg,
) -> StdResult<Response> {
    // verify signature with stored gateway public key
    let gateway_key = CONFIG.load(deps.storage)?.gateway_key;
    deps.api
        .secp256k1_verify(
            msg.input_hash.as_slice(),
            msg.signature.as_slice(),
            gateway_key.as_slice(),
        )
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // determine which function to call based on the included handle
    let handle = msg.handle.as_str();
    match handle {
        "create_voting" => create_voting(deps, env, msg.input_values, msg.task, msg.input_hash),
        "close_voting" => close_voting(deps, env, msg.input_values, msg.task, msg.input_hash),
        "vote" => vote(deps, env, msg.input_values, msg.task, msg.input_hash),
        "trigger_payout" => trigger_payout(deps, env, msg.input_values, msg.task, msg.input_hash),
        _ => Err(StdError::generic_err("invalid handle".to_string())),
    }
}

fn create_voting(
    deps: DepsMut,
    _env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: OpenFundingRoundMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // create a task information store
    let founding_round_storage = FundingRoundItem {
        name: input.name.clone(),
        id: input.id.clone(),
        description: input.description,
        funding_curve: input.funding_curve,
        projects: input.projects,
        allowlist: input.allowlist,
        is_running: true,
        admin_address: input.admin_address
    };

    // map founding round id to the funding round
    FOUNDING_ROUND_MAP.insert(deps.storage, &input.id.clone(), &founding_round_storage)?;

    let data = ResponseCreateVoteMsg {
        message: "Founding round setup successfully".to_string(),
    };

    // Serialize the struct to a JSON string
    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    // Encode the JSON string to base64
    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new().add_message(callback_msg))
}

fn vote(
    deps: DepsMut,
    _env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let mut input: VotesMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    let founding_round = FOUNDING_ROUND_MAP
        .get(deps.storage, &input.funding_round_id)
        .ok_or_else(|| StdError::generic_err("Founding round not found"))?;
    
    if !founding_round.is_running {
        return Err(StdError::generic_err("Voting already ended"));
    }

    let vote_association = VoteAssociation {
        funding_round_id: input.funding_round_id.clone(),
        voter_address: input.voter_address.clone()
    };

    let mut voters_of_funding_round_map = VOTERS_OF_FUNDING_ROUND_MAP
        .get(deps.storage, &input.funding_round_id)
        .unwrap_or_default();

    let mut voters = vec![input.voter_address.clone()]; // Create a Vec with the voter's address

    voters_of_funding_round_map.append(&mut voters);

    VOTERS_OF_FUNDING_ROUND_MAP.insert(deps.storage, &input.funding_round_id, &voters_of_funding_round_map)?;

    let mut votes_map = VOTES_MAP
        .get(deps.storage, &vote_association)
        .unwrap_or_default();
    
    // Function to aggregate votes
    fn aggregate_votes(existing_votes: &mut Vec<VoteItem>, new_votes: Vec<VoteItem>) {
        for new_vote in new_votes {
            let mut found = false;
            for existing_vote in existing_votes.iter_mut() {
                // Check if the project ID matches
                if existing_vote.project_id == new_vote.project_id {
                    // Add the new vote amount to the existing one
                    existing_vote.vote_amount += new_vote.vote_amount;
                    found = true;
                    break;
                }
            }
            // If the project is not found in existing votes, add it
            if !found {
                existing_votes.push(new_vote);
            }   
        }
    }

    // Aggregate the votes
    aggregate_votes(&mut votes_map, input.votes);

    // Save the updated votes map back into the storage
    VOTES_MAP.insert(deps.storage, &vote_association, &votes_map)?;

    let data = ResponseVoteMsg {
        message: "Voted successfully".to_string(),
    };

    // Serialize the struct to a JSON string1
    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    // Encode the JSON string to base64
    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new().add_message(callback_msg))
}

fn close_voting(
    deps: DepsMut,
    _env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: CloseFundingRoundMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    let mut founding_round = FOUNDING_ROUND_MAP
        .get(deps.storage, &input.id)
        .ok_or_else(|| StdError::generic_err("Value for this key not found"))?;

    if founding_round.admin_address != input.admin_address {
        return Err(StdError::generic_err("Admin Address not matching".to_string()))
    }

    founding_round.is_running = false;

    FOUNDING_ROUND_MAP.insert(deps.storage, &founding_round.id, &founding_round)?;

    let data = ResponseCloseVotingMsg {
        message: "Closed Voting successfully".to_string(),
    };

    // Serialize the struct to a JSON string1
    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    // Encode the JSON string to base64
    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new().add_message(callback_msg))
}

fn trigger_payout(
    deps: DepsMut,
    _env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: TriggerPayoutMsg = serde_json_wasm::from_str(&input_values)
    .map_err(|err| StdError::generic_err(err.to_string()))?;

    let founding_round = FOUNDING_ROUND_MAP
        .get(deps.storage, &input.funding_round_id)
        .ok_or_else(|| StdError::generic_err("Founding round not found"))?;

    let voters_of_funding_round_map = VOTERS_OF_FUNDING_ROUND_MAP
        .get(deps.storage, &input.funding_round_id)
        .unwrap_or_default();

    let funding_results = calculate_curve_funding(deps, input.funding_round_id, founding_round.funding_curve)
    
    let data = ResponseVoteMsg {
        message: funding_results,
    };

    // Serialize the struct to a JSON string
    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    // Encode the JSON string to base64
    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new().add_message(callback_msg))
}

fn calculate_curve_funding(deps: DepsMut, funding_round_id: String, curve: String) -> Result<Vec<FundingResult>, StdError> {
    let voters_of_funding_round_map = VOTERS_OF_FUNDING_ROUND_MAP
        .get(deps.storage, &funding_round_id)
        .unwrap_or_default();

    let mut project_contributions: HashMap<String, u128> = HashMap::new();
    let mut total_votes = 0u128;  // This will calculate the total budget

    // Aggregate votes and calculate the total budget
    for voter_address in voters_of_funding_round_map {
        let vote_association = VoteAssociation {
            funding_round_id: funding_round_id.clone(),
            voter_address: voter_address.clone(),
        };

        if let Some(votes_map) = VOTES_MAP.get(deps.storage, &vote_association) {
            for vote_item in votes_map {
                let contribution_sqrt = integer_sqrt(vote_item.vote_amount as u128);
                *project_contributions.entry(vote_item.project_id.clone()).or_insert(0) += contribution_sqrt;
                total_votes += vote_item.vote_amount as u128;  // Summing up all vote amounts to get total budget
            }
        }
    }

    // Calculate the square of the sums of square roots for each project
    let total_funding = project_contributions.values()
        .map(|&sum_sqrt| sum_sqrt * sum_sqrt)
        .sum::<u128>();

    // Calculate percentages based on total budget
    let results: Vec<FundingResult> = project_contributions.iter().map(|(project_id, &sum_sqrt)| {
        let funding_amount = sum_sqrt * sum_sqrt;
        let funding_percentage = if total_funding > 0 { (funding_amount * 100) / total_funding } else { 0 };
        FundingResult {
            project_id: project_id.clone(),
            funding_percentage,
        }
    }).collect();

    Ok(results)
}

fn integer_sqrt(value: u128) -> u128 {
    let mut x = value;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + value / x) / 2;
    }
    x
}