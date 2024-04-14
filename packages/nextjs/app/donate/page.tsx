"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { useAccount } from "wagmi";

const Donate: NextPage = () => {
  const [amount, setAmount] = useState(0);
  const { address } = useAccount();
  const router = useRouter();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(event.target.value));
  };

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault;
    if (!address) {
      // toast.error("Please login");
    }
    console.log("donate");

    router.push("/donate-success");
  };

  return (
    <div className="donate flex flex-col items-center justify-center mx-auto my-10 h-full">
      <div className="bg-black max-w-sm text-white py-0 flex items-center border-2 border-white q-shadow">
        <input
          type="number"
          id="amount"
          className="bg-transparent flex-grow outline-none placeholder-gray-600 placeholder-opacity-50 text-center"
          placeholder="AMOUNT"
          value={amount}
          onChange={handleInputChange}
        />
        <button onClick={handleClick} className="fund-button border-l-2 border-white px-6 py-2 ml-4">
          DONATE
        </button>
      </div>
    </div>
  );
};

export default Donate;
