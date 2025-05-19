import crypto from 'crypto';

/**
 * Transaction types within the motor insurance blockchain
 */
export enum TransactionType {
  POLICY = 'policy',   // New policy creation or update
  CLAIM = 'claim',     // Insurance claim submission
  EVIDENCE = 'evidence', // Evidence submission for a claim
  SETTLEMENT = 'settlement', // Claim settlement
  GENESIS = 'genesis'  // Genesis block initial transaction
}

/**
 * Base transaction interface
 */
export interface Transaction {
  type: TransactionType;
  timestamp: Date;
  hash?: string;
}

/**
 * Policy transaction - represents a new insurance policy
 */
export interface PolicyTransaction extends Transaction {
  type: TransactionType.POLICY;
  policyId: string;
  vehicleId: string;
  vehicleDetails: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  owner: string;
  coverageType: string;
  premium: number;
  startDate: Date;
  endDate: Date;
  status: string;
}

/**
 * Claim transaction - represents an insurance claim
 */
export interface ClaimTransaction extends Transaction {
  type: TransactionType.CLAIM;
  claimId: string;
  policyId: string;
  vehicleId: string;
  dateOfIncident: Date;
  description: string;
  damageAmount: number;
  status: string;
}

/**
 * Evidence transaction - links evidence to a claim
 */
export interface EvidenceTransaction extends Transaction {
  type: TransactionType.EVIDENCE;
  claimId: string;
  evidenceType: string;  // e.g., 'photo', 'police_report', 'repair_estimate'
  contentHash?: string;  // Hash of the evidence content (if applicable)
  metadata: any;         // Any additional metadata for the evidence
  verified?: boolean;    // Whether this evidence has been verified
  verifiedBy?: string;   // Who verified the evidence (e.g., 'RTSA')
}

/**
 * Settlement transaction - represents claim settlement
 */
export interface SettlementTransaction extends Transaction {
  type: TransactionType.SETTLEMENT;
  settlementId: string;
  claimId: string;
  policyId: string;
  amountApproved: number;
  settlementDate: Date;
  paymentMethod: string;
  recipientAccount?: string;
  status: string;
}

/**
 * Genesis transaction - first transaction in the blockchain
 */
export interface GenesisTransaction extends Transaction {
  type: TransactionType.GENESIS;
  description: string;
}

/**
 * Transaction Factory to create and hash transactions
 */
export class TransactionFactory {
  /**
   * Create a policy transaction
   */
  static createPolicyTransaction(policyData: Omit<PolicyTransaction, 'type' | 'timestamp' | 'hash'>): PolicyTransaction {
    const transaction: PolicyTransaction = {
      type: TransactionType.POLICY,
      timestamp: new Date(),
      ...policyData
    };
    
    transaction.hash = this.hashTransaction(transaction);
    return transaction;
  }
  
  /**
   * Create a claim transaction
   */
  static createClaimTransaction(claimData: Omit<ClaimTransaction, 'type' | 'timestamp' | 'hash'>): ClaimTransaction {
    const transaction: ClaimTransaction = {
      type: TransactionType.CLAIM,
      timestamp: new Date(),
      ...claimData
    };
    
    transaction.hash = this.hashTransaction(transaction);
    return transaction;
  }
  
  /**
   * Create an evidence transaction
   */
  static createEvidenceTransaction(evidenceData: Omit<EvidenceTransaction, 'type' | 'timestamp' | 'hash'>): EvidenceTransaction {
    const transaction: EvidenceTransaction = {
      type: TransactionType.EVIDENCE,
      timestamp: new Date(),
      ...evidenceData
    };
    
    transaction.hash = this.hashTransaction(transaction);
    return transaction;
  }
  
  /**
   * Create a settlement transaction
   */
  static createSettlementTransaction(settlementData: Omit<SettlementTransaction, 'type' | 'timestamp' | 'hash'>): SettlementTransaction {
    const transaction: SettlementTransaction = {
      type: TransactionType.SETTLEMENT,
      timestamp: new Date(),
      ...settlementData
    };
    
    transaction.hash = this.hashTransaction(transaction);
    return transaction;
  }
  
  /**
   * Create a genesis transaction
   */
  static createGenesisTransaction(description: string): GenesisTransaction {
    const transaction: GenesisTransaction = {
      type: TransactionType.GENESIS,
      timestamp: new Date(),
      description
    };
    
    transaction.hash = this.hashTransaction(transaction);
    return transaction;
  }
  
  /**
   * Generate a cryptographic hash of a transaction
   * This ensures transaction integrity
   */
  private static hashTransaction(transaction: Transaction): string {
    const transactionCopy = { ...transaction };
    delete transactionCopy.hash;
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(transactionCopy))
      .digest('hex');
  }
}
