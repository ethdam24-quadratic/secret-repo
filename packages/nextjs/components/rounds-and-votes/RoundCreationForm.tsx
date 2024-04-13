import React, { useState } from "react";
import contractAbi from "../../abi/Funding.json";
import ProjectsSelect, { type Project } from "./ProjectsSelect";
import { useAccount } from "wagmi";
import { submit } from "~~/utils/quadratic/submit";

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
  const [name, setName] = useState<string>("");
  const [id, setId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [choosenProjects, setChoosenProjects] = useState<Project[]>([]);

  const { address, connector } = useAccount();

  const CONTRACT_ADDRESS = "0xd2afe636a676aDF5Fd5CC414C95d3d45baF85954";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!address || !connector) return;
    const provider = connector.options.getProvider();

    const functionArguments = {
      id: "123",
      name: "new funding round",
      description: "a lot of good things",
      projectIds: ["1", "2", "3"],
      projectNames: ["first", "second", "third"],
      projectDescriptions: ["first", "second", "third"],
      payloadHash: "",
      routingInfo: "123",
      info: "info",
    };

    await submit(
      address,
      provider,
      CONTRACT_ADDRESS,
      contractAbi,
      "createFundingRound",
      functionArguments,
      "createFundingRound",
      Number("123456"),
    );
  };

  console.log(choosenProjects);

  return (
    <form className="flex flex-col w-full px-2" onSubmit={handleSubmit}>
      <label className="form-control w-full my-1">
        <span className="label-text-alt">Round title</span>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Type here"
          className="input input-bordered w-full rounded-none"
          required
        />
      </label>

      <label className="form-control w-full my-1">
        <span className="label-text-alt">ID</span>
        <input
          type="text"
          value={id}
          onChange={e => setId(e.target.value)}
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
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        ></textarea>
      </label>

      <label className="form-control w-full my-1">
        <span className="label-text-alt">Projects</span>
        <ProjectsSelect projects={projects} setChoosenProjects={setChoosenProjects} />
      </label>

      <button type="submit" className="btn rounded-none my-4">
        Submit
      </button>
    </form>
  );
};

export default RoundCreationForm;
