import { IStorage } from './storage';
import { 
  User as MongoUser, 
  Block as MongoBlock, 
  Policy as MongoPolicy, 
  Claim as MongoClaim, 
  Vehicle as MongoVehicle, 
  Node as MongoNode 
} from './mongodb';
import { 
  User, InsertUser,
  Node, InsertNode,
  Block, InsertBlock,
  Vehicle, InsertVehicle,
  Policy, InsertPolicy,
  Claim, InsertClaim 
} from '@shared/schema';

/**
 * MongoDB implementation of the storage interface
 */
export class MongoDBStorage implements IStorage {
  constructor() {}

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const user = await MongoUser.findOne({ _id: id.toString() });
    if (!user) return undefined;
    
    return {
      id: parseInt(user._id.toString()),
      username: user.username,
      password: user.password,
      email: user.email || '',
      role: user.role
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await MongoUser.findOne({ username });
    if (!user) return undefined;
    
    return {
      id: parseInt(user._id.toString()),
      username: user.username,
      password: user.password,
      email: user.email || '',
      role: user.role
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = await MongoUser.create({
      username: user.username,
      password: user.password,
      email: user.email || '',
      role: user.role || 'user'
    });
    
    return {
      id: parseInt(newUser._id.toString()),
      username: newUser.username,
      password: newUser.password,
      email: newUser.email || '',
      role: newUser.role
    };
  }

  // Node operations
  async getNodes(): Promise<Node[]> {
    const nodes = await MongoNode.find();
    return nodes.map(node => ({
      id: parseInt(node._id.toString()),
      nodeId: node.nodeId,
      name: node.name,
      type: node.type,
      status: node.status,
      address: node.address,
      lastActive: node.lastActive
    }));
  }

  async getNode(id: number): Promise<Node | undefined> {
    const node = await MongoNode.findOne({ _id: id.toString() });
    if (!node) return undefined;
    
    return {
      id: parseInt(node._id.toString()),
      nodeId: node.nodeId,
      name: node.name,
      type: node.type,
      status: node.status,
      address: node.address,
      lastActive: node.lastActive
    };
  }

  async createNode(node: InsertNode): Promise<Node> {
    const newNode = await MongoNode.create({
      nodeId: node.nodeId,
      name: node.name,
      type: node.type,
      status: node.status,
      address: node.address,
      lastActive: new Date()
    });
    
    return {
      id: parseInt(newNode._id.toString()),
      nodeId: newNode.nodeId,
      name: newNode.name,
      type: newNode.type,
      status: newNode.status,
      address: newNode.address,
      lastActive: newNode.lastActive
    };
  }

  async updateNodeStatus(id: number, status: string): Promise<Node | undefined> {
    const node = await MongoNode.findOneAndUpdate(
      { _id: id.toString() },
      { status, lastActive: new Date() },
      { new: true }
    );
    
    if (!node) return undefined;
    
    return {
      id: parseInt(node._id.toString()),
      nodeId: node.nodeId,
      name: node.name,
      type: node.type,
      status: node.status,
      address: node.address,
      lastActive: node.lastActive
    };
  }

  // Block operations
  async getBlocks(): Promise<Block[]> {
    const blocks = await MongoBlock.find().sort({ index: 1 });
    return blocks.map(block => ({
      id: parseInt(block._id.toString()),
      index: block.index,
      timestamp: block.timestamp,
      data: JSON.stringify(block.data),
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot
    }));
  }

  async getBlocksRange(start: number, limit: number): Promise<Block[]> {
    const blocks = await MongoBlock.find()
      .sort({ index: 1 })
      .skip(start)
      .limit(limit);
    
    return blocks.map(block => ({
      id: parseInt(block._id.toString()),
      index: block.index,
      timestamp: block.timestamp,
      data: JSON.stringify(block.data),
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot
    }));
  }

  async getBlock(id: number): Promise<Block | undefined> {
    const block = await MongoBlock.findOne({ _id: id.toString() });
    if (!block) return undefined;
    
    return {
      id: parseInt(block._id.toString()),
      index: block.index,
      timestamp: block.timestamp,
      data: JSON.stringify(block.data),
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot
    };
  }

  async getBlockByIndex(index: number): Promise<Block | undefined> {
    const block = await MongoBlock.findOne({ index });
    if (!block) return undefined;
    
    return {
      id: parseInt(block._id.toString()),
      index: block.index,
      timestamp: block.timestamp,
      data: JSON.stringify(block.data),
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot
    };
  }

  async getBlockByHash(hash: string): Promise<Block | undefined> {
    const block = await MongoBlock.findOne({ hash });
    if (!block) return undefined;
    
    return {
      id: parseInt(block._id.toString()),
      index: block.index,
      timestamp: block.timestamp,
      data: JSON.stringify(block.data),
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot
    };
  }

  async getLatestBlock(): Promise<Block | undefined> {
    const block = await MongoBlock.findOne().sort({ index: -1 });
    if (!block) return undefined;
    
    return {
      id: parseInt(block._id.toString()),
      index: block.index,
      timestamp: block.timestamp,
      data: JSON.stringify(block.data),
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot
    };
  }

  async createBlock(block: InsertBlock): Promise<Block> {
    const newBlock = await MongoBlock.create({
      index: block.index,
      timestamp: block.timestamp || new Date(),
      data: JSON.parse(block.data),
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot
    });
    
    return {
      id: parseInt(newBlock._id.toString()),
      index: newBlock.index,
      timestamp: newBlock.timestamp,
      data: JSON.stringify(newBlock.data),
      previousHash: newBlock.previousHash,
      hash: newBlock.hash,
      nonce: newBlock.nonce,
      merkleRoot: newBlock.merkleRoot
    };
  }

  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    const vehicles = await MongoVehicle.find();
    return vehicles.map(vehicle => ({
      id: parseInt(vehicle._id.toString()),
      vehicleId: vehicle.vehicleId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registrationNumber: vehicle.registrationNumber,
      ownerId: vehicle.ownerId,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt
    }));
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const vehicle = await MongoVehicle.findOne({ _id: id.toString() });
    if (!vehicle) return undefined;
    
    return {
      id: parseInt(vehicle._id.toString()),
      vehicleId: vehicle.vehicleId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registrationNumber: vehicle.registrationNumber,
      ownerId: vehicle.ownerId,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt
    };
  }

