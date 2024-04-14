"use client";

// import { useEffect, useState } from "react";
import Link from "next/link";
// import ethers from "ethers";
import type { NextPage } from "next";
// import { useAccount } from "wagmi";
import { Round } from "~~/components/rounds-and-votes/IRound";
import Metrics from "~~/components/rounds-and-votes/Metrics";
import RoundCard from "~~/components/rounds-and-votes/RoundCard";
// import externalContracts from "~~/contracts/externalContracts";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

const rounds: Round[] = [
  {
    id: "3",
    title: "R3",
    status: "active",
    imgSrc: "/rounds/round1.png",
  },
  {
    id: "2",
    title: "R2",
    status: "closed",
    imgSrc: "/rounds/round2.png",
  },
  {
    id: "0",
    title: "R1",
    status: "closed",
    imgSrc: "/rounds/round3.png",
  },
];

const Overview: NextPage = () => {
  // const [projects, setProjects] = useState();

  // const { data: projects } = useScaffoldContractRead({
  //   contractName: "Funding",
  //   functionName: "getAllRoundIds",
  //   args: [],
  // });

  // console.log(projects);
  // const projectsAmount = projects ? projects.length : 0;
  const projectsAmount = 8;

  return (
    <div className="container mx-auto my-10">
      {rounds.map(round => (
        <Link key={round.id} href="/vote">
          <RoundCard title={round.title} status={round.status} imgSrc={round.imgSrc || ""} />
        </Link>
      ))}
      <Metrics projectsAmount={projectsAmount} />
    </div>
  );
};

export default Overview;
