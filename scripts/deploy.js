import hre from "hardhat";

async function main() {
  console.log("Deploying CertificateRegistry contract...");

  // Get the contract factory
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");

  // Deploy the contract
  const contract = await CertificateRegistry.deploy();
  await contract.waitForDeployment();

  console.log("✅ CertificateRegistry deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});