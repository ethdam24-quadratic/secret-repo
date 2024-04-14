"use client";

import React from "react";
import type { NextPage } from "next";
import Success from "~~/components/rounds-and-votes/Success";

const SuccessPage: NextPage = () => {
  return <Success title="YOUR ROUND IS NOW LIVE: CONGRATS!" imgSrc="/success/round.png" />;
};

export default SuccessPage;
