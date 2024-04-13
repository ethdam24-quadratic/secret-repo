import React, { useState } from "react";

type Address = {
  id: number;
  value: string;
};

const RoundCreationForm: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [id, setId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>([{ id: Date.now(), value: "" }]);

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log({ name, id, description, addresses });
    // Submit these values to your backend or handle them as needed
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
