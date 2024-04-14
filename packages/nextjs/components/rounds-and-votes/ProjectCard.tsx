/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Project } from "./IProject";

interface ProjectCardProps {
  project: Project;
  handleInputChange: (id: string, newValue: number) => void;
}

function ProjectCard({ project, handleInputChange }: ProjectCardProps): JSX.Element {
  return (
    <div
      className="flex flex-row project-card my-12 flex-wrap justify-center"
      style={{
        maxWidth: "500px",
      }}
    >
      <figure className="flex items-center">
        <img
          src={project.imgSrc || ""}
          alt={project.name}
          style={{
            objectFit: "contain",
            maxWidth: "150px",
          }}
        />
      </figure>
      <div
        className="flex flex-col m-3"
        style={{
          maxWidth: "300px",
        }}
      >
        <h3>{project.name}</h3>
        <p className="flex-1">{project.description}</p>

        <div className="bg-black text-white py-0 flex items-center border-2 border-white q-shadow">
          <input
            type="number"
            id="votingPower"
            className="bg-transparent flex-grow outline-none placeholder-gray-600 placeholder-opacity-50 text-center"
            placeholder="VOTING POWER"
            value={project.value}
            onChange={e => handleInputChange(project.id, Number(e.target.value))}
          />
          <label htmlFor="votingPower" className="border-l-2 border-white px-6 py-2 ml-4">
            gwei
          </label>
        </div>
        {/* <span className="text-sm text-white pl-5">gwei</span> */}
      </div>
    </div>
  );
}

export default ProjectCard;
