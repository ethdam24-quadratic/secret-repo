use cosmwasm_std::{Addr, Binary};
use secret_toolkit::utils::HandleCallback;

use tnls::{
    msg::{PostExecutionMsg, PrivContractHandleMsg},
    state::Task,
};


use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Input { message: PrivContractHandleMsg },
    CloseVoting { input_values: String, task: Task, input_hash: Binary },
    CreateVoting { input_values: String, task: Task, input_hash: Binary },
    Vote { input_values: String, task: Task, input_hash: Binary }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CloseFundingRoundMsg {
    // Unique identifier for the funding round
    pub id: String,
    //Admin Address
    pub admin_address: String
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct TriggerPayoutMsg {
    // Unique identifier for the funding round
    pub funding_round_id: String,
    //Admin Address
    pub admin_address: String
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct OpenFundingRoundMsg {
    // Name of the funding round
    pub name: String,
    // Unique identifier for the funding round
    pub id: String,
    // Description of the funding round
    pub description: String,
    // Definition of the funding curve used in the round
    pub funding_curve: String,
    // List of projects participating in the funding round
    pub projects: Vec<ProjectItem>,
    // List of addresses allowed to participate in the funding round
    pub allowlist: Vec<String>,
    //Admin Address
    pub admin_address: String
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct VotesMsg {
    // Identifier of the associated funding round
    pub funding_round_id: String,
    // Address of the voter
    pub voter_address: String,
    // Details of the vote cast
    pub votes: Vec<VoteItem>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ProjectItem {
    // Name of the project
    pub name: String,
    // Unique identifier for the project
    pub id: String,
    // Description of the project
    pub description: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct VoteItem {
    // Identifier of the project voted on
    pub project_id: String,
    // Description of the voting choice or reason
    pub vote_amount: u128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseCreateVoteMsg {
    // response message
    pub message: String,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseVoteMsg {
    // response message
    pub message: String,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseCloseVotingMsg {
    // response message
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct FundingResult {
    pub project_id: String,
    pub funding_percentage: u128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseTriggerPayoutMsg {
    // response message
    pub message: String,
    // response message
    pub tally: Vec<FundingResult>
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    RetrieveValue { key: String, viewing_key: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct QueryResponse {
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum GatewayMsg {
    Output { outputs: PostExecutionMsg },
}

impl HandleCallback for GatewayMsg {
    const BLOCK_SIZE: usize = 256;
}
