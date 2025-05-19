import { Block } from './Block';
import { 
  Transaction, 
  TransactionType, 
  TransactionFactory, 
  ClaimTransaction, 
  PolicyTransaction,
  SettlementTransaction,
  EvidenceTransaction 
} from './Transaction';

/**
 * Blockchain class representing a chain of blocks
 * 
 * This is a simplified implementation for the POC of blockchain
 * in motor vehicle insurance claims processing
 */
export class Blockchain {
  chain: Block[];
  difficulty: number;
  pendingTransactions: Transaction[];
  
  /**
   * Create a new blockchain with a genesis block
   */
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2; // Difficulty for proof of work (number of leading zeros)
    this.pendingTransactions = [];
  }
  
  /**
   * Create the first block in the chain (genesis block)
   */
  createGenesisBlock(): Block {
    const genesisTransaction = TransactionFactory.createGenesisTransaction(
      "Initial block in the motor vehicle insurance blockchain"
    );
    
    return new Block(
      0, 
      new Date(), 
      {
        transactions: [genesisTransaction],
        merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000"
      }, 
      "0"
    );
  }
  
  /**
   * Get the latest block in the chain
   */
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }
  
  /**
   * Add a new transaction to pending transactions
   */
  addTransaction(transaction: Transaction): void {
    this.pendingTransactions.push(transaction);
  }
  
  /**
   * Create a new claim transaction and add it to pending transactions
   */
  createClaimTransaction(claimData: Omit<ClaimTransaction, 'type' | 'timestamp' | 'hash'>): string {
    const transaction = TransactionFactory.createClaimTransaction(claimData);
    this.addTransaction(transaction);
    return transaction.hash || '';
  }
  
  /**
   * Create a new policy transaction and add it to pending transactions
   */
  createPolicyTransaction(policyData: Omit<PolicyTransaction, 'type' | 'timestamp' | 'hash'>): string {
    const transaction = TransactionFactory.createPolicyTransaction(policyData);
    this.addTransaction(transaction);
    return transaction.hash || '';
  }
  
  /**
   * Create a new settlement transaction and add it to pending transactions
   */
  createSettlementTransaction(settlementData: Omit<SettlementTransaction, 'type' | 'timestamp' | 'hash'>): string {
    const transaction = TransactionFactory.createSettlementTransaction(settlementData);
    this.addTransaction(transaction);
    return transaction.hash || '';
  }
  
  /**
   * Create a new evidence transaction and add it to pending transactions
   */
  createEvidenceTransaction(evidenceData: Omit<EvidenceTransaction, 'type' | 'timestamp' | 'hash'>): string {
    const transaction = TransactionFactory.createEvidenceTransaction(evidenceData);
    this.addTransaction(transaction);
    return transaction.hash || '';
  }
  
  /**
   * Process pending transactions and add them to a new block
   * 
   * @returns The newly mined block
   */
  minePendingTransactions(): Block | undefined {
    // Check if there are any pending transactions
    if (this.pendingTransactions.length === 0) {
      console.log("No pending transactions to mine");
      return undefined;
    }
    
    console.log(`Mining block with ${this.pendingTransactions.length} transactions...`);
    
    // Create a new block with all pending transactions
    const block = new Block(
      this.chain.length,
      new Date(),
      { transactions: this.pendingTransactions },
      this.getLatestBlock().hash
    );
    
    // Mine the block (find a valid hash through proof of work)
    block.mineBlock(this.difficulty);
    
    // Add the block to the chain
    this.chain.push(block);
    
    // Clear the pending transactions
    this.pendingTransactions = [];
    
    return block;
  }
  
  /**
   * Verify the integrity of the blockchain
   * 
   * @returns true if the chain is valid, false otherwise
   */
  isChainValid(): boolean {
    // Start from the second block (index 1) since we can't verify the genesis block
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Check if the current block's hash is valid
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.log('Block hash invalid:', currentBlock);
        return false;
      }
      
      // Check if this block points to the correct previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log('Previous hash invalid:', currentBlock);
        return false;
      }
    }
    
    // If we've gone through all blocks without issues, the chain is valid
    return true;
  }
  
  /**
   * Get the block at a specific index
   */
  getBlockByIndex(index: number): Block | undefined {
    if (index < 0 || index >= this.chain.length) {
      return undefined;
    }
    return this.chain[index];
  }
  
  /**
   * Get a block by its hash
   */
  getBlockByHash(hash: string): Block | undefined {
    return this.chain.find(block => block.hash === hash);
  }
  
  /**
   * Get all blocks
   */
  getAllBlocks(): Block[] {
    return this.chain;
  }
  
  /**
   * Get transactions by type
   */
  getTransactionsByType(type: TransactionType): Transaction[] {
    const transactions: Transaction[] = [];
    
    // Go through all blocks and collect transactions of the specified type
    for (const block of this.chain) {
      if (block.data && block.data.transactions) {
        for (const tx of block.data.transactions) {
          if (tx.type === type) {
            transactions.push(tx);
          }
        }
      }
    }
    
    return transactions;
  }
  
  /**
   * Get all claim transactions
   */
  getClaimTransactions(): ClaimTransaction[] {
    return this.getTransactionsByType(TransactionType.CLAIM) as ClaimTransaction[];
  }
  
  /**
   * Get all policy transactions
   */
  getPolicyTransactions(): PolicyTransaction[] {
    return this.getTransactionsByType(TransactionType.POLICY) as PolicyTransaction[];
  }
  
  /**
   * Get all settlement transactions
   */
  getSettlementTransactions(): SettlementTransaction[] {
    return this.getTransactionsByType(TransactionType.SETTLEMENT) as SettlementTransaction[];
  }
  
  /**
   * Find transactions related to a specific claim
   */
  getTransactionsForClaim(claimId: string): Transaction[] {
    const relatedTransactions: Transaction[] = [];
    
    // Go through all blocks and collect transactions related to the claim
    for (const block of this.chain) {
      if (block.data && block.data.transactions) {
        for (const tx of block.data.transactions) {
          if (
            (tx.type === TransactionType.CLAIM && (tx as ClaimTransaction).claimId === claimId) ||
            (tx.type === TransactionType.EVIDENCE && (tx as EvidenceTransaction).claimId === claimId) ||
            (tx.type === TransactionType.SETTLEMENT && (tx as SettlementTransaction).claimId === claimId)
          ) {
            relatedTransactions.push(tx);
          }
        }
      }
    }
    
    return relatedTransactions;
  }
}

