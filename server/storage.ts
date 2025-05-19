import { 
  users, type User, type InsertUser,
  nodes, type Node, type InsertNode,
  blocks, type Block, type InsertBlock,
  vehicles, type Vehicle, type InsertVehicle,
  policies, type Policy, type InsertPolicy,
  claims, type Claim, type InsertClaim 
} from "@shared/schema";

// Define the interface with CRUD methods required
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Node operations
  getNodes(): Promise<Node[]>;
  getNode(id: number): Promise<Node | undefined>;
  createNode(node: InsertNode): Promise<Node>;
  updateNodeStatus(id: number, status: string): Promise<Node | undefined>;
  
  // Block operations
  getBlocks(): Promise<Block[]>;
  getBlocksRange(start: number, limit: number): Promise<Block[]>;
  getBlock(id: number): Promise<Block | undefined>;
  getBlockByIndex(index: number): Promise<Block | undefined>;
  getBlockByHash(hash: string): Promise<Block | undefined>;
  getLatestBlock(): Promise<Block | undefined>;
  createBlock(block: InsertBlock): Promise<Block>;
  
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByVehicleId(vehicleId: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  
  // Policy operations
  getPolicies(): Promise<Policy[]>;
  getPolicy(id: number): Promise<Policy | undefined>;
  getPolicyByPolicyId(policyId: string): Promise<Policy | undefined>;
  getPoliciesByVehicleId(vehicleId: string): Promise<Policy[]>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  
  // Claim operations
  getClaims(): Promise<Claim[]>;
  getClaimsWithLimit(limit: number): Promise<Claim[]>;
  getClaim(id: number): Promise<Claim | undefined>;
  getClaimByClaimId(claimId: string): Promise<Claim | undefined>;
  getClaimsByPolicyId(policyId: string): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaimStatus(claimId: string, status: string): Promise<Claim | undefined>;
  updateClaimBlockInfo(claimId: string, blockIndex: number, transactionHash: string): Promise<Claim | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private nodes: Map<number, Node>;
  private blocks: Map<number, Block>;
  private vehicles: Map<number, Vehicle>;
  private policies: Map<number, Policy>;
  private claims: Map<number, Claim>;
  
  private userId: number;
  private nodeId: number;
  private blockId: number;
  private vehicleId: number;
  private policyId: number;
  private claimId: number;
  
  constructor() {
    this.users = new Map();
    this.nodes = new Map();
    this.blocks = new Map();
    this.vehicles = new Map();
    this.policies = new Map();
    this.claims = new Map();
    
    this.userId = 1;
    this.nodeId = 1;
    this.blockId = 1;
    this.vehicleId = 1;
    this.policyId = 1;
    this.claimId = 1;
    
    // Initialize with sample data for POC
    this.initSampleData();
  }
  
  private initSampleData() {
    // Create nodes
    const nodeTypes = ['primary', 'insurance', 'insurance', 'rtsa', 'audit'];
    const nodeNames = ['Primary Node', 'Insurance Node 1', 'Insurance Node 2', 'RTSA Node', 'Audit Node'];
    const nodeStatuses = ['active', 'active', 'active', 'syncing', 'active'];
    
    for (let i = 0; i < nodeTypes.length; i++) {
      this.createNode({
        name: nodeNames[i],
        address: `node${i + 1}.blockinsure.network`,
        type: nodeTypes[i],
        status: nodeStatuses[i]
      });
    }
    
    // Create sample vehicles
    const vehicleMakes = ['Toyota', 'Honda', 'Mazda', 'Ford'];
    const vehicleModels = ['Corolla', 'Civic', 'CX-5', 'Ranger'];
    const owners = ['John Mulenga', 'Mary Banda', 'Sarah Chomba', 'David Phiri'];
    
    for (let i = 0; i < vehicleMakes.length; i++) {
      this.createVehicle({
        vehicleId: `ZM-LUS-${1234 + i * 1000}`,
        make: vehicleMakes[i],
        model: vehicleModels[i],
        year: 2020 + i % 3,
        licensePlate: `${String.fromCharCode(65 + i * 3)}${String.fromCharCode(66 + i * 3)}${String.fromCharCode(67 + i * 3)} ${123 + i * 111} ZM`,
        owner: owners[i]
      });
    }
    
    // Create sample policies
    const coverageTypes = ['comprehensive', 'third-party', 'comprehensive', 'comprehensive'];
    const premiums = [2500, 1800, 2800, 3200];
    const today = new Date();
    
    for (let i = 0; i < vehicleMakes.length; i++) {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30)); // Random start in the last month
      
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // 1-year policy
      
      this.createPolicy({
        policyId: `POL-2023-00${18 + i}`,
        vehicleId: `ZM-LUS-${1234 + i * 1000}`,
        coverageType: coverageTypes[i],
        premium: premiums[i],
        startDate: startDate,
        endDate: endDate,
        status: 'active',
        createdAt: startDate
      });
    }
    
    // Create sample claims
    const claimStatuses = ['approved', 'processing', 'pending_evidence', 'investigation'];
    const incidentTypes = ['collision', 'theft', 'vandalism', 'collision'];
    const damages = [4500, 2800, 3500, 5200];
    const descriptions = [
      'Vehicle collision at intersection of Great East Road and Church Road. Front bumper and headlight damage.',
      'Vehicle stolen from Cairo Road shopping area.',
      'Vehicle vandalized in parking lot, multiple scratches and broken window.',
      'Collision with another vehicle at roundabout, significant damage to side panels.'
    ];
    
    for (let i = 0; i < 4; i++) {
      const incidentDate = new Date();
      incidentDate.setDate(incidentDate.getDate() - (i * 3 + 2)); // Incidents spread over last few days
      
      const createdAt = new Date(incidentDate);
      createdAt.setHours(createdAt.getHours() + 1); // Claim created 1 hour after incident
      
      this.createClaim({
        claimId: `CLM-2023-00${42 - i * 3}`,
        policyId: `POL-2023-00${18 + i}`,
        vehicleId: `ZM-LUS-${1234 + i * 1000}`,
        incidentDate: incidentDate,
        incidentType: incidentTypes[i],
        description: descriptions[i],
        damageEstimate: damages[i],
        status: claimStatuses[i],
        createdAt: createdAt,
        evidence: i === 0 ? {
          files: [
            { 
              type: 'image', 
              name: 'damage_photo.jpg', 
              uploaded: '2023-05-04T09:15:00Z',
              verified: true 
            },
            { 
              type: 'document', 
              name: 'police_report.pdf', 
              uploaded: '2023-05-04T10:30:00Z', 
              reportId: 'RPT-2023-0142',
              verified: true,
              verifiedBy: 'RTSA'
            }
          ]
        } : undefined
      });
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Node methods
  async getNodes(): Promise<Node[]> {
    return Array.from(this.nodes.values());
  }
  
  async getNode(id: number): Promise<Node | undefined> {
    return this.nodes.get(id);
  }
  
  async createNode(node: InsertNode): Promise<Node> {
    const id = this.nodeId++;
    const newNode: Node = { 
      ...node, 
      id, 
      lastSeen: node.status === 'active' ? new Date() : undefined 
    };
    this.nodes.set(id, newNode);
    return newNode;
  }
  
  async updateNodeStatus(id: number, status: string): Promise<Node | undefined> {
    const node = this.nodes.get(id);
    if (!node) return undefined;
    
    const updatedNode: Node = { 
      ...node, 
      status, 
      lastSeen: status === 'active' ? new Date() : node.lastSeen 
    };
    this.nodes.set(id, updatedNode);
    return updatedNode;
  }
  
  // Block methods
  async getBlocks(): Promise<Block[]> {
    return Array.from(this.blocks.values()).sort((a, b) => a.index - b.index);
  }
  
  async getBlocksRange(start: number, limit: number): Promise<Block[]> {
    return Array.from(this.blocks.values())
      .sort((a, b) => a.index - b.index)
      .slice(start, start + limit);
  }
  
  async getBlock(id: number): Promise<Block | undefined> {
    return this.blocks.get(id);
  }
  
  async getBlockByIndex(index: number): Promise<Block | undefined> {
    return Array.from(this.blocks.values()).find(block => block.index === index);
  }
  
  async getBlockByHash(hash: string): Promise<Block | undefined> {
    return Array.from(this.blocks.values()).find(block => block.hash === hash);
  }
  
  async getLatestBlock(): Promise<Block | undefined> {
    const blocks = Array.from(this.blocks.values());
    if (blocks.length === 0) return undefined;
    
    return blocks.reduce((prev, current) => {
      return (prev.index > current.index) ? prev : current;
    });
  }
  
  async createBlock(block: InsertBlock): Promise<Block> {
    const id = this.blockId++;
    const newBlock: Block = { ...block, id };
    this.blocks.set(id, newBlock);
    return newBlock;
  }
  
  // Vehicle methods
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }
  
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  
  async getVehicleByVehicleId(vehicleId: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(vehicle => vehicle.vehicleId === vehicleId);
  }
  
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleId++;
    const newVehicle: Vehicle = { ...vehicle, id };
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }
  
  // Policy methods
  async getPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values());
  }
  
  async getPolicy(id: number): Promise<Policy | undefined> {
    return this.policies.get(id);
  }
  
  async getPolicyByPolicyId(policyId: string): Promise<Policy | undefined> {
    return Array.from(this.policies.values()).find(policy => policy.policyId === policyId);
  }
  
  async getPoliciesByVehicleId(vehicleId: string): Promise<Policy[]> {
    return Array.from(this.policies.values()).filter(policy => policy.vehicleId === vehicleId);
  }
  
  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    const id = this.policyId++;
    const newPolicy: Policy = { ...policy, id };
    this.policies.set(id, newPolicy);
    return newPolicy;
  }
  
  // Claim methods
  async getClaims(): Promise<Claim[]> {
    return Array.from(this.claims.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async getClaimsWithLimit(limit: number): Promise<Claim[]> {
    return Array.from(this.claims.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async getClaim(id: number): Promise<Claim | undefined> {
    return this.claims.get(id);
  }
  
  async getClaimByClaimId(claimId: string): Promise<Claim | undefined> {
    return Array.from(this.claims.values()).find(claim => claim.claimId === claimId);
  }
  
  async getClaimsByPolicyId(policyId: string): Promise<Claim[]> {
    return Array.from(this.claims.values())
      .filter(claim => claim.policyId === policyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createClaim(claim: InsertClaim): Promise<Claim> {
    const id = this.claimId++;
    const newClaim: Claim = { 
      ...claim, 
      id,
      blockIndex: undefined,
      transactionHash: undefined
    };
    this.claims.set(id, newClaim);
    return newClaim;
  }
  
  async updateClaimStatus(claimId: string, status: string): Promise<Claim | undefined> {
    const claim = Array.from(this.claims.values()).find(claim => claim.claimId === claimId);
    if (!claim) return undefined;
    
    const updatedClaim: Claim = { ...claim, status };
    this.claims.set(claim.id, updatedClaim);
    return updatedClaim;
  }
  
  async updateClaimBlockInfo(claimId: string, blockIndex: number, transactionHash: string): Promise<Claim | undefined> {
    const claim = Array.from(this.claims.values()).find(claim => claim.claimId === claimId);
    if (!claim) return undefined;
    
    const updatedClaim: Claim = { 
      ...claim, 
      blockIndex,
      transactionHash
    };
    this.claims.set(claim.id, updatedClaim);
    return updatedClaim;
  }
}

export const storage = new MemStorage();
