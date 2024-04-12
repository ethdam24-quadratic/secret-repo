import { SecretNetworkClient } from "secretjs";

const routing_contract = "secret1z9wdcmxdad2c07m6m8l5cwvrhmwrkexp64fck0";
const routing_code_hash =
  "6311a3f85261fc720d9a61e4ee46fae1c8a23440122b2ed1bbcebf49e3e46ad2";

let query = async () => {
  const key = "hello";
  const viewing_key = "test";

  const secretjs = new SecretNetworkClient({
    url: "https://lcd.testnet.secretsaturn.net",
    chainId: "pulsar-3",
  });

  const query_tx = await secretjs.query.compute.queryContract({
    contract_address: routing_contract,
    code_hash: routing_code_hash,
    query: { retrieve_value: { key: key, viewing_key: viewing_key } },
  });
  console.log(query_tx);
};

query();
