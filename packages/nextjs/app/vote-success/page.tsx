"use client";

import React from "react";
import type { NextPage } from "next";
import Success from "~~/components/rounds-and-votes/Success";

const SuccessPage: NextPage = () => {
  return <Success title="YOUR VOTE IS NOW IN: CONGRATS!" imgSrc="/success/vote.png" />;
};

export default SuccessPage;
