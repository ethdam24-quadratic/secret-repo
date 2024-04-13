"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Project } from "~~/components/rounds-and-votes/IProject";
import ProjectCard from "~~/components/rounds-and-votes/ProjectCard";
import RoundCard from "~~/components/rounds-and-votes/RoundCard";
import { projects } from "~~/utils/quadratic/projects";

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

  const { address, connector } = useAccount();

  const handleInputChange = (id: string, newValue: number) => {
    setProjectVotes(projectVotes.map(project => (project.id === id ? { ...project, value: newValue } : project)));
  };

  const handleFund = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("fund");

    //subMIT HERE!!!!!!!
    
    console.log(!address, !connector);
  };

  return (
    <div className="flex flex-col items-center md:px-12 sm:px-4">
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
    </div>
  );
};

export default Vote;
