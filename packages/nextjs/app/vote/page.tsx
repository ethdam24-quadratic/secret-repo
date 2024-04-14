"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Project } from "~~/components/rounds-and-votes/IProject";
import ProjectCard from "~~/components/rounds-and-votes/ProjectCard";
import RoundCard from "~~/components/rounds-and-votes/RoundCard";
import { projects } from "~~/utils/quadratic/projects";
import { submitVote } from "~~/utils/quadratic/submit";

const round = {
  id: "3",
  title: "R3",
  status: "active",
  imgSrc: "/rounds/round1.png",
};

const Vote: NextPage = () => {
  const [projectVotes, setProjectVotes] = useState<Project[]>(
    projects.map(item => {
      const _item: Project = {
        ...item,
        value: 0,
      };
      return _item;
    }),
  );

  const [roundClosed, setRoundClosed] = useState(round.status === "active" ? false : true);
  const { address, connector } = useAccount();
  const router = useRouter();

  const handleInputChange = (id: string, newValue: number) => {
    setProjectVotes(projectVotes.map(project => (project.id === id ? { ...project, value: newValue } : project)));
  };

  const handleFund = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("handlefund 1");
    if (!address || !connector) return;
    const provider = connector.options.getProvider();

    console.log("handlefund 2");
    const functionArguments = {
      funding_round_id: 3, // todo hardcoded? should we change it?
      voter_address: projectVotes.map(p => p.address),
      votes: projectVotes.map(p => p.value),
    };

    console.log("handlefund 3");
    await submitVote(address, provider, functionArguments);
    console.log(!address, !connector);

    router.push("/vote-success");
  };

  const handleManageRound = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!roundClosed) {
      console.log("Close round");
      setRoundClosed(true);
    } else {
      console.log("Trigger payout");
    }
  };

  return (
    <div className="vote flex flex-col items-center md:px-12 sm:px-4 pb-12">
      <RoundCard round={round} />
      <div className="container mx-auto my-10 grid md:grid-cols-2 md:grid-cols-1 gap-4">
        {projectVotes.map(item => (
          <ProjectCard key={item.id} project={item} handleInputChange={handleInputChange} />
        ))}
      </div>

      <div className="bg-black max-w-sm text-white py-0 flex items-center border-2 border-white q-shadow my-5 mb-12">
        <label
          className="bg-transparent min-w-40 flex-grow outline-none placeholder-gray-600 placeholder-opacity-50 text-center"
          placeholder="VOTING POWER"
          style={{
            minWidth: "150px",
          }}
        />
        <button onClick={handleFund} className="fund-button border-l-2 border-white px-6 py-2 ml-4">
          FUND
        </button>
      </div>

      <button onClick={handleManageRound} className="underline underline-offset-8 mb-2 text-white">
        {!roundClosed ? "CLOSE THE ROUND" : "TRIGGER PAYOUT"}
      </button>
      <span className="text-sm">* Must be the round admin</span>
    </div>
  );
};

export default Vote;