// For POC, create a singleton blockchain instance
export const blockchain = new Blockchain();

// Initialize blockchain with some initial blocks to simulate existing data
// This would normally happen through actual mining over time
(() => {
  // Create some policy transactions
  blockchain.createPolicyTransaction({
    policyId: "POL-2023-0018",
    vehicleId: "ZM-LUS-1234",
    vehicleDetails: {
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      licensePlate: "ABC 123 ZM"
    },
    owner: "John Mulenga",
    coverageType: "comprehensive",
    premium: 2500,
    startDate: new Date("2023-05-03"),
    endDate: new Date("2024-05-02"),
    status: "active"
  });
  
  blockchain.createPolicyTransaction({
    policyId: "POL-2023-0019",
    vehicleId: "ZM-LUS-2234",
    vehicleDetails: {
      make: "Honda",
      model: "Civic",
      year: 2019,
      licensePlate: "DEF 456 ZM"
    },
    owner: "Mary Banda",
    coverageType: "third-party",
    premium: 1800,
    startDate: new Date("2023-05-03"),
    endDate: new Date("2024-05-02"),
    status: "active"
  });
  
  // Mine the block with policy transactions
  const policyBlock = blockchain.minePendingTransactions();
  
  // Create a claim transaction
  blockchain.createClaimTransaction({
    claimId: "CLM-2023-0042",
    policyId: "POL-2023-0018",
    vehicleId: "ZM-LUS-1234",
    dateOfIncident: new Date("2023-05-04"),
    description: "Vehicle collision at intersection",
    damageAmount: 4500,
    status: "approved"
  });
  
  // Add evidence for the claim
  blockchain.createEvidenceTransaction({
    claimId: "CLM-2023-0042",
    evidenceType: "police_report",
    metadata: {
      reportId: "RPT-2023-0142",
      submissionDate: new Date("2023-05-04"),
    },
    verified: true,
    verifiedBy: "RTSA"
  });
  
  // Mine the block with claim and evidence transactions
  const claimBlock = blockchain.minePendingTransactions();
  
  // Create a settlement transaction
  blockchain.createSettlementTransaction({
    settlementId: "STL-2023-0038",
    claimId: "CLM-2023-0042",
    policyId: "POL-2023-0018",
    amountApproved: 4500,
    settlementDate: new Date("2023-05-08"),
    paymentMethod: "bank_transfer",
    recipientAccount: "************4321",
    status: "completed"
  });
  
  // Mine the block with settlement transaction
  const settlementBlock = blockchain.minePendingTransactions();
  
  // Add more policy transactions
  blockchain.createPolicyTransaction({
    policyId: "POL-2023-0020",
    vehicleId: "ZM-LUS-3234",
    vehicleDetails: {
      make: "Mazda",
      model: "CX-5",
      year: 2022,
      licensePlate: "GHI 789 ZM"
    },
    owner: "Sarah Chomba",
    coverageType: "comprehensive",
    premium: 2800,
    startDate: new Date("2023-05-12"),
    endDate: new Date("2024-05-11"),
    status: "active"
  });
  
  blockchain.createPolicyTransaction({
    policyId: "POL-2023-0021",
    vehicleId: "ZM-LUS-4234",
    vehicleDetails: {
      make: "Ford",
      model: "Ranger",
      year: 2021,
      licensePlate: "JKL 012 ZM"
    },
    owner: "David Phiri",
    coverageType: "comprehensive",
    premium: 3200,
    startDate: new Date("2023-05-12"),
    endDate: new Date("2024-05-11"),
    status: "active"
  });
  
  // Mine the latest policy transactions
  const latestPolicyBlock = blockchain.minePendingTransactions();
  
  console.log("Blockchain initialized with sample data");
  console.log(`Chain length: ${blockchain.chain.length} blocks`);
  console.log(`Chain valid: ${blockchain.isChainValid()}`);
})();
