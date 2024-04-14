// import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";
import fundingAbi from "../abi/Funding.json";

/**
 * @example
 * const externalContracts = {
 *   1: {
 *     DAI: {
 *       address: "0x...",
 *       abi: [...],
 *     },
 *   },
 * } as const;
 */
const externalContracts = {
  11155111: {
    Funding: {
      address: "0x0671bDfea4eBF0286395870418E81a628a098A42",
      abi: fundingAbi.abi,
    },
  },
} as const;

export default externalContracts;
