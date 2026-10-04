const { ethers } = require('ethers');
require('dotenv').config();

// 1. Connect to the local Ethereum network (Hardhat)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// 2. Create a Wallet (Signer) to sign transactions
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 3. The ABI (Application Binary Interface)
const contractABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_certId", "type": "string" },
      { "internalType": "string", "name": "_recipientName", "type": "string" },
      { "internalType": "string", "name": "_courseName", "type": "string" },
      { "internalType": "uint256", "name": "_expirationDate", "type": "uint256" },
      { "internalType": "string", "name": "_pdfHash", "type": "string" }
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "string", "name": "_certId", "type": "string" } ],
    "name": "revokeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "string", "name": "_certId", "type": "string" } ],
    "name": "verifyCertificate",
    "outputs": [
      { "internalType": "string", "name": "recipientName", "type": "string" },
      { "internalType": "string", "name": "courseName", "type": "string" },
      { "internalType": "uint256", "name": "issueDate", "type": "uint256" },
      { "internalType": "uint256", "name": "expirationDate", "type": "uint256" },
      { "internalType": "uint8", "name": "currentStatus", "type": "uint8" },
      { "internalType": "address", "name": "issuedBy", "type": "address" },
      { "internalType": "string", "name": "pdfHash", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// 4. Connect to the specific contract using the Wallet (Signer)
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

module.exports = { contract };