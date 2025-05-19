import mongoose from 'mongoose';
import { log } from './vite';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blockinsure';

// Connect to MongoDB
export async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB successfully', 'mongodb');
    return true;
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Define User schema for authentication
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'user', 'insurance', 'rtsa', 'audit'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define Block schema for blockchain
const blockSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  previousHash: { type: String, required: true },
  hash: { type: String, required: true },
  nonce: { type: Number, required: true },
  merkleRoot: { type: String }
});

// Define Transaction schema
const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  hash: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  data: { type: mongoose.Schema.Types.Mixed, required: true }
});

// Define Policy schema
const policySchema = new mongoose.Schema({
  policyId: { type: String, required: true, unique: true },
  vehicleId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  coverageType: { type: String, required: true },
  coverageAmount: { type: Number, required: true },
  status: { type: String, required: true },
  ownerId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define Claim schema
const claimSchema = new mongoose.Schema({
  claimId: { type: String, required: true, unique: true },
  policyId: { type: String, required: true },
  incident: {
    date: { type: Date, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true }
  },
  claimAmount: { type: Number, required: true },
  status: { type: String, required: true },
  blockIndex: { type: Number },
  transactionHash: { type: String },
  documents: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define Vehicle schema
const vehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  registrationNumber: { type: String, required: true },
  ownerId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define node schema
const nodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  address: { type: String, required: true },
  lastActive: { type: Date, default: Date.now }
});

// Create models
export const User = mongoose.model('User', userSchema);
export const Block = mongoose.model('Block', blockSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const Policy = mongoose.model('Policy', policySchema);
export const Claim = mongoose.model('Claim', claimSchema);
export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export const Node = mongoose.model('Node', nodeSchema);