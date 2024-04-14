"use client";

import React from "react";
import type { NextPage } from "next";
import Success from "~~/components/rounds-and-votes/Success";

const SuccessPage: NextPage = () => {
  return <Success title="YOUR DONATION IS NOW ADDED TO THE POOL: THANKS!" imgSrc="/success/donation.png" />;
};

export default SuccessPage;
