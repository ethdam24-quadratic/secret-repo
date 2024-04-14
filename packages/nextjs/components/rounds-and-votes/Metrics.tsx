/* eslint-disable @next/next/no-img-element */
import React from "react";

function Metrics({ projectsAmount }: { projectsAmount: number }): JSX.Element {
  return (
    <div className="metrics flex flex-row flex-wrap justify-center items-stretch">
      <div className="metric-card flex flex-col m-5">
        <h3>Live projects</h3>
        <div className="flex-1 flex flex-col justify-center">{projectsAmount}</div>
      </div>
      <div className="metric-card flex flex-col m-5">
        <h3>Total pool</h3>
        <div className="flex-1 flex flex-col justify-center">
          <strong>120/</strong>
          200Ξ
        </div>
      </div>
      <div className="metric-card flex flex-col m-5">
        <h3>Current donors</h3>
        <div className="flex-1 flex flex-col justify-center">62</div>
      </div>
    </div>
  );
}

export default Metrics;
