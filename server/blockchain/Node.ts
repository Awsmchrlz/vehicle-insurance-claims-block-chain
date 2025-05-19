import { Blockchain } from './Blockchain';
import { Block } from './Block';
import { Transaction } from './Transaction';
import crypto from 'crypto';

/**
 * Node types in the blockchain network
 */
export enum NodeType {
  PRIMARY = 'primary',       // Main coordinating node
  INSURANCE = 'insurance',   // Insurance company node
  RTSA = 'rtsa',             // Road Transport & Safety Agency node
  AUDIT = 'audit'            // Auditing/regulatory node
}

/**
 * Node status values
 */
export enum NodeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SYNCING = 'syncing'
}

/**
 * Interface for a blockchain network node
 * 
 * Each node maintains a copy of the blockchain and participates
 * in consensus to verify transactions and blocks
 */
export interface INode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  address: string;
  blockchain: Blockchain;
  connectedNodes: Map<string, INode>;
  
  // Node operations
  connect(node: INode): void;
  disconnect(nodeId: string): void;
  broadcastBlock(block: Block): void;
  broadcastTransaction(transaction: Transaction): void;
  receiveBlock(block: Block): boolean;
  receiveTransaction(transaction: Transaction): void;
  
  // Consensus participation
  validateBlock(block: Block): boolean;
  verifyTransaction(transaction: Transaction): boolean;
}

/**
 * Implementation of a blockchain network node
 */
