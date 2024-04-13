"use client";

import type { NextPage } from "next";
import VotingCreationForm from "~~/components/RoundCreationForm";

const Quadratic: NextPage = () => {
  return (
    <div className="container mx-auto my-10">
      <VotingCreationForm />
    </div>
  );
};

export default Quadratic;
