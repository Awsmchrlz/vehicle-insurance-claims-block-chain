import crypto from 'crypto';

/**
 * Represents a block in the blockchain
 * 
 * A block contains:
 * - index: The position of this block in the chain
 * - timestamp: When this block was created
 * - data: The data stored in this block (transactions)
 * - previousHash: The hash of the previous block
 * - hash: The hash of this block
 * - nonce: A value used in mining to find a hash that satisfies difficulty requirements
 */
export class Block {
  index: number;
  timestamp: Date;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot?: string;

  /**
   * Create a new block
   * 
   * @param index - The position in the blockchain
   * @param timestamp - When the block was created
   * @param data - The data contained in the block
   * @param previousHash - The hash of the previous block
   */
  constructor(index: number, timestamp: Date, data: any, previousHash: string = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    
    // Generate merkle root if data has transactions
    if (data && data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
      this.merkleRoot = this.calculateMerkleRoot(data.transactions);
    }
    
    this.hash = this.calculateHash();
  }

  /**
   * Calculate the hash of this block
   * The hash incorporates all properties of the block, making it tamper-resistant
   * 
   * @returns The SHA256 hash of the block
   */
  calculateHash(): string {
    // SHA256 hash of the block's content
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.timestamp.toISOString() +
        this.previousHash +
        JSON.stringify(this.data) +
        this.nonce +
        (this.merkleRoot || '')
      )
      .digest('hex');
  }

  /**
   * Calculate Merkle Root hash from list of transactions
   * This creates a tree structure of hashes to efficiently verify transactions
   * 
   * @param transactions - Array of transactions to hash
   * @returns Merkle root hash
   */
  calculateMerkleRoot(transactions: any[]): string {
    // For POC, using a simplified Merkle root calculation
    const txHashes = transactions.map(tx => 
      crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex')
    );
    
    // If only one transaction, that's the merkle root
    if (txHashes.length === 1) {
      return '0x' + txHashes[0].substring(0, 32);
    }
    
    // For POC, just hash all transaction hashes together
    return '0x' + crypto
      .createHash('sha256')
      .update(txHashes.join(''))
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Mine the block with Proof of Work
   * Find a hash that starts with a certain number of zeros (difficulty)
   * 
   * @param difficulty - Number of zeros the hash should start with
   */
  mineBlock(difficulty: number): void {
    // Create a string with 'difficulty' number of zeros
    const target = Array(difficulty + 1).join('0');
    
    // Keep incrementing nonce until we find a hash starting with enough zeros
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    
    console.log(`Block mined: ${this.hash}`);
  }
}
