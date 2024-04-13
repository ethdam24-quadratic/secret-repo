<div align="center">
  <h1 align="center">🤫 Whisper</h1>
  <h3>Private Cross-chain Quadratic Funding</h3>
  
![banner (6)](https://github.com/ethdam24-quadratic/secret-repo/assets/101796507/96b666bd-ef34-4562-a6ec-ddae0e325ccb)
</div>

Whisper redefines the traditional quadratic funding model to enhance flexibility, privacy, and cross-chain functionality. Our platform seamlessly facilitates funding across various EVM-compatible chains, while utilizing the Secret Network to encrypt contribution data, ensuring that all donations remain confidential. This integration not only protects user privacy but also enhances security for all parties involved. Unlike traditional models that are strictly quadratic, our platform provides the unique ability to customize the funding curve. Project creators can now choose from a variety of curve types to best suit their fundraising needs.<br><br>

⚙️ Built using Secret Network, dRPC, NextJS and Hardhat.

⛓️ **Cross-chain funding**: Participate in funding rounds from any EVM-compatible blockchain.

🔏 **Private Contributions**: All contributions are encrypted using Secret Network’s cutting-edge technology, ensuring total privacy.

📈 **Customizable Funding Curves**: Choose from quadratic or alternative curve structures to optimize your project’s funding potential.

## Hackathon bounties

### NEAR

Deployed our smart contract on Aurora testnet, see [here](https://explorer.testnet.aurora.dev/address/0x072117443CEb3920d9D95d2F005b23FeC9E761aD).

### dRPC

Deployed using dRPC, see [here](https://github.com/ethdam24-quadratic/secret-repo/blob/4300b8cc0d541eb2f804f10b690959a6def031e6/packages/hardhat/hardhat.config.ts#L54).

### Trail of Bits - Slither

We used Slither to find issues and vunerabilities in our smart contracts. We found over 160 results and resolved most of them. Some simple issues like dead code were easy to fix, and some issues with possibile reentrancy attacks that we solved thanks to this tool. As of writing, there are 22 results left that we can't solve due to the hackathon time constraints. We did learn that this tool is very valuable and will use it in our next projects for sure. See the Slither output [here](https://github.com/ethdam24-quadratic/secret-repo/blob/8a836b64df14884b867c4bb847eb89416977d735/packages/hardhat/slither_output.txt). This file is generated using this command:

`slither . > output.txt 2>&1`

## Links

[Video demo](todo)

[Presentation slides](https://github.com/ethdam24-quadratic/secret-repo/blob/main/SLIDES.md)

[Vercel deployment](https://secret-repo-nextjs.vercel.app/)

[Smart contract on Sepolia](https://sepolia.etherscan.io/address/0x5D1Fc9da0af509d69a17b6Aa150886dB6597B347#code)

[Smart contract on Aurora testnet](https://explorer.testnet.aurora.dev/address/0x072117443CEb3920d9D95d2F005b23FeC9E761aD)

## Team

This project was build during EthDam 24 by:

[alex](https://twitter.com/Secret_Saturn_) | [jensei](https://x.com/jensei_) | [tatiana](https://x.com/ilge_ustun/) | [arjanjohan](https://x.com/arjanjohan/)
