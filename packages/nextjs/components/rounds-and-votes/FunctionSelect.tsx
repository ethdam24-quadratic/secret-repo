import { Dispatch, SetStateAction, useState } from "react";
import Select, { StylesConfig } from "react-select";

const options = [
  { value: "x", label: "x" }, // linear, classical voting
  { value: "x^2", label: "x^2" }, // integer_square_root(value)
  { value: "x^3", label: "x^3" }, // integer_cube_root(value)
  { value: "x^4", label: "x^4" }, // integer_fourth_root(value)
  { value: "exp", label: "exp" },
];

interface CurveOption {
  value: string;
  label: string;
}

interface FunctionSelectProps {
  setCurve: Dispatch<SetStateAction<string>>;
}

const customStyles: StylesConfig<CurveOption, true> = {
  control: baseStyles => {
    return {
      ...baseStyles,
      height: "48px",
      borderRadius: "0px",
      outline: "none",
      borderColor: "var(--fallback-bc,oklch(var(--bc)/0.2))",
      backgroundColor: "rgba(255, 255, 255, 0.12);",
      fontFamily: `"Sen", sans-serif !important`,
      letterSpacing: "1.5px",
      // color: "white",
    };
  },
  singleValue: styles => ({
    ...styles,
    color: "white",
  }),
};

function FunctionSelect({ setCurve }: FunctionSelectProps): JSX.Element {
  const [selectedOption, setSelectedOption] = useState();

  const handleChange = (option: any) => {
    setSelectedOption(option);
    setCurve(option);
  };

  return <Select options={options} value={selectedOption} onChange={handleChange} styles={customStyles} />;
}

export default FunctionSelect;