  async getVehicleByVehicleId(vehicleId: string): Promise<Vehicle | undefined> {
    const vehicle = await MongoVehicle.findOne({ vehicleId });
    if (!vehicle) return undefined;
    
    return {
      id: parseInt(vehicle._id.toString()),
      vehicleId: vehicle.vehicleId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registrationNumber: vehicle.registrationNumber,
      ownerId: vehicle.ownerId,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt
    };
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const newVehicle = await MongoVehicle.create({
      vehicleId: vehicle.vehicleId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registrationNumber: vehicle.registrationNumber,
      ownerId: vehicle.ownerId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      id: parseInt(newVehicle._id.toString()),
      vehicleId: newVehicle.vehicleId,
      make: newVehicle.make,
      model: newVehicle.model,
      year: newVehicle.year,
      registrationNumber: newVehicle.registrationNumber,
      ownerId: newVehicle.ownerId,
      createdAt: newVehicle.createdAt,
      updatedAt: newVehicle.updatedAt
    };
  }

  // Policy operations
  async getPolicies(): Promise<Policy[]> {
    const policies = await MongoPolicy.find();
    return policies.map(policy => ({
      id: parseInt(policy._id.toString()),
      policyId: policy.policyId,
      vehicleId: policy.vehicleId,
      startDate: policy.startDate,
      endDate: policy.endDate,
      coverageType: policy.coverageType,
      coverageAmount: policy.coverageAmount,
      status: policy.status,
      ownerId: policy.ownerId,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt
    }));
  }

  async getPolicy(id: number): Promise<Policy | undefined> {
    const policy = await MongoPolicy.findOne({ _id: id.toString() });
    if (!policy) return undefined;
    
    return {
      id: parseInt(policy._id.toString()),
      policyId: policy.policyId,
      vehicleId: policy.vehicleId,
      startDate: policy.startDate,
      endDate: policy.endDate,
      coverageType: policy.coverageType,
      coverageAmount: policy.coverageAmount,
      status: policy.status,
      ownerId: policy.ownerId,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt
    };
  }

  async getPolicyByPolicyId(policyId: string): Promise<Policy | undefined> {
    const policy = await MongoPolicy.findOne({ policyId });
    if (!policy) return undefined;
    
    return {
      id: parseInt(policy._id.toString()),
      policyId: policy.policyId,
      vehicleId: policy.vehicleId,
      startDate: policy.startDate,
      endDate: policy.endDate,
      coverageType: policy.coverageType,
      coverageAmount: policy.coverageAmount,
      status: policy.status,
      ownerId: policy.ownerId,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt
    };
  }

  async getPoliciesByVehicleId(vehicleId: string): Promise<Policy[]> {
    const policies = await MongoPolicy.find({ vehicleId });
    return policies.map(policy => ({
      id: parseInt(policy._id.toString()),
      policyId: policy.policyId,
      vehicleId: policy.vehicleId,
      startDate: policy.startDate,
      endDate: policy.endDate,
      coverageType: policy.coverageType,
      coverageAmount: policy.coverageAmount,
      status: policy.status,
      ownerId: policy.ownerId,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt
    }));
  }

  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    const newPolicy = await MongoPolicy.create({
      policyId: policy.policyId,
      vehicleId: policy.vehicleId,
      startDate: policy.startDate,
      endDate: policy.endDate,
      coverageType: policy.coverageType,
      coverageAmount: policy.coverageAmount,
      status: policy.status,
      ownerId: policy.ownerId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      id: parseInt(newPolicy._id.toString()),
      policyId: newPolicy.policyId,
      vehicleId: newPolicy.vehicleId,
      startDate: newPolicy.startDate,
      endDate: newPolicy.endDate,
      coverageType: newPolicy.coverageType,
      coverageAmount: newPolicy.coverageAmount,
      status: newPolicy.status,
      ownerId: newPolicy.ownerId,
      createdAt: newPolicy.createdAt,
      updatedAt: newPolicy.updatedAt
    };
  }

  // Claim operations
  async getClaims(): Promise<Claim[]> {
    const claims = await MongoClaim.find();
    return claims.map(claim => ({
      id: parseInt(claim._id.toString()),
      claimId: claim.claimId,
      policyId: claim.policyId,
      incidentDate: claim.incident.date,
      incidentLocation: claim.incident.location,
      description: claim.incident.description,
      claimAmount: claim.claimAmount,
      status: claim.status,
      blockIndex: claim.blockIndex,
      transactionHash: claim.transactionHash,
      documents: claim.documents,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt
    }));
  }

  async getClaimsWithLimit(limit: number): Promise<Claim[]> {
    const claims = await MongoClaim.find().limit(limit).sort({ createdAt: -1 });
    return claims.map(claim => ({
      id: parseInt(claim._id.toString()),
      claimId: claim.claimId,
      policyId: claim.policyId,
      incidentDate: claim.incident.date,
      incidentLocation: claim.incident.location,
      description: claim.incident.description,
      claimAmount: claim.claimAmount,
      status: claim.status,
      blockIndex: claim.blockIndex,
      transactionHash: claim.transactionHash,
      documents: claim.documents,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt
    }));
  }

  async getClaim(id: number): Promise<Claim | undefined> {
    const claim = await MongoClaim.findOne({ _id: id.toString() });
    if (!claim) return undefined;
    
    return {
      id: parseInt(claim._id.toString()),
      claimId: claim.claimId,
      policyId: claim.policyId,
      incidentDate: claim.incident.date,
      incidentLocation: claim.incident.location,
      description: claim.incident.description,
      claimAmount: claim.claimAmount,
      status: claim.status,
      blockIndex: claim.blockIndex,
      transactionHash: claim.transactionHash,
      documents: claim.documents,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt
    };
  }

  async getClaimByClaimId(claimId: string): Promise<Claim | undefined> {
    const claim = await MongoClaim.findOne({ claimId });
    if (!claim) return undefined;
    
    return {
      id: parseInt(claim._id.toString()),
      claimId: claim.claimId,
      policyId: claim.policyId,
      incidentDate: claim.incident.date,
      incidentLocation: claim.incident.location,
      description: claim.incident.description,
      claimAmount: claim.claimAmount,
      status: claim.status,
      blockIndex: claim.blockIndex,
      transactionHash: claim.transactionHash,
      documents: claim.documents,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt
    };
  }

  async getClaimsByPolicyId(policyId: string): Promise<Claim[]> {
    const claims = await MongoClaim.find({ policyId });
    return claims.map(claim => ({
      id: parseInt(claim._id.toString()),
      claimId: claim.claimId,
      policyId: claim.policyId,
      incidentDate: claim.incident.date,
      incidentLocation: claim.incident.location,
      description: claim.incident.description,
      claimAmount: claim.claimAmount,
      status: claim.status,
      blockIndex: claim.blockIndex,
      transactionHash: claim.transactionHash,
      documents: claim.documents,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt
    }));
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const newClaim = await MongoClaim.create({
      claimId: claim.claimId,
      policyId: claim.policyId,
      incident: {
        date: claim.incidentDate,
        location: claim.incidentLocation,
        description: claim.description
      },
      claimAmount: claim.claimAmount,
      status: claim.status,
      blockIndex: claim.blockIndex,
      transactionHash: claim.transactionHash,
      documents: claim.documents || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      id: parseInt(newClaim._id.toString()),
      claimId: newClaim.claimId,
      policyId: newClaim.policyId,
      incidentDate: newClaim.incident.date,
      incidentLocation: newClaim.incident.location,
      description: newClaim.incident.description,
      claimAmount: newClaim.claimAmount,
      status: newClaim.status,
      blockIndex: newClaim.blockIndex,
      transactionHash: newClaim.transactionHash,
      documents: newClaim.documents,
      createdAt: newClaim.createdAt,
      updatedAt: newClaim.updatedAt
    };
  }

  async updateClaimStatus(claimId: string, status: string): Promise<Claim | undefined> {
    const claim = await MongoClaim.findOneAndUpdate(
      { claimId },
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!claim) return undefined;
    
    return {
      id: parseInt(claim._id.toString()),
      claimId: claim.claimId,
      policyId: claim.policyId,
      incidentDate: claim.incident.date,
      incidentLocation: claim.incident.location,
      description: claim.incident.description,
      claimAmount: claim.claimAmount,
      status: claim.status,
      blockIndex: claim.blockIndex,
      transactionHash: claim.transactionHash,
      documents: claim.documents,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt
    };
  }

  async updateClaimBlockInfo(claimId: string, blockIndex: number, transactionHash: string): Promise<Claim | undefined> {
    const claim = await MongoClaim.findOneAndUpdate(
      { claimId },
      { 
        blockIndex,
        transactionHash,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!claim) return undefined;
    
    return {
      id: parseInt(claim._id.toString()),
      claimId: claim.claimId,
      policyId: claim.policyId,
      incidentDate: claim.incident.date,
      incidentLocation: claim.incident.location,
      description: claim.incident.description,
      claimAmount: claim.claimAmount,
      status: claim.status,
      blockIndex: claim.blockIndex,
      transactionHash: claim.transactionHash,
      documents: claim.documents,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt
    };
  }
}