import React, { useState } from "react";
import ProjectsSelect, { type Project } from "./ProjectsSelect";
import { useAccount } from "wagmi";
import { submitOpenFundingRound } from "~~/utils/quadratic/submit";

const projects = [
  {
    id: "0",
    name: "it's the first one",
    description: "new project",
  },
  {
    id: "1",
    name: "it's the second one",
    description: "not new project",
  },
  {
    id: "2",
    name: "one more project",
    description: "very old project",
  },
];

const RoundCreationForm: React.FC = () => {

  const [roundTitle, setRoundTitle] = useState<string>("");
  const [roundId, setRoundId] = useState<string>("");
  const [roundDescription, setRoundDescription] = useState<string>("");
  const [chosenProjects, setChosenProjects] = useState<Project[]>([]);

  const { address, connector } = useAccount();

  const handleSubmit = async (event: React.FormEvent) => {
    console.log("GM");
    event.preventDefault();

    if (!address || !connector) return;
    const provider = connector.options.getProvider();

    const functionArguments = {
      id: roundId,
      name: roundTitle,
      description: roundDescription,
      funding_curve: "x^2",
      projectIds: chosenProjects.map(project => project.id),
      projectNames: chosenProjects.map(project => project.name),
      projectDescriptions: chosenProjects.map(project => project.description),
    };

    console.log("AVH functionArguments: " + functionArguments);
    await submitOpenFundingRound(
      address,
      provider,
      functionArguments,
    );
  };
  console.log(chosenProjects);

  return (
    <form className="flex flex-col w-full px-2" onSubmit={handleSubmit}>
      <label className="form-control w-full my-1">
        <span className="label-text-alt">Round title</span>
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
        <span className="label-text-alt">ID</span>
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
        <span className="label-text-alt">Description</span>
        <textarea
          className="textarea textarea-bordered h-24 rounded-none"
          placeholder="Description"
          value={roundDescription}
          onChange={e => setRoundDescription(e.target.value)}
          required
        ></textarea>
      </label>

      <label className="form-control w-full my-1">
        <span className="label-text-alt">Projects</span>
        <ProjectsSelect projects={projects} setChoosenProjects={setChosenProjects} />
      </label>

      <button type="submit" className="btn rounded-none my-4">
        Submit
      </button>
    </form>
  );
};

export default RoundCreationForm;
