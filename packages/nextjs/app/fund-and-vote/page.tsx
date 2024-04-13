"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";

const FundAndVote: NextPage = () => {
  const { address } = useAccount();
  return <div className="container mx-auto my-10">fund and vote page {address}</div>;
};

export default FundAndVote;
