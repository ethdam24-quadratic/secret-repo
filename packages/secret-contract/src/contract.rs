use crate::{
    msg::{
        ExecuteMsg, GatewayMsg, ResponseCreateVoteMsg, InstantiateMsg, QueryMsg,
        QueryResponse, ResponseVoteMsg, ResponseCloseVotingMsg, OpenFundingRoundMsg, 
        VotesMsg, CloseFundingRoundMsg, VoteItem,
        TriggerPayoutMsg, FundingResult
    },
    state::{State, CONFIG, FUNDING_ROUND_MAP, VOTES_MAP, VOTERS_OF_FUNDING_ROUND_MAP, FundingRoundItem, VoteAssociation},
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
    let funding_round_storage = FundingRoundItem {
        name: input.name.clone(),
        id: input.id.clone(),
        description: input.description,
        funding_curve: input.funding_curve,
        projects: input.projects,
        allowlist: input.allowlist,
        is_running: true,
        admin_address: input.admin_address
    };

    // map funding round id to the funding round
    FUNDING_ROUND_MAP.insert(deps.storage, &input.id.clone(), &funding_round_storage)?;

    let data = ResponseCreateVoteMsg {
        message: "Funding round setup successfully".to_string(),
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

    let funding_round = FUNDING_ROUND_MAP
        .get(deps.storage, &input.funding_round_id)
        .ok_or_else(|| StdError::generic_err("Funding round not found"))?;
    
    if !funding_round.is_running {
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

    // Filter votes to only include those for projects that are part of the current funding round.
    let valid_project_ids: Vec<String> = funding_round.projects.iter().map(|p| p.id.clone()).collect();

    // Validate and collect votes for the allowed projects only.
    let valid_votes = input.votes.into_iter()
        .filter(|vote| valid_project_ids.contains(&vote.project_id))
        .collect::<Vec<VoteItem>>();

    if valid_votes.is_empty() {
        return Err(StdError::generic_err("No valid projects voted on in this funding round"));
    }
    
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
    aggregate_votes(&mut votes_map, valid_votes);

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

    let mut funding_round = FUNDING_ROUND_MAP
        .get(deps.storage, &input.id)
        .ok_or_else(|| StdError::generic_err("Value for this key not found"))?;

    if funding_round.admin_address != input.admin_address {
        return Err(StdError::generic_err("Admin Address not matching".to_string()))
    }

    funding_round.is_running = false;

    FUNDING_ROUND_MAP.insert(deps.storage, &input.id, &funding_round)?;

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

    let funding_round = FUNDING_ROUND_MAP
        .get(deps.storage, &input.funding_round_id)
        .ok_or_else(|| StdError::generic_err("Funding round not found"))?;

    if funding_round.admin_address != input.admin_address {
        return Err(StdError::generic_err("Admin Address not matching".to_string()))
    }
    if funding_round.is_running {
        return Err(StdError::generic_err("Funding Round still running".to_string()))
    }

    let voters_of_funding_round_map = VOTERS_OF_FUNDING_ROUND_MAP
        .get(deps.storage, &input.funding_round_id)
        .unwrap_or_default();

    let funding_results = calculate_curve_funding(deps, input.funding_round_id, funding_round.funding_curve)
        .map_err(|e| {
            // Log the error or handle it differently here
            StdError::generic_err("Tally calculation failed")
        })?;

        let formatted_list: Vec<String> = funding_results.iter().map(|result| {
            format!("{},{}", result.project_id, result.funding_percentage)
        }).collect();
        
        let final_string = formatted_list.join(";");

    // Encode the JSON string to base64
    let result = base64::encode(final_string);

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
                let contribution = apply_inverse_math_operation(&curve, vote_item.vote_amount as u128);
                *project_contributions.entry(vote_item.project_id.clone()).or_insert(0) += contribution;
                total_votes += vote_item.vote_amount as u128;  // Summing up all vote amounts to get total budget
            }
        }
    }

    let sum_of_contributions = project_contributions.values()
        .sum::<u128>();

    let total_funding = apply_math_operation(&curve, sum_of_contributions);

    // Calculate percentages based on total budget
    let results: Vec<FundingResult> = project_contributions.iter().map(|(project_id, &sum)| {
        let funding_amount = apply_math_operation(&curve, sum);
        let funding_percentage = if total_funding > 0 { (funding_amount * 100) / total_funding } else { 0 };
        FundingResult {
            project_id: project_id.clone(),
            funding_percentage,
        }
    }).collect();

    Ok(results)
}

fn apply_math_operation(operation: &str, value: u128) -> u128 {
    match operation {
        "x" => value, // No operation, return value as is
        "x^2" => value.pow(2), // Square the value
        "x^3" => value.pow(3), // Cube the value
        "x^4" => value.pow(4), // Fourth power of the value
        "exp" => 2u128.pow(value as u32), // 2 raised to the power of `value`
        _ => panic!("Unsupported operation"), // Handle unsupported operations
    }
}

fn apply_inverse_math_operation(operation: &str, value: u128) -> u128 {
    match operation {
        "x" => value, //linear, classical voting
        "x^2" => integer_square_root(value),
        "x^3" => integer_cube_root(value),
        "x^4" => integer_fourth_root(value),
        "exp" => {
            integer_log(value, 2)
        },
        _ => panic!("Unsupported operation"),
    }
}

fn integer_square_root(value: u128) -> u128 {
    let mut x = value;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + value / x) / 2;
    }
    x
}
fn integer_cube_root(value: u128) -> u128 {
    let mut x = value;
    let mut y = (x + 1) / 3;
    while y < x {
        x = y;
        y = (2 * x + value / (x * x)) / 3;
    }
    x
}
fn integer_fourth_root(value: u128) -> u128 {
    let mut x = value;
    let mut y = (x + 1) / 4;
    while y < x {
        x = y;
        y = (3 * x + value / (x * x * x)) / 4;
    }
    x
}
fn integer_log(value: u128, base: u128) -> u128 {
    let mut count = 0;
    let mut product = 1;

    while product <= value / base {
        product *= base;
        count += 1;
    }
    count
}