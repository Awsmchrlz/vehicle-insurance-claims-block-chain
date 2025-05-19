import { pgTable, text, serial, integer, boolean, jsonb, timestamp, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Nodes in the blockchain network
export const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(), // primary, insurance, audit, rtsa
  status: text("status").notNull(), // active, inactive, syncing
  lastSeen: timestamp("last_seen"),
});

export const insertNodeSchema = createInsertSchema(nodes).pick({
  name: true,
  address: true,
  type: true,
  status: true,
});

// Blocks in the blockchain
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  index: integer("index").notNull(), // The block number/height
  timestamp: timestamp("timestamp").notNull(),
  previousHash: text("previous_hash").notNull(),
  hash: text("hash").notNull().unique(),
  data: jsonb("data").notNull(), // JSON with transactions
  nonce: integer("nonce").notNull(),
  merkleRoot: text("merkle_root"),
});

export const insertBlockSchema = createInsertSchema(blocks).pick({
  index: true,
  timestamp: true,
  previousHash: true,
  hash: true,
  data: true,
  nonce: true,
  merkleRoot: true,
});

// Vehicles insured
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vehicleId: text("vehicle_id").notNull().unique(), // e.g., ZM-LUS-1234
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate").notNull(),
  owner: text("owner").notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  vehicleId: true,
  make: true,
  model: true,
  year: true,
  licensePlate: true,
  owner: true,
});

// Insurance policies
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  policyId: text("policy_id").notNull().unique(), // e.g., POL-2023-0018
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.vehicleId),
  coverageType: text("coverage_type").notNull(), // comprehensive, third-party
  premium: integer("premium").notNull(), // Amount in ZMW
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull(), // active, expired, cancelled
  createdAt: timestamp("created_at").notNull(),
});

export const insertPolicySchema = createInsertSchema(policies).pick({
  policyId: true,
  vehicleId: true,
  coverageType: true,
  premium: true,
  startDate: true,
  endDate: true,
  status: true,
  createdAt: true,
});

// Insurance claims
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  claimId: text("claim_id").notNull().unique(), // e.g., CLM-2023-0042
  policyId: text("policy_id").notNull().references(() => policies.policyId),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.vehicleId),
  incidentDate: date("incident_date").notNull(),
  incidentType: text("incident_type").notNull(), // collision, theft, fire, vandalism, other
  description: text("description").notNull(),
  damageEstimate: integer("damage_estimate").notNull(), // Amount in ZMW
  status: text("status").notNull(), // submitted, processing, approved, rejected, settled
  createdAt: timestamp("created_at").notNull(),
  evidence: jsonb("evidence"), // Links to evidence files or hashes
  blockIndex: integer("block_index"), // Reference to which block this claim is saved in
  transactionHash: text("transaction_hash"), // The transaction hash in the blockchain
});

export const insertClaimSchema = createInsertSchema(claims).omit({
  id: true,
  blockIndex: true,
  transactionHash: true,
});

// Define types for frontend usage
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Node = typeof nodes.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
