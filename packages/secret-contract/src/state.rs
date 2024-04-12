use cosmwasm_std::{Addr, Binary};
use secret_toolkit::storage::{Item, Keymap};

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use crate::msg::{ProjectItem, VoteItem};

pub static CONFIG: Item<State> = Item::new(b"config");
pub static FOUNDING_ROUND_MAP: Keymap<String, FundingRoundItem> = Keymap::new(b"FOUNDING_ROUND_MAP");
pub static VOTES_MAP: Keymap<VoteAssociation, VoteItems> = Keymap::new(b"VOTES_MAP");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct FundingRoundItem {
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
    // Bool that contains if the funding round is still running
    pub is_running: bool,
    //Admin Address
    pub admin_address: String
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct VoteItems {
    // Details of the vote cast
    pub votes: Vec<VoteItem>,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct VoteAssociation {
    // Identifier of the associated funding round
    pub funding_round_id: String,
    // Address of the voter
    pub voter_address: String,
}