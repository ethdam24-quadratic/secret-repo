"use client";

// import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { NetworkOptions } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton/NetworkOptions";

const Home: NextPage = () => {
  const { address } = useAccount();
  return (
    <div className="landing flex justify-center items-center flex-col h-full px-3 flex-1">
      <h1 className="text-center mt-8 mb-6">
        SOME <span className="flow-block">DECISIONS</span> ARE MEANT <br />
        TO BE <span className="flow-block">PRIVATE</span>
      </h1>
      {/* <ConnectButton label="LOGIN" chainStatus="none" showBalance={false} /> */}
      {address && (
        <ul className="switch-network flex flex-col">
          <NetworkOptions />
        </ul>
      )}
    </div>
  );
};

export default Home;
