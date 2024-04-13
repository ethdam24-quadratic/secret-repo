"use client";

import type { NextPage } from "next";
import VotingCreationForm from "~~/components/rounds-and-votes/RoundCreationForm";

const Quadratic: NextPage = () => {
  return (
    <div className="container max-w-3xl mx-auto my-10">
      <VotingCreationForm />
    </div>
  );
};

export default Quadratic;
