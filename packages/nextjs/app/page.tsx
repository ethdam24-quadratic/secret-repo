"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="landing flex justify-center items-center flex-col h-full px-3 flex-1">
      <h1 className="text-center mt-8 mb-6">
        <span className="flow-block">SOME</span> DECISIONS ARE MEANT TO BE <span className="flow-block">PRIVATE</span>
      </h1>
      <ConnectButton label="LOGIN" chainStatus="none" showBalance={false} />
    </div>
  );
};

export default Home;
