"use client";

import contractAbi from "../../abi/Funding.json";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { submit } from "~~/utils/quadratic/submit";

const FundAndVote: NextPage = () => {
  const { address, connector } = useAccount();

  const CONTRACT_ADDRESS = "0xd2afe636a676aDF5Fd5CC414C95d3d45baF85954";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!address || !connector) return;
    const provider = connector.options.getProvider();

    const functionArguments = {
      id: "123",
      name: "new funding round",
      description: "a lot of good things",
      projectIds: ["1", "2", "3"],
      projectNames: ["first", "second", "third"],
      projectDescriptions: ["first", "second", "third"],
      payloadHash: "",
      routingInfo: "123",
      info: "info",
    };

    await submit(
      address,
      provider,
      CONTRACT_ADDRESS,
      contractAbi,
      "createFundingRound",
      functionArguments,
      "createFundingRound",
      Number("123456"),
    );
  };

  return (
    <div className="container mx-auto my-10">
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default FundAndVote;
