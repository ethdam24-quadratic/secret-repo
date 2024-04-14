<div align="center">
  <h1 align="center">🤫 Whisper</h1>
  <h3>Private Cross-chain Quadratic Funding</h3>
  
![banner (7)](https://github.com/ethdam24-quadratic/secret-repo/assets/101796507/524f48ae-bd05-4d8b-b7dc-4f57492dea89)
</div>

Whisper redefines the traditional quadratic funding model to enhance flexibility, privacy, and cross-chain functionality. Our platform seamlessly facilitates funding across various EVM-compatible chains, while utilizing the Secret Network to encrypt contribution data, ensuring that all votes remain confidential. This integration not only protects user privacy but also enhances security for all parties involved. Unlike traditional models that are strictly quadratic, our platform provides the unique ability to customize the funding curve. Project creators can choose from a variety of curve types to best suit their fundraising needs.<br><br>

**Check out our slides - [here](https://github.com/ethdam24-quadratic/secret-repo/blob/main/SLIDES.md) <br><br>**
**Check out our demo - [here](https://www.loom.com/share/59ef7949efe5431b828c902909b497e0) <br><br>**


⚙️ Built using Secret Network, dRPC, NextJS and Hardhat.

⛓️ **Cross-chain funding**: Participate in funding rounds from any EVM-compatible blockchain.

🔏 **Private Contributions**: All votes are encrypted using Secret Network’s cutting-edge technology, ensuring privacy protection.

📈 **Customizable Funding Curves**: Choose from quadratic or alternative curve structures to optimize your project’s funding potential.<br><br>

![tech stack (5)](https://github.com/ethdam24-quadratic/secret-repo/assets/101796507/6e54f7f1-529b-4b61-b32c-be16a16d0632)

## Hackathon bounties

### ETHDam - Privacy Track

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

### Smart contract deployments

[Sepolia](https://sepolia.etherscan.io/tx/0x2137cc78e533552d5345655f5db77efe35629af56b1881c6de1185a8c0effc2e)

[Aurora testnet](https://explorer.testnet.aurora.dev/address/0x737BE332C0c3e72e2738842a2138051dc0c01A0A)

[Scroll Sepolia](https://sepolia.scrollscan.dev/address/0x4CCce31adBEB0703941C25AA3146E105FE054440)

[Optimism Sepolia](https://sepolia-optimism.etherscan.io/address/0x84449Ff21EE6a5D161fA979F06B49327EFce0854)

[Base Sepolia](https://sepolia.basescan.org/address/0xc314278217Ae8D99D95BdAb3432e174A1a483Ed1)

## Team

This project was build during EthDam 24 by:

[alex](https://twitter.com/Secret_Saturn_) | [jensei](https://x.com/jensei_) | [tatiana](https://x.com/ilge_ustun/) | [arjanjohan](https://x.com/arjanjohan/)
