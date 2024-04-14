"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ethers from "ethers";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Round } from "~~/components/rounds-and-votes/IRound";
import Metrics from "~~/components/rounds-and-votes/Metrics";
import RoundCard from "~~/components/rounds-and-votes/RoundCard";
import externalContracts from "~~/contracts/externalContracts";
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
  const [projects, setProjects] = useState();
  const { connector } = useAccount();

  const { data } = useScaffoldContractRead({
    contractName: "Funding",
    functionName: "getAllRoundsIds",
    args: [],
  });



  useEffect(() => {
    const fetchProjects = async () => {
      if (!connector || !window?.ethereum) return;
      // const provider = connector.options.getProvider();
      const provider = new ethers.providers.JsonRpcProvider("https://rpc.sepolia.org");

      // const provider = new ethers.providers.Web3Provider(window?.ethereum);
      console.log(provider);

      const fundingContract = externalContracts["11155111"].Funding;

      try {
        console.log("slkdjf");
        const contract = new ethers.Contract(fundingContract.address, fundingContract.abi, provider);
        // Call the read-only method
        const data = await contract.getAllRoundsIds();
        console.log("Data from contract:", data.toString());
      } catch (error) {
        console.error("Error reading from contract:", error);
      }
    };

    fetchProjects();
  }, [connector]);

  // if (!address || !connector) return;
  //   const provider = connector.options.getProvider();

  // const { data } = useScaffoldContractRead<"Funding", "getAllRoundsIds"> ({
  //   contractName: "Funding",
  //   functionName: "getAllRoundsIds",
  //   args: [],
  // });

  return (
    <div className="container mx-auto my-10">
      {rounds.map(round => (
        <Link key={round.id} href="/vote">
          <RoundCard title={round.title} status={round.status} imgSrc={round.imgSrc || ""} />
        </Link>
      ))}
      <Metrics />
    </div>
  );
};

export default Overview;
