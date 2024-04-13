import React, { useState } from "react";
import contractAbi from "../../abi/Funding.json";
import { useAccount } from "wagmi";
import { submit } from "~~/utils/quadratic/submit";

type Address = {
  id: number;
  value: string;
};

const RoundCreationForm: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [id, setId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>([{ id: Date.now(), value: "" }]);

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

  const handleAddAddress = () => {
    setAddresses([...addresses, { id: Date.now(), value: "" }]);
  };

  const handleRemoveAddress = (id: number) => {
    setAddresses(addresses.filter(address => address.id !== id));
  };

  const handleAddressChange = (id: number, newValue: string) => {
    const updatedAddresses = addresses.map(address => (address.id === id ? { ...address, value: newValue } : address));
    setAddresses(updatedAddresses);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="roundTitle">Round title:</label>
        <input type="text" id="roundTitle" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="id">ID:</label>
        <input type="text" id="id" value={id} onChange={e => setId(e.target.value)} />
      </div>
      <div>
        <label htmlFor="description">Description:</label>
        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label>Addresses:</label>
        {addresses.map(address => (
          <div key={address.id}>
            <input type="text" value={address.value} onChange={e => handleAddressChange(address.id, e.target.value)} />
            {addresses.length > 1 && (
              <button type="button" onClick={() => handleRemoveAddress(address.id)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddAddress}>
          Add Address
        </button>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default RoundCreationForm;