export class Node implements INode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  address: string;
  blockchain: Blockchain;
  connectedNodes: Map<string, INode>;
  lastActive: Date;
  
  /**
   * Create a new blockchain node
   * 
   * @param name - Human-readable name for the node
   * @param type - The type of node (primary, insurance, rtsa, audit)
   * @param blockchain - Reference to the blockchain
   */
  constructor(name: string, type: NodeType, blockchain: Blockchain, address: string) {
    // Generate a unique ID for this node
    this.id = crypto.randomBytes(16).toString('hex');
    this.name = name;
    this.type = type;
    this.status = NodeStatus.ACTIVE;
    this.address = address;
    this.blockchain = blockchain;
    this.connectedNodes = new Map();
    this.lastActive = new Date();
  }
  
  /**
   * Connect this node to another node
   * 
   * @param node - The node to connect to
   */
  connect(node: INode): void {
    if (!this.connectedNodes.has(node.id) && node.id !== this.id) {
      this.connectedNodes.set(node.id, node);
      // Reciprocal connection
      node.connect(this);
      console.log(`Node ${this.name} connected to ${node.name}`);
    }
  }
  
  /**
   * Disconnect from a node
   * 
   * @param nodeId - ID of the node to disconnect from
   */
  disconnect(nodeId: string): void {
    if (this.connectedNodes.has(nodeId)) {
      const node = this.connectedNodes.get(nodeId);
      this.connectedNodes.delete(nodeId);
      // Reciprocal disconnection
      if (node) {
        node.disconnect(this.id);
      }
      console.log(`Node ${this.name} disconnected from node ${nodeId}`);
    }
  }
  
  /**
   * Broadcast a new block to all connected nodes
   * 
   * @param block - The block to broadcast
   */
  broadcastBlock(block: Block): void {
    this.connectedNodes.forEach(node => {
      node.receiveBlock(block);
    });
  }
  
  /**
   * Broadcast a transaction to all connected nodes
   * 
   * @param transaction - The transaction to broadcast
   */
  broadcastTransaction(transaction: Transaction): void {
    this.connectedNodes.forEach(node => {
      node.receiveTransaction(transaction);
    });
  }
  
  /**
   * Process a block received from another node
   * 
   * @param block - The block received
   * @returns true if the block was added to chain, false otherwise
   */
  receiveBlock(block: Block): boolean {
    // Validate the block
    if (!this.validateBlock(block)) {
      console.log(`Node ${this.name} rejected invalid block ${block.index}`);
      return false;
    }
    
    // If the block is already in our chain, ignore it
    const existingBlock = this.blockchain.getBlockByHash(block.hash);
    if (existingBlock) {
      return false;
    }
    
    // If we're missing previous blocks, we need to sync
    const prevBlock = this.blockchain.getBlockByHash(block.previousHash);
    if (!prevBlock && block.index > 0) {
      this.status = NodeStatus.SYNCING;
      console.log(`Node ${this.name} needs to sync the blockchain`);
      return false;
    }
    
    // If this is the next block in sequence, add it
    if (this.blockchain.getLatestBlock().index + 1 === block.index) {
      this.blockchain.chain.push(block);
      console.log(`Node ${this.name} added block ${block.index} to chain`);
      
      // If we were syncing, we're now active
      if (this.status === NodeStatus.SYNCING) {
        this.status = NodeStatus.ACTIVE;
      }
      
      this.lastActive = new Date();
      return true;
    }
    
    return false;
  }
  
  /**
   * Process a transaction received from another node
   * 
   * @param transaction - The transaction received
   */
  receiveTransaction(transaction: Transaction): void {
    // Verify the transaction
    if (!this.verifyTransaction(transaction)) {
      console.log(`Node ${this.name} rejected invalid transaction`);
      return;
    }
    
    // Check if this transaction is already in pending transactions
    const alreadyPending = this.blockchain.pendingTransactions.some(
      tx => tx.hash === transaction.hash
    );
    
    if (!alreadyPending) {
      this.blockchain.addTransaction(transaction);
      console.log(`Node ${this.name} added transaction to pending pool`);
      
      // Update last activity time
      this.lastActive = new Date();
    }
  }
  
  /**
   * Validate a block for consensus
   * 
   * @param block - The block to validate
   * @returns true if the block is valid, false otherwise
   */
  validateBlock(block: Block): boolean {
    // Check that the block's hash is correct
    if (block.hash !== block.calculateHash()) {
      return false;
    }
    
    // For blocks other than genesis, check previous hash links correctly
    if (block.index > 0) {
      const prevBlock = this.blockchain.getBlockByIndex(block.index - 1);
      if (!prevBlock || prevBlock.hash !== block.previousHash) {
        return false;
      }
    }
    
    // Check proof of work - the hash should start with the required number of zeros
    const difficulty = this.blockchain.difficulty;
    const target = Array(difficulty + 1).join('0');
    if (block.hash.substring(0, difficulty) !== target) {
      return false;
    }
    
    // Check that all transactions are valid
    if (block.data && block.data.transactions) {
      for (const transaction of block.data.transactions) {
        if (!this.verifyTransaction(transaction)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Verify a transaction is valid
   * 
   * @param transaction - The transaction to verify
   * @returns true if the transaction is valid, false otherwise
   */
  verifyTransaction(transaction: Transaction): boolean {
    // Basic verification that the transaction has required fields
    if (!transaction.type || !transaction.timestamp) {
      return false;
    }
    
    // Simulate different verification rules based on node type
    switch (this.type) {
      case NodeType.RTSA:
        // RTSA nodes might have special verification for vehicle data
        return true;
        
      case NodeType.AUDIT:
        // Audit nodes might have more strict verification requirements
        return true;
        
      case NodeType.INSURANCE:
      case NodeType.PRIMARY:
      default:
        // Basic verification for other node types
        return true;
    }
  }
  
  /**
   * Update the node's status
   * 
   * @param status - The new status
   */
  updateStatus(status: NodeStatus): void {
    this.status = status;
    if (status === NodeStatus.ACTIVE) {
      this.lastActive = new Date();
    }
  }
}

// For the POC, create a network of nodes
export const initializeNodeNetwork = (blockchain: Blockchain): Map<string, Node> => {
  const nodes = new Map<string, Node>();
  
  // Create primary node
  const primaryNode = new Node("Primary Node", NodeType.PRIMARY, blockchain, "node1.blockinsure.network");
  nodes.set(primaryNode.id, primaryNode);
  
  // Create insurance company nodes
  const insuranceNode1 = new Node("Insurance Node 1", NodeType.INSURANCE, blockchain, "node2.blockinsure.network");
  const insuranceNode2 = new Node("Insurance Node 2", NodeType.INSURANCE, blockchain, "node3.blockinsure.network");
  nodes.set(insuranceNode1.id, insuranceNode1);
  nodes.set(insuranceNode2.id, insuranceNode2);
  
  // Create RTSA node
  const rtsaNode = new Node("RTSA Node", NodeType.RTSA, blockchain, "node4.blockinsure.network");
  rtsaNode.updateStatus(NodeStatus.SYNCING); // Simulating a syncing node
  nodes.set(rtsaNode.id, rtsaNode);
  
  // Create audit node
  const auditNode = new Node("Audit Node", NodeType.AUDIT, blockchain, "node5.blockinsure.network");
  nodes.set(auditNode.id, auditNode);
  
  // Connect all nodes to the primary node
  insuranceNode1.connect(primaryNode);
  insuranceNode2.connect(primaryNode);
  rtsaNode.connect(primaryNode);
  auditNode.connect(primaryNode);
  
  // Connect insurance nodes to each other
  insuranceNode1.connect(insuranceNode2);
  
  return nodes;
};
