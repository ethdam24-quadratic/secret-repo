"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { Round } from "~~/components/rounds-and-votes/IRound";
import Metrics from "~~/components/rounds-and-votes/Metrics";
import RoundCard from "~~/components/rounds-and-votes/RoundCard";

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
