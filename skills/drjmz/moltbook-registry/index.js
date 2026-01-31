const { ethers } = require("ethers");

// ============ CONFIG ============
const REGISTRY_ADDRESS = "0x0A21d1864Ced6A8DFBd3b862822D866e6250A8a0"; // V2
const RPC_URL = process.env.BASE_RPC || "https://mainnet.base.org";
const REGISTRATION_FEE = "0.0001"; // ETH

// ============ ABI ============
const ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function agents(uint256 tokenId) view returns (string endpoints, address wallet, bool isVerified)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function registerAgent(address to, string uri, string endpoints) payable returns (uint256)",
  "function logReputation(uint256 agentId, uint8 score) payable" // V2 Reputation
];

// ============ TOOL LOGIC ============
async function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

async function getWallet(provider) {
  const pk = process.env.WALLET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("Wallet private key not found in env (WALLET_PRIVATE_KEY)");
  return new ethers.Wallet(pk, provider);
}

/**
 * Check verification status
 */
async function status({ query }) {
  const provider = await getProvider();
  const contract = new ethers.Contract(REGISTRY_ADDRESS, ABI, provider);

  // If query is an ID
  if (!isNaN(query)) {
    try {
      const owner = await contract.ownerOf(query);
      return `✅ Agent #${query} is VERIFIED.\nOwner: ${owner}`;
    } catch {
      return `❌ Agent #${query} NOT FOUND.`;
    }
  }
  
  // If query is a Wallet Address (TODO: Add reverse lookup map in contract later)
  // For now, scan recent or say not supported efficiently
  return "🔍 Reverse lookup (Wallet -> ID) coming soon. Search by ID.";
}

/**
 * Lookup Agent Metadata
 */
async function lookup({ id }) {
  const provider = await getProvider();
  const contract = new ethers.Contract(REGISTRY_ADDRESS, ABI, provider);
  
  try {
    const [owner, profile, uri] = await Promise.all([
      contract.ownerOf(id),
      contract.agents(id),
      contract.tokenURI(id)
    ]);
    
    return JSON.stringify({
      id,
      owner,
      endpoints: profile.endpoints,
      wallet: profile.wallet,
      verified: profile.isVerified,
      uri
    }, null, 2);
  } catch (e) {
    return `❌ Error looking up Agent #${id}: ${e.message}`;
  }
}

/**
 * Register Agent (Requires Wallet)
 */
async function register({ endpoints, uri }) {
  const provider = await getProvider();
  const wallet = await getWallet(provider);
  const contract = new ethers.Contract(REGISTRY_ADDRESS, ABI, wallet);
  
  const myAddress = wallet.address;
  const metadataUri = uri || `https://moltbook.com/agent/${myAddress}`;
  const endpointsJson = typeof endpoints === 'string' ? endpoints : JSON.stringify(endpoints);

  console.log(`📝 Registering agent for ${myAddress}...`);
  
  try {
    // Send TX with Value (x402 Fee)
    const fee = ethers.parseEther(REGISTRATION_FEE);
    const tx = await contract.registerAgent(myAddress, metadataUri, endpointsJson, { value: fee });
    
    console.log(`🚀 TX Sent: ${tx.hash}`);
    const receipt = await tx.wait();
    
    return `✅ REGISTRATION SUCCESS!\nTransaction: ${tx.hash}\nBlock: ${receipt.blockNumber}\nWelcome to the Registry.`;
  } catch (e) {
    return `❌ Registration Failed: ${e.message}`;
  }
}

/**
 * Log Reputation (Requires Wallet)
 */
async function rate({ agentId, score }) {
  const provider = await getProvider();
  const wallet = await getWallet(provider);
  const contract = new ethers.Contract(REGISTRY_ADDRESS, ABI, wallet);

  try {
    const fee = ethers.parseEther(REGISTRATION_FEE); // Using same fee as registration for now
    const tx = await contract.logReputation(agentId, score, { value: fee });
    
    console.log(`🚀 TX Sent: ${tx.hash}`);
    const receipt = await tx.wait();

    return `✅ REPUTATION LOGGED!\nTransaction: ${tx.hash}\nBlock: ${receipt.blockNumber}\nScore: ${score}/100.`;
  } catch (e) {
    return `❌ Reputation Logging Failed: ${e.message}`;
  }
}

// ============ EXPORT ============
module.exports = {
  status,
  lookup,
  register,
  rate
};
