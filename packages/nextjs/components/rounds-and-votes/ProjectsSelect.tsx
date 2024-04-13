import { Dispatch, SetStateAction } from "react";
import React from "react";
import { Project } from "./IProject";
import Select, { MultiValue, StylesConfig } from "react-select";

interface ProjectSelectProps {
  projects: Project[];
  setChoosenProjects: Dispatch<SetStateAction<Project[]>>;
}

const formatOptionLabel = ({ name }: Project) => {
  return <div>{name}</div>;
};

const getOptionValue = (option: Project) => option.id;

function ProjectsSelect({ projects, setChoosenProjects }: ProjectSelectProps): JSX.Element {
  const handleChange = (newValue: MultiValue<Project>) => {
    // const handleChange = (newValue: MultiValue<Project>, actionMeta: ActionMeta<Project>) => {
    // console.log(actionMeta); // Optionally log the actionMeta to see what action triggered the change
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
      classNames={{
        control: state => (state.isFocused ? "border-red-600" : "border-grey-300"),
      }}
    />
  );
}

export default ProjectsSelect;

const customStyles: StylesConfig<Project, true> = {
  // control: (baseStyles, state) => {
  control: baseStyles => {
    return {
      ...baseStyles,
      height: "48px",
      borderRadius: "0px",
      // borderColor: state.isFocused ? "grey" : "red",
      outline: "none",
      borderColor: "var(--fallback-bc,oklch(var(--bc)/0.2))",
    };
  },
  multiValue: base => {
    return { ...base };
  },
};

// const customStyles: StylesConfig<Project, false> = {
//   control: provided => ({
//     ...provided,
//     height: "56px",
//     width: windowWidth > 520 ? "303px" : "auto",
//     border: "none",
//   }),
// };

// const customStyles: StylesConfig<Project, true> = {
//   control: provided => ({
//     ...provided,
//     // height: "56px",
//     borderRadius: "0px",
//     outlineWidth: state.isFocused ? "1px" : "",
//     outlineOffset: "1px",
//   }),
//   multiValue: base => {
//     return { ...base };
//   },
// };
