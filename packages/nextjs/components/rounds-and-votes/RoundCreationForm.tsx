/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { useRouter } from "next/navigation";
// import contractAbi from "../../abi/Funding.json";
import FunctionSelect from "./FunctionSelect";
import { Project } from "./IProject";
import ProjectsSelect from "./ProjectsSelect";
// import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { projects } from "~~/utils/quadratic/projects";
import { submitCloseFundingRound, submitOpenFundingRound, submitTriggerPayout } from "~~/utils/quadratic/submit";

const admin_address = "0x50FcF0c327Ee4341313Dd5Cb987f0Cd289Be6D4D";

const RoundCreationForm: React.FC = () => {
  const [roundTitle, setRoundTitle] = useState<string>("");
  const [roundId, setRoundId] = useState<string>("");
  const [roundDescription, setRoundDescription] = useState<string>("");
  const [chosenProjects, setChosenProjects] = useState<Project[]>([]);
  const [curve, setCurve] = useState<any>("x");

  const { address, connector } = useAccount();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!address || !connector) return;
    const provider = connector.options.getProvider();

    const functionArguments = {
      id: roundId,
      name: roundTitle,
      description: roundDescription,
      funding_curve: curve.value,
      projectIds: chosenProjects.map(project => project.id),
      projectNames: chosenProjects.map(project => project.name),
      projectDescriptions: chosenProjects.map(project => project.description),
      projectAddresses: chosenProjects.map(project => project.address),
      projects: chosenProjects,
    };
    console.log("AVH functionArguments: " + JSON.stringify(functionArguments));
    await submitOpenFundingRound(address, provider, functionArguments);
  };

  return (
    <form className="create-round flex flex-col w-full px-2" onSubmit={handleSubmit}>
      <label className="form-control w-full my-1">
        <span className="">Round title</span>
        <input
          type="text"
          value={roundTitle}
          onChange={e => setRoundTitle(e.target.value)}
          placeholder="Type here"
          className="input input-bordered w-full rounded-none"
          required
        />
      </label>

      <label className="form-control w-full my-1">
        <span className="">ID</span>
        <input
          type="text"
          value={roundId}
          onChange={e => setRoundId(e.target.value)}
          placeholder="Type here"
          className="input input-bordered w-full rounded-none"
          required
        />
      </label>

      <label className="form-control w-full my-1">
        <span className="">Funding curve</span>
        <FunctionSelect setCurve={setCurve} />
      </label>

      <label className="form-control w-full my-1">
        <span className="">Description</span>
        <textarea
          className="textarea textarea-bordered h-24 rounded-none"
          placeholder="Description"
          value={roundDescription}
          onChange={e => setRoundDescription(e.target.value)}
          required
        ></textarea>
      </label>

      <label className="form-control w-full my-1">
        <span className="">Projects</span>
        <ProjectsSelect projects={projects} setChoosenProjects={setChosenProjects} />
      </label>

      <button
        type="submit"
        style={{
          maxWidth: "fit-content",
        }}
        className="fund-button q-shadow border-2 border-white p-2 my-5 mt-10 px-6 self-center"
      >
        SUBMIT
      </button>
    </form>
  );
};

export default RoundCreationForm;
