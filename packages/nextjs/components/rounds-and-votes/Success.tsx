/* eslint-disable @next/next/no-img-element */
import React from "react";

interface SuccessProps {
  title: string;
  imgSrc: string;
}

function Success({ title, imgSrc }: SuccessProps): JSX.Element {
  return (
    <div className="success container flex flex-col max-w-lg mx-auto mt-12">
      <h1 className="text-center">{title}</h1>

      <div className="mt-8 mb-4 text-center">share via</div>
      <div className="flex flex-row items-center justify-center mb-8">
        <img
          className="mx-5"
          src="/icons/icon1.png"
          alt="share"
          style={{
            objectFit: "contain",
            height: "40px",
          }}
        />
        <img
          className="mx-5"
          src="/icons/icon2.png"
          alt="share"
          style={{
            objectFit: "contain",
            height: "40px",
          }}
        />
        <img
          className="mx-5"
          src="/icons/icon3.png"
          alt="share"
          style={{
            objectFit: "contain",
            height: "40px",
          }}
        />
      </div>

      <figure className="flex items-center">
        <img
          src={imgSrc || ""}
          alt="success"
          style={{
            objectFit: "contain",
          }}
        />
      </figure>
    </div>
  );
}

export default Success;
