export interface VoteItem {
  projectId: string;
  voteAmount: number;
}

export interface VotesMsg {
  fundingRoundId: string;
  voterAddress: string;
  votes: VoteItem[];
}
