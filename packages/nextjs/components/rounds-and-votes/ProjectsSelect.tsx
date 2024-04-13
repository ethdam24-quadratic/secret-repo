import { Dispatch, SetStateAction } from "react";
import React from "react";
import { Project } from "./IProject";
import Select, { MultiValue, StylesConfig } from "react-select";

interface ProjectSelectProps {
  projects: Project[];
  setChoosenProjects: Dispatch<SetStateAction<Project[]>>;
}

const formatOptionLabel = ({ name }: Project) => {
  return <div className="body-text">{name}</div>;
};

const getOptionValue = (option: Project) => option.id;

function ProjectsSelect({ projects, setChoosenProjects }: ProjectSelectProps): JSX.Element {
  const handleChange = (newValue: MultiValue<Project>) => {
    setChoosenProjects(newValue.map(item => item)); // Convert the readonly MultiValue array to a regular array if needed
  };
  return (
    <Select
      isMulti
      options={projects}
      formatOptionLabel={formatOptionLabel}
      getOptionValue={getOptionValue}
      onChange={handleChange}
      styles={customStyles}
    />
  );
}

export default ProjectsSelect;

const customStyles: StylesConfig<Project, true> = {
  control: baseStyles => {
    return {
      ...baseStyles,
      height: "48px",
      borderRadius: "0px",
      // borderColor: state.isFocused ? "grey" : "red",
      outline: "none",
      borderColor: "var(--fallback-bc,oklch(var(--bc)/0.2))",
      backgroundColor: "rgba(255, 255, 255, 0.12);",
      fontFamily: `"Sen", sans-serif !important`,
      letterSpacing: "1.5px",
    };
  },
  multiValue: base => {
    return { ...base };
  },
};
